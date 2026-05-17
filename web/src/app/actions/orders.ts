"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { createPixCharge } from "@/lib/payments/mercadopago";
import { createPaymentIntent } from "@/lib/payments/stripe";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const CartOptionSchema = z.object({
  groupId: z.string().uuid(),
  groupName: z.string().min(1).max(120),
  optionId: z.string().uuid(),
  optionName: z.string().min(1).max(160),
  priceDeltaCents: z.number().int().min(0).max(50_000),
});

const CartItemSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  priceCents: z.number().int().min(0),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(500).optional(),
  options: z.array(CartOptionSchema).optional(),
});

const DestinationGeoSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
});

const CreateOrderSchema = z.object({
  businessId: z.string().uuid(),
  items: z.array(CartItemSchema).min(1).max(50),
  destinationKind: z.enum(["pousada", "praia", "barco", "outro"]),
  destinationLabel: z.string().max(300).optional(),
  destinationGeo: DestinationGeoSchema.optional(),
  paymentMethod: z.enum(["pix", "card", "cash"]),
  notes: z.string().max(500).optional(),
  couponCode: z.string().max(40).optional(),
  cpfNota: z.string().max(14).optional(),
});

const SERVICE_FEE_BPS = 199;

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderCode: string;
      pix?: { qrCode: string | null; copyPaste: string | null };
      cardClientSecret?: string;
    }
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

  const rl = await consumeRateLimit(rateLimitKey("createOrder", user.id), {
    limit: 5,
    windowSeconds: 60,
    errorMessage: "Você está fazendo pedidos muito rápido. Espere um minuto.",
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name, delivery_fee_cents, min_order_cents, category_id, is_active, owner_id")
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
    const optionsDelta = (it.options ?? []).reduce((acc, o) => acc + o.priceDeltaCents, 0);
    const expectedUnit = s.price_cents + optionsDelta;
    if (expectedUnit !== it.priceCents) {
      return { ok: false, error: `Preço de "${s.name}" mudou. Atualize o carrinho.` };
    }
  }

  const subtotal = parsed.data.items.reduce(
    (acc, i) => acc + i.priceCents * i.quantity,
    0,
  );
  const deliveryFee = business.delivery_fee_cents ?? 0;

  if (business.min_order_cents && subtotal < business.min_order_cents) {
    return { ok: false, error: "Pedido abaixo do mínimo do estabelecimento." };
  }

  let couponDiscount = 0;
  let couponCodeFinal: string | null = null;
  if (parsed.data.couponCode) {
    const { data: cpData, error: cpErr } = await supabase.rpc("validate_coupon", {
      p_code: parsed.data.couponCode,
      p_subtotal_cents: subtotal,
      p_business_id: business.id,
    });
    if (cpErr) return { ok: false, error: "Não foi possível aplicar o cupom" };
    const row = (cpData ?? [])[0];
    if (!row || row.error || !row.coupon_id) {
      return { ok: false, error: row?.error ?? "Cupom inválido" };
    }
    couponDiscount = row.discount_cents;
    couponCodeFinal = parsed.data.couponCode.toUpperCase();
  }

  const serviceFee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
  const total = Math.max(0, subtotal - couponDiscount) + deliveryFee + serviceFee;

  const { data: rateRow, error: rateErr } = await supabase.rpc("effective_take_rate_bps", {
    p_business_id: business.id,
    p_category_id: business.category_id ?? "",
  });
  if (rateErr) {
    return { ok: false, error: "Não foi possível calcular a taxa. Tente novamente." };
  }
  const bps = rateRow ?? 1000;
  const platformFee = Math.round(((subtotal - couponDiscount) * bps) / 10_000) + serviceFee;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      business_id: business.id,
      status: "pending",
      subtotal_cents: subtotal,
      delivery_fee_cents: deliveryFee,
      discount_cents: couponDiscount,
      coupon_discount_cents: couponDiscount,
      coupon_code: couponCodeFinal,
      service_fee_cents: serviceFee,
      cpf_nota: parsed.data.cpfNota?.replace(/\D/g, "") || null,
      total_cents: total,
      platform_fee_cents: platformFee,
      destination_kind: parsed.data.destinationKind,
      destination_label: parsed.data.destinationLabel ?? null,
      destination_geo: parsed.data.destinationGeo
        ? {
            lat: parsed.data.destinationGeo.lat,
            lng: parsed.data.destinationGeo.lng,
            accuracy: parsed.data.destinationGeo.accuracy ?? null,
          }
        : null,
      destination_notes: parsed.data.notes ?? null,
      payment_method: parsed.data.paymentMethod,
      payment_status: "pending",
      placed_at: new Date().toISOString(),
      metadata: { take_rate_bps: bps, service_fee_bps: SERVICE_FEE_BPS },
    })
    .select("id, code")
    .single();
  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." };
  }

  void notifyMerchantNewOrder(business.owner_id, business.name, order.code, total);

  const itemsPayload = parsed.data.items.map((i) => ({
    order_id: order.id,
    service_id: i.serviceId,
    name_snapshot: i.name,
    quantity: i.quantity,
    unit_price_cents: i.priceCents,
    total_cents: i.priceCents * i.quantity,
    notes: i.notes ?? null,
    customizations: i.options?.length
      ? {
          options: i.options.map((o) => ({
            group: o.groupName,
            option: o.optionName,
            delta_cents: o.priceDeltaCents,
          })),
        }
      : {},
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
  if (itemsErr) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Falha ao registrar itens." };
  }

  if (parsed.data.paymentMethod === "pix") {
    // tenta criar PIX com retry simples
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
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
              service_fee_bps: SERVICE_FEE_BPS,
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
        lastErr = e instanceof Error ? e : new Error("Falha PIX");
        console.error(`[createOrder] PIX attempt ${attempt + 1} failed`, e);
      }
    }
    // PIX falhou 2x — pedido fica salvo pra retentativa manual via /app/pedidos/[id]
    revalidatePath(`/app/pedidos/${order.id}`);
    return {
      ok: true,
      orderId: order.id,
      orderCode: order.code,
    };
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

async function notifyMerchantNewOrder(
  ownerId: string | null,
  businessName: string,
  orderCode: string,
  totalCents: number,
) {
  if (!ownerId) return;
  try {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(ownerId, {
      title: `Pedido #${orderCode} · ${businessName}`,
      body: `Novo pedido de R$ ${(totalCents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}. Toque pra abrir o painel.`,
      url: "/parceiro/painel/pedidos",
      tag: `order-${orderCode}`,
    });
  } catch (e) {
    const { captureError } = await import("@/lib/observability");
    captureError(e, { message: "notifyMerchantNewOrder failed", tags: { owner_id: ownerId } });
  }
}
