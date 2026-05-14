"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

async function ensureAccess(businessId: string) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada" as const };

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, owner_id, type")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz) return { error: "Loja não encontrada" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  if (!isAdmin && biz.owner_id !== user.id) return { error: "Sem permissão" as const };
  return { supabase, user, biz };
}

function parseBrl(v?: string): number | null {
  if (!v) return null;
  const cleaned = String(v).trim().replace(/\s/g, "").replace(/^r\$/i, "");
  if (!cleaned) return null;
  const norm = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const n = Number.parseFloat(norm);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

const CreateRoomSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(600).optional().or(z.literal("")),
  capacity: z.string().min(1),
  price_per_night_brl: z.string().min(1),
  bed_layout: z.string().max(120).optional().or(z.literal("")),
  amenities: z.string().max(600).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export type RoomState = { ok: boolean; error?: string };

export async function createRoom(_prev: RoomState, formData: FormData): Promise<RoomState> {
  const parsed = CreateRoomSchema.safeParse({
    business_id: formData.get("business_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    capacity: formData.get("capacity"),
    price_per_night_brl: formData.get("price_per_night_brl"),
    bed_layout: formData.get("bed_layout") ?? undefined,
    amenities: formData.get("amenities") ?? undefined,
    photo_url: formData.get("photo_url") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const access = await ensureAccess(parsed.data.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const capacity = Number.parseInt(parsed.data.capacity, 10);
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 20) {
    return { ok: false, error: "Capacidade inválida" };
  }
  const price = parseBrl(parsed.data.price_per_night_brl);
  if (price === null) return { ok: false, error: "Preço inválido" };

  const amenities = (parsed.data.amenities ?? "")
    .split(/[,\n]/)
    .map((a) => a.trim())
    .filter(Boolean);

  const photos = parsed.data.photo_url ? [parsed.data.photo_url.trim()] : [];

  const { error } = await access.supabase!.from("rooms").insert({
    business_id: parsed.data.business_id,
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    capacity,
    price_per_night_cents: price,
    bed_layout: parsed.data.bed_layout?.trim() || null,
    amenities,
    photos,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/quartos");
  return { ok: true };
}

const UpdateRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(600).optional().or(z.literal("")),
  capacity: z.string().optional(),
  price_per_night_brl: z.string().optional(),
  bed_layout: z.string().max(120).optional().or(z.literal("")),
  amenities: z.string().max(600).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export async function updateRoom(_prev: RoomState, formData: FormData): Promise<RoomState> {
  const parsed = UpdateRoomSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") ?? undefined,
    description: formData.get("description") ?? undefined,
    capacity: formData.get("capacity") ?? undefined,
    price_per_night_brl: formData.get("price_per_night_brl") ?? undefined,
    bed_layout: formData.get("bed_layout") ?? undefined,
    amenities: formData.get("amenities") ?? undefined,
    photo_url: formData.get("photo_url") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, business_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!room) return { ok: false, error: "Quarto não encontrado" };

  const access = await ensureAccess(room.business_id);
  if ("error" in access) return { ok: false, error: access.error };

  const update: {
    name?: string;
    description?: string | null;
    capacity?: number;
    price_per_night_cents?: number;
    bed_layout?: string | null;
    amenities?: string[];
    photos?: string[];
    updated_at?: string;
  } = { updated_at: new Date().toISOString() };

  if (parsed.data.name) update.name = parsed.data.name.trim();
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description.trim() || null;
  if (parsed.data.bed_layout !== undefined)
    update.bed_layout = parsed.data.bed_layout.trim() || null;

  if (parsed.data.capacity) {
    const c = Number.parseInt(parsed.data.capacity, 10);
    if (Number.isFinite(c) && c >= 1 && c <= 20) update.capacity = c;
  }
  if (parsed.data.price_per_night_brl) {
    const price = parseBrl(parsed.data.price_per_night_brl);
    if (price !== null) update.price_per_night_cents = price;
  }
  if (parsed.data.amenities !== undefined) {
    update.amenities = (parsed.data.amenities ?? "")
      .split(/[,\n]/)
      .map((a) => a.trim())
      .filter(Boolean);
  }
  if (parsed.data.photo_url !== undefined) {
    update.photos = parsed.data.photo_url.trim() ? [parsed.data.photo_url.trim()] : [];
  }

  const { error } = await access.supabase!
    .from("rooms")
    .update(update)
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/quartos");
  return { ok: true };
}

export async function toggleRoomActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const is_active = formData.get("is_active") === "true";
  if (!z.string().uuid().safeParse(id).success) return;

  const supabase = await getServerClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, business_id")
    .eq("id", id)
    .maybeSingle();
  if (!room) return;
  const access = await ensureAccess(room.business_id);
  if ("error" in access) return;

  await access.supabase!.from("rooms").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/parceiro/painel/quartos");
}

export async function deleteRoom(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;

  const supabase = await getServerClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, business_id")
    .eq("id", id)
    .maybeSingle();
  if (!room) return;
  const access = await ensureAccess(room.business_id);
  if ("error" in access) return;

  await access.supabase!.from("rooms").delete().eq("id", id);
  revalidatePath("/parceiro/painel/quartos");
}
