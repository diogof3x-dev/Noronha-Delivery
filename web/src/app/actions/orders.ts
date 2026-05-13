"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { createPixCharge } from "@/lib/payments/mercadopago";
import { createPaymentIntent } from "@/lib/payments/stripe";

const CartItemSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  priceCents: z.number().int().min(0),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(500).optional(),
});

const CreateOrderSchema = z.object({
  businessId: z.string().uuid(),
  items: z.array(CartItemSchema).min(1).max(50),
  destinationKind: z.enum(["pousada", "praia", "barco", "outro"]),
  destinationLabel: z.string().max(300).optional(),
  paymentMethod: z.enum(["pix", "card", "cash"]),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type CreateOrderResult =
  | { ok: true; orderId: string; orderCode: string; pix?: { qrCode: string | null; copyPaste: string | null }; cardClientSecret?: string }
  | { ok: false; error: string };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = CreateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido. Revise os itens." };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra finalizar." };

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name, delivery_fee_cents, min_order_cents, category_id, is_active")
    .eq("id", parsed.data.businessId)
    .maybeSingle();
  if (bizErr || !business || !business.is_active) {
    return { ok: false, error: "Estabelecimento indisponível." };
  }

  const serviceIds = parsed.data.items.map((i) => i.serviceId);
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents, is_active, business_id")
    .in("id", serviceIds);

  const byId = new Map((services ?? []).map((s) => [s.id, s]));
  for (const it of parsed.data.items) {
    const s = byId.get(it.serviceId);
    if (!s || !s.is_active || s.business_id !== business.id) {
      return { ok: false, error: `Item indisponível: ${it.name}` };
    }
    if (s.price_cents !== it.priceCents) {
      return { ok: false, error: `Preço de "${s.name}" mudou. Atualize o carrinho.` };
    }
  }

  const subtotal = parsed.data.items.reduce(
    (acc, i) => acc + i.priceCents * i.quantity,
    0,
  );
  const deliveryFee = business.delivery_fee_cents ?? 0;
  const total = subtotal + deliveryFee;

  if (business.min_order_cents && subtotal < business.min_order_cents) {
    return { ok: false, error: "Pedido abaixo do mínimo do estabelecimento." };
  }

  const { data: rateRow, error: rateErr } = await supabase.rpc(
    "effective_take_rate_bps",
    {
      p_business_id: business.id,
      p_category_id: business.category_id ?? "",
    },
  );
  if (rateErr) {
    return { ok: false, error: "Não foi possível calcular a taxa. Tente novamente." };
  }
  const bps = rateRow ?? 1000;
  const platformFee = Math.round((subtotal * bps) / 10_000);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      business_id: business.id,
      status: "pending",
      subtotal_cents: subtotal,
      delivery_fee_cents: deliveryFee,
      discount_cents: 0,
      total_cents: total,
      platform_fee_cents: platformFee,
      destination_kind: parsed.data.destinationKind,
      destination_label: parsed.data.destinationLabel ?? null,
      destination_notes: parsed.data.notes ?? null,
      payment_method: parsed.data.paymentMethod,
      payment_status: parsed.data.paymentMethod === "cash" ? "pending" : "pending",
      placed_at: new Date().toISOString(),
      metadata: { take_rate_bps: bps },
    })
    .select("id, code")
    .single();
  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." };
  }

  const itemsPayload = parsed.data.items.map((i) => ({
    order_id: order.id,
    service_id: i.serviceId,
    name_snapshot: i.name,
    quantity: i.quantity,
    unit_price_cents: i.priceCents,
    total_cents: i.priceCents * i.quantity,
    notes: i.notes ?? null,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
  if (itemsErr) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Falha ao registrar itens." };
  }

  if (parsed.data.paymentMethod === "pix") {
    try {
      const charge = await createPixCharge({
        orderId: order.id,
        amountCents: total,
        payerEmail: user.email ?? "noronha@noreply.dev",
        description: `${business.name} · ${order.code}`,
      });
      await supabase
        .from("orders")
        .update({
          payment_id: charge.paymentId,
          metadata: {
            take_rate_bps: bps,
            pix_qr: charge.qrCodeBase64,
            pix_copy: charge.qrCodeCopyPaste,
            pix_expires: charge.expiresAt,
          },
        })
        .eq("id", order.id);
      revalidatePath(`/app/pedidos/${order.id}`);
      return {
        ok: true,
        orderId: order.id,
        orderCode: order.code,
        pix: { qrCode: charge.qrCodeBase64, copyPaste: charge.qrCodeCopyPaste },
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Falha PIX" };
    }
  }

  if (parsed.data.paymentMethod === "card") {
    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        orderId: order.id,
        amountCents: total,
        applicationFeeCents: platformFee,
        customerEmail: user.email ?? undefined,
      });
      await supabase
        .from("orders")
        .update({ payment_id: paymentIntentId })
        .eq("id", order.id);
      revalidatePath(`/app/pedidos/${order.id}`);
      return {
        ok: true,
        orderId: order.id,
        orderCode: order.code,
        cardClientSecret: clientSecret,
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Falha cartão" };
    }
  }

  revalidatePath(`/app/pedidos/${order.id}`);
  return { ok: true, orderId: order.id, orderCode: order.code };
}
