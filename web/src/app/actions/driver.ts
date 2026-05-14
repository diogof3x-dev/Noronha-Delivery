"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";

export type ClaimResult =
  | { ok: true; orderId: string; orderCode: string }
  | { ok: false; error: string };

export async function claimNextDelivery(): Promise<ClaimResult> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "driver" && profile.role !== "admin")) {
    return { ok: false, error: "Sem permissão de entregador" };
  }

  const { data: candidate } = await supabase
    .from("orders")
    .select("id, code, status")
    .is("driver_id", null)
    .in("status", ["confirmed", "preparing", "ready"])
    .order("placed_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!candidate) {
    return { ok: false, error: "Nenhuma corrida disponível agora" };
  }

  const { error } = await supabase
    .from("orders")
    .update({ driver_id: user.id })
    .eq("id", candidate.id)
    .is("driver_id", null);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/entregador/painel/entregas");
  revalidatePath(`/app/pedidos/${candidate.id}`);
  return { ok: true, orderId: candidate.id, orderCode: candidate.code };
}

export async function markPickedUp(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("orders")
    .update({ status: "in_transit" })
    .eq("id", orderId)
    .eq("driver_id", user.id)
    .in("status", ["ready", "preparing", "confirmed"]);
  revalidatePath("/entregador/painel/entregas");
}

export async function markDelivered(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("driver_id", user.id)
    .in("status", ["in_transit", "ready"]);
  revalidatePath("/entregador/painel/entregas");
  revalidatePath("/entregador/painel/historico");
}

export async function claimAndRedirect(): Promise<void> {
  const res = await claimNextDelivery();
  if (res.ok) {
    redirect(`/entregador/painel/entregas`);
  }
}
