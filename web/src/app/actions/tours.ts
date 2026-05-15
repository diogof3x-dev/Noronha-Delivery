"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

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

export type TourState = { ok: boolean; error?: string };

const TourSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  description: z.string().max(600).optional().or(z.literal("")),
  price_per_pax_brl: z.string().min(1),
  duration_minutes: z.string().optional().or(z.literal("")),
  default_capacity: z.string().optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export async function createTour(_prev: TourState, formData: FormData): Promise<TourState> {
  const parsed = TourSchema.safeParse({
    business_id: formData.get("business_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    price_per_pax_brl: formData.get("price_per_pax_brl"),
    duration_minutes: formData.get("duration_minutes") ?? undefined,
    default_capacity: formData.get("default_capacity") ?? undefined,
    photo_url: formData.get("photo_url") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const access = await requireBusinessAccess(parsed.data.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const price = parseBrl(parsed.data.price_per_pax_brl);
  if (price === null) return { ok: false, error: "Preço inválido" };
  const dur = Number.parseInt(parsed.data.duration_minutes ?? "", 10);
  const cap = Number.parseInt(parsed.data.default_capacity ?? "", 10);

  const { error } = await access.supabase!.from("services").insert({
    business_id: parsed.data.business_id,
    kind: "tour",
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    price_cents: price,
    image_url: parsed.data.photo_url?.trim() || null,
    duration_minutes: Number.isFinite(dur) && dur > 0 ? dur : null,
    capacity: Number.isFinite(cap) && cap > 0 ? cap : null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/passeios");
  return { ok: true };
}

const SessionSchema = z.object({
  service_id: z.string().uuid(),
  start_at: z.string().min(10),
  capacity: z.string().min(1),
  meeting_point: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function createTourSession(_prev: TourState, formData: FormData): Promise<TourState> {
  const parsed = SessionSchema.safeParse({
    service_id: formData.get("service_id"),
    start_at: formData.get("start_at"),
    capacity: formData.get("capacity"),
    meeting_point: formData.get("meeting_point") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const { data: svc } = await supabase
    .from("services")
    .select("id, business_id, kind")
    .eq("id", parsed.data.service_id)
    .maybeSingle();
  if (!svc || svc.kind !== "tour") return { ok: false, error: "Passeio inválido" };
  const access = await requireBusinessAccess(svc.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const cap = Number.parseInt(parsed.data.capacity, 10);
  if (!Number.isFinite(cap) || cap < 1 || cap > 200) {
    return { ok: false, error: "Capacidade entre 1 e 200" };
  }

  const startDate = new Date(parsed.data.start_at);
  if (Number.isNaN(startDate.getTime())) return { ok: false, error: "Data/hora inválidas" };
  if (startDate < new Date()) return { ok: false, error: "Data no passado" };

  const { error } = await access.supabase!.from("tour_sessions").insert({
    business_id: svc.business_id,
    service_id: parsed.data.service_id,
    start_at: startDate.toISOString(),
    capacity: cap,
    meeting_point: parsed.data.meeting_point?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/agenda");
  revalidatePath("/parceiro/painel/passeios");
  return { ok: true };
}

export async function toggleSessionActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const is_active = formData.get("is_active") === "true";
  const supabase = await getServerClient();
  const { data: s } = await supabase
    .from("tour_sessions")
    .select("id, business_id")
    .eq("id", id)
    .maybeSingle();
  if (!s) return;
  const access = await requireBusinessAccess(s.business_id);
  if ("error" in access) return;
  await access.supabase!.from("tour_sessions").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/parceiro/painel/agenda");
}

export async function deleteTourSession(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getServerClient();
  const { data: s } = await supabase
    .from("tour_sessions")
    .select("id, business_id")
    .eq("id", id)
    .maybeSingle();
  if (!s) return;
  const access = await requireBusinessAccess(s.business_id);
  if ("error" in access) return;
  await access.supabase!.from("tour_sessions").delete().eq("id", id);
  revalidatePath("/parceiro/painel/agenda");
}
