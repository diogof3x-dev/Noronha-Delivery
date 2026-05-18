"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { refundPaymentIntent } from "@/lib/payments/stripe";
import { refundPixPayment } from "@/lib/payments/mercadopago";
import { captureError, captureMessage } from "@/lib/observability";
import { sendPushToUser } from "@/lib/push";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const Schema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(3).max(280),
});

const CANCELLABLE_STATUSES = ["pending", "confirmed", "preparing"];

export type CancelResult =
  | { ok: true; refunded: boolean }
  | { ok: false; error: string };

export async function cancelOrderAsCustomer(formData: FormData): Promise<CancelResult> {
  const parsed = Schema.safeParse({
    order_id: formData.get("order_id"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const rl = await consumeRateLimit(
    rateLimitKey("cancelOrder", user.id),
    { limit: 5, windowSeconds: 600, errorMessage: "Muitas tentativas. Aguarde." },
  );
  if (!rl.ok) return { ok: false, error: rl.error };

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, code, status, payment_method, payment_status, payment_id, customer_id, business_id, businesses(name, owner_id)",
    )
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order || order.customer_id !== user.id) {
    return { ok: false, error: "Sem permissão" };
  }
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return {
      ok: false,
      error: "Esse pedido já está em rota ou foi entregue — não dá pra cancelar mais",
    };
  }

  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "Service role não configurado" };

  // refund se já pago
  let refunded = false;
  if (order.payment_status === "paid" && order.payment_id) {
    try {
      if (order.payment_method === "card") {
        await refundPaymentIntent(order.payment_id, "requested_by_customer");
        refunded = true;
      } else if (order.payment_method === "pix") {
        await refundPixPayment(order.payment_id);
        refunded = true;
      }
    } catch (e) {
      captureError(e, {
        message: "customer cancel refund failed",
        tags: {
          order_id: order.id,
          order_code: order.code,
          payment_method: order.payment_method,
        },
      });
      return {
        ok: false,
        error: "Falha ao processar reembolso. Contate o suporte.",
      };
    }
  }

  // marca cancelado
  const { error } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: parsed.data.reason,
      payment_status: refunded ? "refunded" : order.payment_status,
    })
    .eq("id", order.id);
  if (error) return { ok: false, error: error.message };

  // notifica lojista
  const biz = order.businesses as { name?: string; owner_id?: string } | null;
  if (biz?.owner_id) {
    void sendPushToUser(biz.owner_id, {
      title: `Pedido cancelado · #${order.code}`,
      body: `Cliente cancelou. Motivo: ${parsed.data.reason}`,
      url: "/parceiro/painel/pedidos",
      tag: `cancel-${order.id}`,
    });
  }

  captureMessage(
    `Customer cancel: #${order.code} · ${refunded ? "refunded" : "unpaid"}`,
    "info",
    {
      order_id: order.id,
      order_code: order.code,
      reason: parsed.data.reason,
      payment_method: order.payment_method,
    },
  );

  revalidatePath(`/app/pedidos/${order.id}`);
  revalidatePath("/app/pedidos");
  revalidatePath("/parceiro/painel/pedidos");
  return { ok: true, refunded };
}
