"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { captureError, captureMessage } from "@/lib/observability";

const Schema = z.object({
  order_id: z.string().uuid(),
  reason: z.enum([
    "customer_no_answer",
    "wrong_address",
    "store_closed",
    "vehicle_issue",
    "safety",
    "other",
  ]),
  details: z.string().max(500).optional(),
});

const REASON_LABEL: Record<string, string> = {
  customer_no_answer: "Cliente não responde",
  wrong_address: "Endereço errado",
  store_closed: "Loja fechada/sem produto",
  vehicle_issue: "Problema no veículo",
  safety: "🚨 Segurança/acidente",
  other: "Outro",
};

export async function reportOrderProblem(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = Schema.safeParse({
    order_id: formData.get("order_id"),
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "Service role não configurado" };

  // valida que o motoboy é dono da corrida
  const { data: order } = await admin
    .from("orders")
    .select("id, code, driver_id, business_id")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order || order.driver_id !== user.id) {
    return { ok: false, error: "Sem permissão" };
  }

  try {
    // grava no metadata da order pra histórico
    const { data: cur } = await admin
      .from("orders")
      .select("metadata")
      .eq("id", parsed.data.order_id)
      .maybeSingle();
    const prevMeta = (cur?.metadata as Record<string, unknown> | null) ?? {};
    const reports =
      (prevMeta.driver_reports as Array<Record<string, unknown>>) ?? [];
    reports.push({
      at: new Date().toISOString(),
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
      driver_id: user.id,
    });
    await admin
      .from("orders")
      .update({
        metadata: { ...prevMeta, driver_reports: reports } as never,
      })
      .eq("id", parsed.data.order_id);

    // captura no Sentry / observability como warning
    captureMessage(
      `Driver report: ${REASON_LABEL[parsed.data.reason]} · pedido #${order.code}`,
      parsed.data.reason === "safety" ? "error" : "warning",
      {
        order_id: order.id,
        order_code: order.code,
        driver_id: user.id,
        business_id: order.business_id,
        reason: parsed.data.reason,
      },
    );

    revalidatePath("/entregador/painel/entregas");
    revalidatePath(`/entregador/painel/entregas/${order.id}`);
    return { ok: true };
  } catch (e) {
    captureError(e, {
      message: "reportOrderProblem failed",
      tags: { order_id: parsed.data.order_id, driver_id: user.id },
    });
    return { ok: false, error: "Falha ao reportar" };
  }
}
