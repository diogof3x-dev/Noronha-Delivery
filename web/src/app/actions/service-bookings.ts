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
  if (profile?.role !== "admin" && biz.owner_id !== user.id) return { error: "Sem permissão" as const };
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

export type SvcState = { ok: boolean; error?: string };

const ServiceItemSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  description: z.string().max(600).optional().or(z.literal("")),
  price_brl: z.string().min(1),
  duration_minutes: z.string().optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export async function createServiceItem(_prev: SvcState, formData: FormData): Promise<SvcState> {
  const parsed = ServiceItemSchema.safeParse({
    business_id: formData.get("business_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    price_brl: formData.get("price_brl"),
    duration_minutes: formData.get("duration_minutes") ?? undefined,
    photo_url: formData.get("photo_url") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const access = await requireBusinessAccess(parsed.data.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const price = parseBrl(parsed.data.price_brl);
  if (price === null) return { ok: false, error: "Preço inválido" };
  const dur = Number.parseInt(parsed.data.duration_minutes ?? "", 10);

  const { error } = await access.supabase!.from("services").insert({
    business_id: parsed.data.business_id,
    kind: "service",
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    price_cents: price,
    image_url: parsed.data.photo_url?.trim() || null,
    duration_minutes: Number.isFinite(dur) && dur > 0 ? dur : 60,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/servicos");
  return { ok: true };
}

const SlotSchema = z.object({
  service_id: z.string().uuid(),
  start_at: z.string().min(10),
  duration_minutes: z.string().optional().or(z.literal("")),
  capacity: z.string().optional().or(z.literal("")),
  staff_name: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function createServiceSlot(_prev: SvcState, formData: FormData): Promise<SvcState> {
  const parsed = SlotSchema.safeParse({
    service_id: formData.get("service_id"),
    start_at: formData.get("start_at"),
    duration_minutes: formData.get("duration_minutes") ?? undefined,
    capacity: formData.get("capacity") ?? undefined,
    staff_name: formData.get("staff_name") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const { data: svc } = await supabase
    .from("services")
    .select("id, business_id, kind, duration_minutes")
    .eq("id", parsed.data.service_id)
    .maybeSingle();
  if (!svc || svc.kind !== "service") return { ok: false, error: "Serviço inválido" };

  const access = await requireBusinessAccess(svc.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const dur = Number.parseInt(parsed.data.duration_minutes ?? "", 10);
  const cap = Number.parseInt(parsed.data.capacity ?? "", 10);
  const startDate = new Date(parsed.data.start_at);
  if (Number.isNaN(startDate.getTime())) return { ok: false, error: "Data/hora inválida" };
  if (startDate < new Date()) return { ok: false, error: "Horário no passado" };

  const { error } = await access.supabase!.from("service_slots").insert({
    business_id: svc.business_id,
    service_id: parsed.data.service_id,
    start_at: startDate.toISOString(),
    duration_minutes: Number.isFinite(dur) && dur > 0 ? dur : svc.duration_minutes ?? 60,
    capacity: Number.isFinite(cap) && cap > 0 ? cap : 1,
    staff_name: parsed.data.staff_name?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/horarios");
  revalidatePath("/parceiro/painel/servicos");
  return { ok: true };
}

export async function toggleSlotActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const is_active = formData.get("is_active") === "true";
  const supabase = await getServerClient();
  const { data: s } = await supabase.from("service_slots").select("id, business_id").eq("id", id).maybeSingle();
  if (!s) return;
  const access = await requireBusinessAccess(s.business_id);
  if ("error" in access) return;
  await access.supabase!.from("service_slots").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/parceiro/painel/horarios");
}

export async function deleteServiceSlot(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getServerClient();
  const { data: s } = await supabase.from("service_slots").select("id, business_id").eq("id", id).maybeSingle();
  if (!s) return;
  const access = await requireBusinessAccess(s.business_id);
  if ("error" in access) return;
  await access.supabase!.from("service_slots").delete().eq("id", id);
  revalidatePath("/parceiro/painel/horarios");
}

const BookSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotId: z.string().uuid(),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerWhatsapp: z.string().max(30).optional().or(z.literal("")),
  paymentMethod: z.enum(["pix", "card"]),
  notes: z.string().max(500).optional(),
});

const SERVICE_FEE_BPS = 199;

export type CreateServiceBookingResult =
  | {
      ok: true;
      bookingId: string;
      bookingCode: string;
      pix?: { qrCode: string | null; copyPaste: string | null };
      cardClientSecret?: string;
    }
  | { ok: false; error: string };

export async function createServiceBooking(input: z.infer<typeof BookSchema>): Promise<CreateServiceBookingResult> {
  const parsed = BookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra agendar" };

  const { data: slot } = await supabase
    .from("service_slots")
    .select("id, business_id, service_id, capacity, booked_count, start_at, is_active")
    .eq("id", parsed.data.slotId)
    .maybeSingle();
  if (!slot || !slot.is_active || slot.business_id !== parsed.data.businessId || slot.service_id !== parsed.data.serviceId) {
    return { ok: false, error: "Horário indisponível" };
  }
  if (slot.booked_count >= slot.capacity) return { ok: false, error: "Horário cheio" };
  if (new Date(slot.start_at) < new Date()) return { ok: false, error: "Horário no passado" };

  const { data: svc } = await supabase
    .from("services")
    .select("id, price_cents, name, is_active, business_id, kind")
    .eq("id", parsed.data.serviceId)
    .maybeSingle();
  if (!svc || !svc.is_active || svc.kind !== "service" || svc.business_id !== parsed.data.businessId) {
    return { ok: false, error: "Serviço indisponível" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, category_id, is_active")
    .eq("id", parsed.data.businessId)
    .maybeSingle();
  if (!business || !business.is_active) return { ok: false, error: "Estabelecimento indisponível" };

  const subtotal = svc.price_cents;
  const fee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
  const total = subtotal + fee;

  const { data: rateRow } = await supabase.rpc("effective_take_rate_bps", {
    p_business_id: business.id,
    p_category_id: business.category_id ?? "",
  });
  const bps = rateRow ?? 1000;
  const platformFee = Math.round((subtotal * bps) / 10_000) + fee;

  const { data: booking, error: berr } = await supabase
    .from("service_bookings")
    .insert({
      business_id: business.id,
      service_id: svc.id,
      slot_id: slot.id,
      customer_id: user.id,
      customer_name: parsed.data.customerName.trim(),
      customer_email: parsed.data.customerEmail?.trim() || null,
      customer_whatsapp: parsed.data.customerWhatsapp?.trim() || null,
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
  if (berr || !booking) return { ok: false, error: berr?.message ?? "Falha ao agendar" };

  if (parsed.data.paymentMethod === "pix") {
    try {
      const charge = await createPixCharge({
        orderId: booking.id,
        amountCents: total,
        payerEmail: user.email ?? parsed.data.customerEmail ?? "noronha@noreply.dev",
        description: `${business.name} · ${svc.name} · ${booking.code}`,
      });
      await supabase
        .from("service_bookings")
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
      await supabase.from("service_bookings").update({ payment_id: paymentIntentId }).eq("id", booking.id);
      return { ok: true, bookingId: booking.id, bookingCode: booking.code, cardClientSecret: clientSecret };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Falha cartão" };
    }
  }

  return { ok: true, bookingId: booking.id, bookingCode: booking.code };
}
