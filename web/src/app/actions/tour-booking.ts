"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { createPixCharge } from "@/lib/payments/mercadopago";
import { createPaymentIntent } from "@/lib/payments/stripe";

const SERVICE_FEE_BPS = 199;

const Schema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  sessionId: z.string().uuid(),
  paxCount: z.number().int().min(1).max(50),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerWhatsapp: z.string().max(30).optional().or(z.literal("")),
  paymentMethod: z.enum(["pix", "card"]),
  notes: z.string().max(500).optional(),
});

export type CreateTourBookingResult =
  | {
      ok: true;
      bookingId: string;
      bookingCode: string;
      pix?: { qrCode: string | null; copyPaste: string | null };
      cardClientSecret?: string;
    }
  | { ok: false; error: string };

export async function createTourBooking(
  input: z.infer<typeof Schema>,
): Promise<CreateTourBookingResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra reservar" };

  const { data: session } = await supabase
    .from("tour_sessions")
    .select("id, service_id, business_id, capacity, sold_pax, start_at, is_active")
    .eq("id", parsed.data.sessionId)
    .maybeSingle();
  if (
    !session ||
    !session.is_active ||
    session.service_id !== parsed.data.serviceId ||
    session.business_id !== parsed.data.businessId
  ) {
    return { ok: false, error: "Sessão indisponível" };
  }
  const spotsLeft = Math.max(0, session.capacity - session.sold_pax);
  if (parsed.data.paxCount > spotsLeft) {
    return {
      ok: false,
      error: `Restam apenas ${spotsLeft} vaga${spotsLeft === 1 ? "" : "s"} nessa sessão`,
    };
  }
  if (new Date(session.start_at) < new Date()) {
    return { ok: false, error: "Sessão já passou" };
  }

  const { data: svc } = await supabase
    .from("services")
    .select("id, price_cents, is_active, business_id, kind, name")
    .eq("id", parsed.data.serviceId)
    .maybeSingle();
  if (!svc || !svc.is_active || svc.kind !== "tour" || svc.business_id !== parsed.data.businessId) {
    return { ok: false, error: "Passeio indisponível" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, category_id, is_active")
    .eq("id", parsed.data.businessId)
    .maybeSingle();
  if (!business || !business.is_active) {
    return { ok: false, error: "Operadora indisponível" };
  }

  const unit = svc.price_cents;
  const subtotal = unit * parsed.data.paxCount;
  const serviceFee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
  const total = subtotal + serviceFee;

  const { data: rateRow } = await supabase.rpc("effective_take_rate_bps", {
    p_business_id: business.id,
    p_category_id: business.category_id ?? "",
  });
  const bps = rateRow ?? 1000;
  const platformFee = Math.round((subtotal * bps) / 10_000) + serviceFee;

  const { data: booking, error: bookingErr } = await supabase
    .from("tour_bookings")
    .insert({
      business_id: business.id,
      service_id: svc.id,
      session_id: session.id,
      customer_id: user.id,
      customer_name: parsed.data.customerName.trim(),
      customer_email: parsed.data.customerEmail?.trim() || null,
      customer_whatsapp: parsed.data.customerWhatsapp?.trim() || null,
      pax_count: parsed.data.paxCount,
      unit_price_cents: unit,
      total_cents: total,
      platform_fee_cents: platformFee,
      status: "requested",
      payment_method: parsed.data.paymentMethod,
      payment_status: "pending",
      notes: parsed.data.notes?.trim() || null,
      metadata: { take_rate_bps: bps, service_fee_bps: SERVICE_FEE_BPS, subtotal_cents: subtotal },
    })
    .select("id, code")
    .single();
  if (bookingErr || !booking) {
    return { ok: false, error: bookingErr?.message ?? "Falha ao reservar" };
  }

  if (parsed.data.paymentMethod === "pix") {
    try {
      const charge = await createPixCharge({
        orderId: booking.id,
        amountCents: total,
        payerEmail: user.email ?? parsed.data.customerEmail ?? "noronha@noreply.dev",
        description: `${business.name} · ${svc.name} · ${booking.code}`,
      });
      await supabase
        .from("tour_bookings")
        .update({
          payment_id: charge.paymentId,
          metadata: {
            take_rate_bps: bps,
            service_fee_bps: SERVICE_FEE_BPS,
            subtotal_cents: subtotal,
            pix_qr: charge.qrCodeBase64,
            pix_copy: charge.qrCodeCopyPaste,
            pix_expires: charge.expiresAt,
          },
        })
        .eq("id", booking.id);
      revalidatePath(`/app/reservas-passeio/${booking.id}`);
      return {
        ok: true,
        bookingId: booking.id,
        bookingCode: booking.code,
        pix: { qrCode: charge.qrCodeBase64, copyPaste: charge.qrCodeCopyPaste },
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Falha PIX" };
    }
  }

  if (parsed.data.paymentMethod === "card") {
    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        orderId: booking.id,
        amountCents: total,
        applicationFeeCents: platformFee,
        customerEmail: user.email ?? parsed.data.customerEmail ?? undefined,
      });
      await supabase.from("tour_bookings").update({ payment_id: paymentIntentId }).eq("id", booking.id);
      return {
        ok: true,
        bookingId: booking.id,
        bookingCode: booking.code,
        cardClientSecret: clientSecret,
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Falha cartão" };
    }
  }

  return { ok: true, bookingId: booking.id, bookingCode: booking.code };
}
