"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { notifyOrderStatusChange } from "@/lib/email-helpers";
import { notifyCustomerOrderStatus, notifyAvailableDrivers } from "@/lib/order-push";
import { grantPostDeliveryRewards } from "@/lib/post-delivery-rewards";

const NextSchema = z.object({
  order_id: z.string().uuid(),
  next: z.enum(["confirmed", "preparing", "ready", "in_transit", "delivered", "cancelled"]),
});

async function ensureMerchantAccess(orderId: string) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada" as const };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, business_id, driver_id, businesses(owner_id)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Pedido não encontrado" as const };

  const ownerId = (order.businesses as { owner_id?: string } | null)?.owner_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  if (!isAdmin && ownerId !== user.id) {
    return { error: "Sem permissão" as const };
  }
  return { supabase, order };
}

export async function moveOrderStatus(formData: FormData): Promise<void> {
  const parsed = NextSchema.safeParse({
    order_id: formData.get("order_id"),
    next: formData.get("next"),
  });
  if (!parsed.success) return;

  const access = await ensureMerchantAccess(parsed.data.order_id);
  if ("error" in access) return;

  const now = new Date().toISOString();
  const update: {
    status: typeof parsed.data.next;
    confirmed_at?: string;
    preparing_at?: string;
    ready_at?: string;
    in_transit_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
  } = { status: parsed.data.next };

  if (parsed.data.next === "confirmed") update.confirmed_at = now;
  if (parsed.data.next === "preparing") update.preparing_at = now;
  if (parsed.data.next === "ready") update.ready_at = now;
  if (parsed.data.next === "in_transit") update.in_transit_at = now;
  if (parsed.data.next === "delivered") update.delivered_at = now;
  if (parsed.data.next === "cancelled") update.cancelled_at = now;

  await access.supabase!.from("orders").update(update).eq("id", parsed.data.order_id);
  revalidatePath("/parceiro/painel/pedidos");
  revalidatePath(`/app/pedidos/${parsed.data.order_id}`);
  void notifyOrderStatusChange(parsed.data.order_id, parsed.data.next);
  void notifyCustomerOrderStatus(parsed.data.order_id, parsed.data.next);
  if (parsed.data.next === "ready" && !access.order.driver_id) {
    void notifyAvailableDrivers(parsed.data.order_id);
  }
  if (parsed.data.next === "delivered") {
    void grantPostDeliveryRewards(parsed.data.order_id);
  }
}
