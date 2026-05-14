"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

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
