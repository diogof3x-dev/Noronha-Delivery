"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { captureError, captureMessage } from "@/lib/observability";

const Schema = z.object({
  order_id: z.string().uuid(),
  reason: z.enum([
    "wrong_item",
    "missing_item",
    "cold_or_bad",
    "not_delivered",
    "wrong_address",
    "long_delay",
    "rude_driver",
    "other",
  ]),
  details: z.string().max(600).optional(),
});

const REASON_LABEL: Record<string, string> = {
  wrong_item: "Item errado",
  missing_item: "Faltou item",
  cold_or_bad: "Chegou frio ou em mau estado",
  not_delivered: "🚨 Não recebi o pedido",
  wrong_address: "Endereço errado",
  long_delay: "Demorou demais",
  rude_driver: "Motoboy mal-educado",
  other: "Outro",
};

export async function reportCustomerProblem(
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

  const { data: order } = await admin
    .from("orders")
    .select("id, code, customer_id, business_id, metadata")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order || order.customer_id !== user.id) {
    return { ok: false, error: "Sem permissão" };
  }

  try {
    const prevMeta = (order.metadata as Record<string, unknown> | null) ?? {};
    const reports =
      (prevMeta.customer_reports as Array<Record<string, unknown>>) ?? [];
    reports.push({
      at: new Date().toISOString(),
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
      customer_id: user.id,
    });
    await admin
      .from("orders")
      .update({ metadata: { ...prevMeta, customer_reports: reports } as never })
      .eq("id", order.id);

    captureMessage(
      `Customer report: ${REASON_LABEL[parsed.data.reason]} · pedido #${order.code}`,
      parsed.data.reason === "not_delivered" ? "error" : "warning",
      {
        order_id: order.id,
        order_code: order.code,
        customer_id: user.id,
        business_id: order.business_id,
        reason: parsed.data.reason,
      },
    );

    revalidatePath(`/app/pedidos/${order.id}`);
    revalidatePath("/app/pedidos");
    return { ok: true };
  } catch (e) {
    captureError(e, {
      message: "reportCustomerProblem failed",
      tags: { order_id: parsed.data.order_id, customer_id: user.id },
    });
    return { ok: false, error: "Falha ao reportar" };
  }
}
