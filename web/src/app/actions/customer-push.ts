"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { sendPushToManyUsers } from "@/lib/push";
import { captureError } from "@/lib/observability";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const CampaignSchema = z.object({
  business_id: z.string().uuid(),
  title: z.string().min(3).max(80),
  body: z.string().min(5).max(220),
  url: z.string().max(300).optional(),
  segment: z.enum(["all", "vip", "inactive_30d", "new_30d", "first_order_only"]),
});

export type CustomerPushResult =
  | { ok: true; sent: number; eligible: number; creditsLeft: number }
  | { ok: false; error: string };

export async function sendCustomerPushCampaign(
  formData: FormData,
): Promise<CustomerPushResult> {
  const parsed = CampaignSchema.safeParse({
    business_id: formData.get("business_id"),
    title: formData.get("title"),
    body: formData.get("body"),
    url: formData.get("url") || undefined,
    segment: formData.get("segment"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const rl = await consumeRateLimit(
    rateLimitKey("customerPushCampaign", user.id),
    { limit: 5, windowSeconds: 3600, errorMessage: "Muitas campanhas na última hora." },
  );
  if (!rl.ok) return { ok: false, error: rl.error };

  // ownership guard
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, owner_id, slug, type")
    .eq("id", parsed.data.business_id)
    .maybeSingle();
  if (!biz || biz.owner_id !== user.id) return { ok: false, error: "Sem permissão" };

  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "Service role não configurado" };

  // saldo de créditos
  const { data: credits } = await admin
    .from("business_push_credits")
    .select("*")
    .eq("business_id", biz.id)
    .maybeSingle();
  if (!credits) {
    await admin.from("business_push_credits").insert({ business_id: biz.id });
  }
  const free = credits?.free_remaining ?? 500;
  const paid = credits?.paid_balance ?? 0;
  const totalCredits = free + paid;

  // lista customers da loja conforme segmento
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

  let q = admin
    .from("mv_business_customer_stats")
    .select(
      "customer_id, paid_orders_count, total_spent_cents, last_order_at, first_order_at",
    )
    .eq("business_id", biz.id)
    .gt("paid_orders_count", 0);

  if (parsed.data.segment === "vip") {
    q = q.order("total_spent_cents", { ascending: false }).limit(50);
  } else if (parsed.data.segment === "inactive_30d") {
    q = q.lt("last_order_at", thirtyDaysAgo);
  } else if (parsed.data.segment === "new_30d") {
    q = q.gte("first_order_at", thirtyDaysAgo);
  } else if (parsed.data.segment === "first_order_only") {
    q = q.eq("paid_orders_count", 1);
  }

  const { data: targetRows } = await q;
  const customerIds = (targetRows ?? []).map((r) => r.customer_id);
  const eligibleCount = customerIds.length;

  if (eligibleCount === 0) {
    return { ok: false, error: "Nenhum cliente no segmento escolhido" };
  }

  if (eligibleCount > totalCredits) {
    return {
      ok: false,
      error: `Saldo insuficiente: ${eligibleCount} clientes alvo, ${totalCredits} créditos. Faça upgrade ou escolha segmento menor.`,
    };
  }

  // cria campanha
  const { data: campaign, error: campErr } = await admin
    .from("business_push_campaigns")
    .insert({
      business_id: biz.id,
      created_by: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? null,
      target_filter: { segment: parsed.data.segment } as never,
      target_count: eligibleCount,
      status: "sending",
    })
    .select("id")
    .single();
  if (campErr || !campaign) {
    return { ok: false, error: campErr?.message ?? "Falha ao criar campanha" };
  }

  // dispara push
  let sent = 0;
  try {
    const defaultUrl = biz.slug && biz.type
      ? `/app/${
          biz.type === "pousada"
            ? "pousada"
            : biz.type === "operador_passeio"
              ? "passeio"
              : biz.type === "locadora"
                ? "aluguel"
                : biz.type === "servico"
                  ? "servico"
                  : biz.type === "residencia"
                    ? "casa"
                    : "restaurante"
        }/${biz.slug}`
      : "/app";
    sent = await sendPushToManyUsers(customerIds, {
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url || defaultUrl,
      tag: `campaign-${campaign.id}`,
    });
  } catch (e) {
    captureError(e, {
      message: "customer push campaign send failed",
      tags: { campaign_id: campaign.id, business_id: biz.id },
    });
  }

  // debita créditos (usa free antes do paid)
  const freeUsed = Math.min(eligibleCount, free);
  const paidUsed = eligibleCount - freeUsed;
  await admin
    .from("business_push_credits")
    .update({
      free_remaining: free - freeUsed,
      paid_balance: paid - paidUsed,
      total_used: (credits?.total_used ?? 0) + eligibleCount,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", biz.id);

  // marca campanha como enviada
  await admin
    .from("business_push_campaigns")
    .update({
      status: "sent",
      sent_count: sent,
      credits_used: eligibleCount,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  revalidatePath("/parceiro/painel/clientes");
  return {
    ok: true,
    sent,
    eligible: eligibleCount,
    creditsLeft: free + paid - eligibleCount,
  };
}
