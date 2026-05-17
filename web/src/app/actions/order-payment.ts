"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { createPixCharge } from "@/lib/payments/mercadopago";
import { createPaymentIntent } from "@/lib/payments/stripe";

const Schema = z.object({
  order_id: z.string().uuid(),
});

export type RegenerateResult =
  | {
      ok: true;
      pix?: { qrCode: string | null; copyPaste: string | null };
      cardClientSecret?: string;
    }
  | { ok: false; error: string };

export async function regenerateOrderPayment(formData: FormData): Promise<RegenerateResult> {
  const parsed = Schema.safeParse({ order_id: formData.get("order_id") });
  if (!parsed.success) return { ok: false, error: "Pedido inválido" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login" };

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, code, total_cents, customer_id, payment_method, payment_status, status, metadata, platform_fee_cents, businesses(name)",
    )
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado" };
  if (order.customer_id !== user.id) return { ok: false, error: "Sem permissão" };
  if (order.payment_status === "paid") return { ok: false, error: "Pedido já está pago" };
  if (order.status === "cancelled" || order.status === "refunded") {
    return { ok: false, error: "Pedido cancelado" };
  }

  const biz = order.businesses as { name?: string } | null;

  if (order.payment_method === "pix") {
    try {
      const charge = await createPixCharge({
        orderId: order.id,
        amountCents: order.total_cents,
        payerEmail: user.email ?? "noronha@noreply.dev",
        description: `${biz?.name ?? "Pedido"} · ${order.code}`,
      });
      const prevMeta = (order.metadata as Record<string, unknown> | null) ?? {};
      await supabase
        .from("orders")
        .update({
          payment_id: charge.paymentId,
          metadata: {
            ...prevMeta,
            pix_qr: charge.qrCodeBase64,
            pix_copy: charge.qrCodeCopyPaste,
            pix_expires: charge.expiresAt,
          },
        })
        .eq("id", order.id);
      revalidatePath(`/app/pedidos/${order.id}`);
      return {
        ok: true,
        pix: { qrCode: charge.qrCodeBase64, copyPaste: charge.qrCodeCopyPaste },
      };
    } catch (e) {
      console.error("[regenerateOrderPayment] PIX failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Falha ao gerar PIX. Tente em alguns segundos." };
    }
  }

  if (order.payment_method === "card") {
    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        orderId: order.id,
        amountCents: order.total_cents,
        applicationFeeCents: order.platform_fee_cents,
        customerEmail: user.email ?? undefined,
      });
      await supabase.from("orders").update({ payment_id: paymentIntentId }).eq("id", order.id);
      revalidatePath(`/app/pedidos/${order.id}`);
      return { ok: true, cardClientSecret: clientSecret };
    } catch (e) {
      console.error("[regenerateOrderPayment] card failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Falha ao gerar cobrança" };
    }
  }

  return { ok: false, error: "Método de pagamento sem cobrança automática" };
}
