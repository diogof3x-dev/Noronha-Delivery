import { sendPushToUser, sendPushToManyUsers } from "./push";
import { getAdminClient } from "./supabase/admin-client";
import { captureError } from "./observability";

const STATUS_BODY: Record<string, string> = {
  confirmed: "✅ Pedido aceito pelo estabelecimento!",
  preparing: "👨‍🍳 Estabelecimento começou a preparar",
  ready: "📦 Pronto pra retirada — motoboy a caminho",
  in_transit: "🛵 Entregador saiu pra entregar",
  delivered: "🎉 Entregue! Avalie sua experiência",
  cancelled: "❌ Pedido cancelado",
  refunded: "💸 Reembolso processado",
};

export async function notifyCustomerOrderStatus(orderId: string, newStatus: string) {
  try {
    const admin = getAdminClient();
    if (!admin) return;
    const body = STATUS_BODY[newStatus];
    if (!body) return;

    const { data: order } = await admin
      .from("orders")
      .select("code, customer_id, businesses(name)")
      .eq("id", orderId)
      .maybeSingle();
    if (!order?.customer_id) return;

    const biz = order.businesses as { name?: string } | null;
    await sendPushToUser(order.customer_id, {
      title: `Pedido #${order.code} · ${biz?.name ?? "Noronha Delivery"}`,
      body,
      url: `/app/pedidos/${orderId}`,
      tag: `order-${orderId}-${newStatus}`,
    });
  } catch (e) {
    captureError(e, { message: "notifyCustomerOrderStatus failed", tags: { order_id: orderId, status: newStatus } });
  }
}

export async function notifyAvailableDrivers(orderId: string) {
  try {
    const admin = getAdminClient();
    if (!admin) return;

    const { data: order } = await admin
      .from("orders")
      .select("code, business_id, total_cents, businesses(name, district)")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const { data: drivers } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "driver")
      .eq("is_online", true)
      .limit(50);
    if (!drivers?.length) return;

    const biz = order.businesses as { name?: string; district?: string } | null;
    const valorR$ = (order.total_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    await sendPushToManyUsers(
      drivers.map((d) => d.id),
      {
        title: `🛵 Corrida disponível · R$ ${valorR$}`,
        body: `${biz?.name ?? "Loja"}${biz?.district ? " (" + biz.district + ")" : ""} · pedido #${order.code}`,
        url: "/entregador/painel/entregas",
        tag: `available-${orderId}`,
      },
    );
  } catch (e) {
    captureError(e, { message: "notifyAvailableDrivers failed", tags: { order_id: orderId } });
  }
}
