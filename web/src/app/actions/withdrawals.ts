"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const RequestSchema = z.object({
  business_id: z.string().uuid(),
  amount_cents: z.coerce.number().int().min(1000),
});

export type RequestWithdrawalResult = { ok: true } | { ok: false; error: string };

export async function requestWithdrawal(formData: FormData): Promise<RequestWithdrawalResult> {
  const parsed = RequestSchema.safeParse({
    business_id: formData.get("business_id"),
    amount_cents: formData.get("amount_cents"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const rl = await consumeRateLimit(rateLimitKey("requestWithdrawal", user.id), {
    limit: 3,
    windowSeconds: 3600,
    errorMessage: "Muitas solicitações na última hora.",
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, owner_id, payout_pix_key, payout_pix_kind")
    .eq("id", parsed.data.business_id)
    .maybeSingle();
  if (!biz || biz.owner_id !== user.id) {
    return { ok: false, error: "Sem permissão sobre essa loja" };
  }
  if (!biz.payout_pix_key || !biz.payout_pix_kind) {
    return { ok: false, error: "Cadastre a chave PIX em Minha loja antes de sacar" };
  }

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("id, balance_cents")
    .eq("business_id", parsed.data.business_id)
    .maybeSingle();
  if (!account || (account.balance_cents ?? 0) < parsed.data.amount_cents) {
    return { ok: false, error: "Saldo insuficiente" };
  }

  const { count: pendingCount } = await supabase
    .from("withdrawal_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", parsed.data.business_id)
    .eq("status", "requested");
  if ((pendingCount ?? 0) > 0) {
    return { ok: false, error: "Você já tem um saque pendente. Aguarde aprovação." };
  }

  const { error } = await supabase.from("withdrawal_requests").insert({
    account_id: account.id,
    business_id: parsed.data.business_id,
    requested_by: user.id,
    amount_cents: parsed.data.amount_cents,
    pix_key: biz.payout_pix_key,
    pix_kind: biz.payout_pix_kind,
    status: "requested",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/vendas");
  revalidatePath("/super-admin/saques");
  return { ok: true };
}

const DriverRequestSchema = z.object({
  amount_cents: z.coerce.number().int().min(1000),
});

export async function requestDriverWithdrawal(formData: FormData): Promise<RequestWithdrawalResult> {
  const parsed = DriverRequestSchema.safeParse({
    amount_cents: formData.get("amount_cents"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const rl = await consumeRateLimit(rateLimitKey("requestDriverWithdrawal", user.id), {
    limit: 3,
    windowSeconds: 3600,
    errorMessage: "Muitas solicitações na última hora.",
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  const { data: profile } = await supabase
    .from("profiles")
    .select("pix_value, pix_kind, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "driver" && profile?.role !== "admin") {
    return { ok: false, error: "Apenas motoboys podem solicitar esse saque" };
  }
  if (!profile?.pix_value || !profile?.pix_kind) {
    return { ok: false, error: "Cadastre a chave PIX em Meu cadastro antes de sacar" };
  }

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("id, balance_cents")
    .eq("owner_id", user.id)
    .is("business_id", null)
    .maybeSingle();
  if (!account || (account.balance_cents ?? 0) < parsed.data.amount_cents) {
    return { ok: false, error: "Saldo insuficiente" };
  }

  const { count: pendingCount } = await supabase
    .from("withdrawal_requests")
    .select("id", { count: "exact", head: true })
    .eq("requested_by", user.id)
    .is("business_id", null)
    .eq("status", "requested");
  if ((pendingCount ?? 0) > 0) {
    return { ok: false, error: "Você já tem um saque pendente. Aguarde aprovação." };
  }

  const { error } = await supabase.from("withdrawal_requests").insert({
    account_id: account.id,
    business_id: null,
    requested_by: user.id,
    amount_cents: parsed.data.amount_cents,
    pix_key: profile.pix_value,
    pix_kind: profile.pix_kind,
    status: "requested",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/entregador/painel/ganhos");
  revalidatePath("/super-admin/saques");
  return { ok: true };
}

async function requireAdmin() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { error: "Sem permissão" as const };
  return { supabase, user };
}

export async function approveWithdrawal(formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return;
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;

  const { data: w } = await access.supabase!
    .from("withdrawal_requests")
    .select("id, account_id, amount_cents, status")
    .eq("id", id)
    .maybeSingle();
  if (!w || w.status !== "requested") return;

  await access.supabase!
    .from("withdrawal_requests")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);

  const { data: acc } = await access.supabase!
    .from("wallet_accounts")
    .select("balance_cents")
    .eq("id", w.account_id)
    .maybeSingle();
  const newBalance = Math.max(0, (acc?.balance_cents ?? 0) - w.amount_cents);
  await access.supabase!
    .from("wallet_accounts")
    .update({ balance_cents: newBalance, updated_at: new Date().toISOString() })
    .eq("id", w.account_id);
  await access.supabase!.from("wallet_transactions").insert({
    account_id: w.account_id,
    type: "withdrawal",
    amount_cents: -w.amount_cents,
    balance_after_cents: newBalance,
    withdrawal_id: w.id,
    description: "Saque PIX aprovado",
  });
  revalidatePath("/super-admin/saques");
}

export async function rejectWithdrawal(formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return;
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 200);
  if (!z.string().uuid().safeParse(id).success) return;
  await access.supabase!
    .from("withdrawal_requests")
    .update({ status: "rejected", rejection_reason: reason || "Sem motivo" })
    .eq("id", id);
  revalidatePath("/super-admin/saques");
}
