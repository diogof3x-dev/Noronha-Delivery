import { getAdminClient } from "./supabase/admin-client";
import { captureError } from "./observability";
import { sendPushToUser } from "./push";

/**
 * Quando pedido vai pra delivered:
 *  - concede pontos de fidelidade (1 ponto por R$ pago)
 *  - gera cupom de retorno VOLTAxxxx (10% off, R$10 max, 48h, max 1 uso)
 *  - push pro cliente com o código novo
 *
 * Fire-and-forget: NUNCA bloqueia o markDelivered.
 */
export async function grantPostDeliveryRewards(orderId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  try {
    await admin.rpc("award_loyalty_for_order", { p_order_id: orderId });

    const { data: couponId } = await admin.rpc("grant_return_coupon", {
      p_order_id: orderId,
    });
    if (!couponId) return;

    const { data: coupon } = await admin
      .from("coupons")
      .select("code, targeted_customer_id")
      .eq("id", couponId as string)
      .maybeSingle();
    if (!coupon?.code || !coupon.targeted_customer_id) return;

    await sendPushToUser(coupon.targeted_customer_id, {
      title: `🎁 Cupom · ${coupon.code}`,
      body: "10% OFF na próxima compra. Válido 48h. Toque pra usar.",
      url: "/app",
      tag: `coupon-${coupon.code}`,
    });
  } catch (e) {
    captureError(e, {
      message: "grantPostDeliveryRewards failed",
      tags: { order_id: orderId },
    });
  }
}
