"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { createPixCharge } from "@/lib/payments/mercadopago";
import { createPaymentIntent } from "@/lib/payments/stripe";

async function requireBusinessAccess(businessId: string) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada" as const };
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz) return { error: "Loja não encontrada" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" && biz.owner_id !== user.id) {
    return { error: "Sem permissão" as const };
  }
  return { supabase, user };
}

function parseBrl(v?: string): number | null {
  if (!v) return null;
  const c = String(v).trim().replace(/\s/g, "").replace(/^r\$/i, "");
  if (!c) return null;
  const n = c.includes(",") ? c.replace(/\./g, "").replace(",", ".") : c;
  const x = Number.parseFloat(n);
  return Number.isFinite(x) && x >= 0 ? Math.round(x * 100) : null;
}

export type RentalState = { ok: boolean; error?: string };

const EquipSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  description: z.string().max(600).optional().or(z.literal("")),
  daily_brl: z.string().min(1),
  deposit_brl: z.string().optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export async function createRentalItem(_prev: RentalState, formData: FormData): Promise<RentalState> {
  const parsed = EquipSchema.safeParse({
    business_id: formData.get("business_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    daily_brl: formData.get("daily_brl"),
    deposit_brl: formData.get("deposit_brl") ?? undefined,
    photo_url: formData.get("photo_url") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const access = await requireBusinessAccess(parsed.data.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const daily = parseBrl(parsed.data.daily_brl);
  if (daily === null) return { ok: false, error: "Diária inválida" };
  const deposit = parseBrl(parsed.data.deposit_brl) ?? 0;

  const { error } = await access.supabase!.from("services").insert({
    business_id: parsed.data.business_id,
    kind: "rental",
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    price_cents: daily,
    image_url: parsed.data.photo_url?.trim() || null,
    meta: { deposit_cents: deposit },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/equipamentos");
  return { ok: true };
}

const BookingSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  pickupAt: z.string().min(10),
  returnAt: z.string().min(10),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerWhatsapp: z.string().max(30).optional().or(z.literal("")),
  customerDocument: z.string().max(40).optional().or(z.literal("")),
  paymentMethod: z.enum(["pix", "card"]),
  notes: z.string().max(500).optional(),
});

const SERVICE_FEE_BPS = 199;

export type CreateRentalBookingResult =
  | {
      ok: true;
      bookingId: string;
      bookingCode: string;
      pix?: { qrCode: string | null; copyPaste: string | null };
      cardClientSecret?: string;
    }
  | { ok: false; error: string };

export async function createRentalBooking(
  input: z.infer<typeof BookingSchema>,
): Promise<CreateRentalBookingResult> {
  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const pickup = new Date(parsed.data.pickupAt);
  const ret = new Date(parsed.data.returnAt);
  if (ret <= pickup) return { ok: false, error: "Devolução precisa ser depois da retirada" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra alugar" };

  const { data: svc } = await supabase
    .from("services")
    .select("id, business_id, kind, is_active, price_cents, name, meta")
    .eq("id", parsed.data.serviceId)
    .maybeSingle();
  if (!svc || !svc.is_active || svc.kind !== "rental" || svc.business_id !== parsed.data.businessId) {
    return { ok: false, error: "Equipamento indisponível" };
  }

  const { data: available } = await supabase.rpc("is_rental_available", {
    p_service_id: parsed.data.serviceId,
    p_pickup_at: pickup.toISOString(),
    p_return_at: ret.toISOString(),
    p_exclude_id: null,
  });
  if (!available) return { ok: false, error: "Datas indisponíveis. Tente outras." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, category_id, is_active")
    .eq("id", parsed.data.businessId)
    .maybeSingle();
  if (!business || !business.is_active) return { ok: false, error: "Locadora indisponível" };

  const days = Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / (24 * 3600 * 1000)));
  const daily = svc.price_cents;
  const subtotal = daily * days;
  const deposit = (svc.meta as { deposit_cents?: number } | null)?.deposit_cents ?? 0;
  const fee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
  const total = subtotal + fee + deposit;

  const { data: rateRow } = await supabase.rpc("effective_take_rate_bps", {
    p_business_id: business.id,
    p_category_id: business.category_id ?? "",
  });
  const bps = rateRow ?? 1000;
  const platformFee = Math.round((subtotal * bps) / 10_000) + fee;

  const { data: booking, error: berr } = await supabase
    .from("rental_bookings")
    .insert({
      business_id: business.id,
      service_id: svc.id,
      customer_id: user.id,
      customer_name: parsed.data.customerName.trim(),
      customer_email: parsed.data.customerEmail?.trim() || null,
      customer_whatsapp: parsed.data.customerWhatsapp?.trim() || null,
      customer_document: parsed.data.customerDocument?.trim() || null,
      pickup_at: pickup.toISOString(),
      return_at: ret.toISOString(),
      daily_cents: daily,
      subtotal_cents: subtotal,
      deposit_cents: deposit,
      total_cents: total,
      platform_fee_cents: platformFee,
      status: "requested",
      payment_method: parsed.data.paymentMethod,
      payment_status: "pending",
      notes: parsed.data.notes?.trim() || null,
      metadata: { take_rate_bps: bps, service_fee_bps: SERVICE_FEE_BPS },
    })
    .select("id, code")
    .single();
  if (berr || !booking) return { ok: false, error: berr?.message ?? "Falha ao criar locação" };

  if (parsed.data.paymentMethod === "pix") {
    try {
      const charge = await createPixCharge({
        orderId: booking.id,
        amountCents: total,
        payerEmail: user.email ?? parsed.data.customerEmail ?? "noronha@noreply.dev",
        description: `${business.name} · ${svc.name} · ${booking.code}`,
      });
      await supabase
        .from("rental_bookings")
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
        .eq("id", booking.id);
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
      await supabase.from("rental_bookings").update({ payment_id: paymentIntentId }).eq("id", booking.id);
      return { ok: true, bookingId: booking.id, bookingCode: booking.code, cardClientSecret: clientSecret };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Falha cartão" };
    }
  }

  return { ok: true, bookingId: booking.id, bookingCode: booking.code };
}
