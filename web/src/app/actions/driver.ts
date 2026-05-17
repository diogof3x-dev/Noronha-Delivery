"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import { notifyOrderStatusChange } from "@/lib/email-helpers";

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

  // pega o pedido pronto pra retirada mais recente (lojista acabou de liberar)
  const { data: candidate } = await supabase
    .from("orders")
    .select("id, code, status")
    .is("driver_id", null)
    .in("status", ["ready", "preparing", "confirmed"])
    .order("status", { ascending: false }) // ready > preparing > confirmed (ordem alfabética inversa funciona)
    .order("placed_at", { ascending: false }) // mais recente primeiro
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
  void notifyOrderStatusChange(candidate.id, "driver_assigned");
  return { ok: true, orderId: candidate.id, orderCode: candidate.code };
}

export async function claimSpecificOrder(formData: FormData): Promise<ClaimResult> {
  const orderId = String(formData.get("order_id") ?? "");
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

  const { data: order, error: ferr } = await supabase
    .from("orders")
    .select("id, code")
    .eq("id", orderId)
    .is("driver_id", null)
    .maybeSingle();
  if (ferr || !order) return { ok: false, error: "Pedido não disponível" };

  const { error } = await supabase
    .from("orders")
    .update({ driver_id: user.id })
    .eq("id", orderId)
    .is("driver_id", null);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/entregador/painel/entregas");
  revalidatePath(`/app/pedidos/${orderId}`);
  void notifyOrderStatusChange(orderId, "driver_assigned");
  return { ok: true, orderId: order.id, orderCode: order.code };
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
  revalidatePath(`/app/pedidos/${orderId}`);
  void notifyOrderStatusChange(orderId, "in_transit");
}

export type DeliverResult = { ok: boolean; error?: string };

export async function markDelivered(_prev: DeliverResult, formData: FormData): Promise<DeliverResult> {
  const orderId = String(formData.get("order_id") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!orderId) return { ok: false, error: "Pedido inválido" };
  if (code.length !== 4) return { ok: false, error: "Código tem 4 dígitos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, delivery_code, status, driver_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.driver_id !== user.id) {
    return { ok: false, error: "Pedido não atribuído a você" };
  }
  if (!["in_transit", "ready"].includes(order.status)) {
    return { ok: false, error: "Status do pedido não permite confirmação" };
  }
  if (order.delivery_code !== code) {
    return { ok: false, error: "Código inválido. Peça pro cliente conferir." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("driver_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/entregador/painel/entregas");
  revalidatePath("/entregador/painel/historico");
  revalidatePath(`/app/pedidos/${orderId}`);
  void notifyOrderStatusChange(orderId, "delivered");
  return { ok: true };
}

export async function claimAndRedirect(): Promise<void> {
  const res = await claimNextDelivery();
  if (res.ok) {
    redirect(`/entregador/painel/entregas`);
  }
}
