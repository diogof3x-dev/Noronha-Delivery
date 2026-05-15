"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { createPixCharge } from "@/lib/payments/mercadopago";
import { createPaymentIntent } from "@/lib/payments/stripe";

const SERVICE_FEE_BPS = 199;

const BookingSchema = z.object({
  businessId: z.string().uuid(),
  roomId: z.string().uuid(),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  guests: z.number().int().min(1).max(20),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerWhatsapp: z.string().max(30).optional().or(z.literal("")),
  paymentMethod: z.enum(["pix", "card"]),
  notes: z.string().max(500).optional(),
});

export type CreateBookingResult =
  | {
      ok: true;
      bookingId: string;
      bookingCode: string;
      pix?: { qrCode: string | null; copyPaste: string | null };
      cardClientSecret?: string;
    }
  | { ok: false; error: string };

export async function createBooking(input: z.infer<typeof BookingSchema>): Promise<CreateBookingResult> {
  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const checkIn = new Date(parsed.data.checkIn);
  const checkOut = new Date(parsed.data.checkOut);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { ok: false, error: "Datas inválidas" };
  }
  if (checkOut <= checkIn) {
    return { ok: false, error: "Check-out precisa ser depois do check-in" };
  }
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (24 * 3600 * 1000));
  if (nights < 1) return { ok: false, error: "Mínimo de 1 noite" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra reservar" };

  const { data: room } = await supabase
    .from("rooms")
    .select("id, business_id, name, capacity, price_per_night_cents, is_active")
    .eq("id", parsed.data.roomId)
    .maybeSingle();
  if (!room || !room.is_active || room.business_id !== parsed.data.businessId) {
    return { ok: false, error: "Quarto indisponível" };
  }
  if (parsed.data.guests > room.capacity) {
    return { ok: false, error: `Esse quarto comporta até ${room.capacity} hóspedes` };
  }

  const { data: available } = await supabase.rpc("is_room_available", {
    p_room_id: parsed.data.roomId,
    p_check_in: parsed.data.checkIn.slice(0, 10),
    p_check_out: parsed.data.checkOut.slice(0, 10),
    p_exclude_booking: null,
  });
  if (!available) {
    return { ok: false, error: "Datas não disponíveis. Tente outras." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, category_id, is_active")
    .eq("id", parsed.data.businessId)
    .maybeSingle();
  if (!business || !business.is_active) {
    return { ok: false, error: "Pousada indisponível" };
  }

  const nightly = room.price_per_night_cents;
  const subtotal = nightly * nights;
  const serviceFee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
  const total = subtotal + serviceFee;

  const { data: rateRow } = await supabase.rpc("effective_take_rate_bps", {
    p_business_id: business.id,
    p_category_id: business.category_id ?? "",
  });
  const bps = rateRow ?? 1000;
  const platformFee = Math.round((subtotal * bps) / 10_000) + serviceFee;

  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .insert({
      business_id: business.id,
      room_id: room.id,
      customer_id: user.id,
      customer_name: parsed.data.customerName.trim(),
      customer_email: parsed.data.customerEmail?.trim() || null,
      customer_whatsapp: parsed.data.customerWhatsapp?.trim() || null,
      guests: parsed.data.guests,
      check_in: parsed.data.checkIn.slice(0, 10),
      check_out: parsed.data.checkOut.slice(0, 10),
      nightly_cents: nightly,
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
    return { ok: false, error: bookingErr?.message ?? "Falha ao criar reserva" };
  }

  if (parsed.data.paymentMethod === "pix") {
    try {
      const charge = await createPixCharge({
        orderId: booking.id,
        amountCents: total,
        payerEmail: user.email ?? parsed.data.customerEmail ?? "noronha@noreply.dev",
        description: `${business.name} · ${booking.code}`,
      });
      await supabase
        .from("bookings")
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
      revalidatePath(`/app/reservas/${booking.id}`);
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
      await supabase.from("bookings").update({ payment_id: paymentIntentId }).eq("id", booking.id);
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
