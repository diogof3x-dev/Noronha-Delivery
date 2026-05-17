"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const BUSINESS_TYPES = [
  "restaurante",
  "mercado",
  "farmacia",
  "conveniencia",
  "loja",
  "operador_passeio",
  "pousada",
  "residencia",
  "locadora",
  "servico",
  "motorista",
] as const;

const CreateBusinessSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(BUSINESS_TYPES),
  category_id: z.string().min(1).max(60).optional().or(z.literal("")),
  district: z.string().min(2).max(80),
  description: z.string().max(600).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  delivery_fee_brl: z.string().optional().or(z.literal("")),
  min_order_brl: z.string().optional().or(z.literal("")),
  avg_prep_minutes: z.string().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
});

export type BusinessState = { ok: boolean; error?: string; businessId?: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseBrl(input?: string | null): number | null {
  if (!input) return null;
  const cleaned = String(input).trim().replace(/\s/g, "").replace(/^r\$/i, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export async function createBusiness(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const parsed = CreateBusinessSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    category_id: formData.get("category_id") ?? undefined,
    district: formData.get("district"),
    description: formData.get("description") ?? undefined,
    whatsapp: formData.get("whatsapp") ?? undefined,
    delivery_fee_brl: formData.get("delivery_fee_brl") ?? undefined,
    min_order_brl: formData.get("min_order_brl") ?? undefined,
    avg_prep_minutes: formData.get("avg_prep_minutes") ?? undefined,
    logo_url: formData.get("logo_url") ?? undefined,
    cover_url: formData.get("cover_url") ?? undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra criar a loja" };

  let baseSlug = slugify(parsed.data.name);
  if (!baseSlug) baseSlug = `loja-${Date.now().toString(36)}`;

  let slug = baseSlug;
  for (let i = 0; i < 8; i++) {
    const { data: exists } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`;
  }

  const prep = Number.parseInt(parsed.data.avg_prep_minutes ?? "", 10);
  const insert = {
    owner_id: user.id,
    type: parsed.data.type,
    category_id: parsed.data.category_id?.trim() || null,
    name: parsed.data.name.trim(),
    slug,
    description: parsed.data.description?.trim() || null,
    district: parsed.data.district.trim(),
    whatsapp: parsed.data.whatsapp?.trim() || null,
    delivery_fee_cents: parseBrl(parsed.data.delivery_fee_brl),
    min_order_cents: parseBrl(parsed.data.min_order_brl),
    avg_prep_minutes: Number.isFinite(prep) && prep > 0 ? prep : null,
    logo_url: parsed.data.logo_url?.trim() || null,
    cover_url: parsed.data.cover_url?.trim() || null,
    delivery_enabled: true,
    is_active: true,
  };

  const { data: created, error } = await supabase
    .from("businesses")
    .insert(insert)
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Falha ao criar loja" };
  }

  revalidatePath("/parceiro/painel/loja");
  revalidatePath("/parceiro/painel/cardapio");
  redirect("/parceiro/painel/cardapio/novo");
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const UpdateBusinessSchema = z.object({
  id: z.string().uuid(),
  description: z.string().max(600).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  district: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  delivery_fee_brl: z.string().optional().or(z.literal("")),
  min_order_brl: z.string().optional().or(z.literal("")),
  avg_prep_minutes: z.string().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
});

async function checkOwnerOrAdmin(businessId: string) {
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
  return { supabase, user, biz };
}

export async function updateBusiness(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const parsed = UpdateBusinessSchema.safeParse({
    id: formData.get("id"),
    description: formData.get("description") ?? undefined,
    whatsapp: formData.get("whatsapp") ?? undefined,
    district: formData.get("district") ?? undefined,
    address: formData.get("address") ?? undefined,
    delivery_fee_brl: formData.get("delivery_fee_brl") ?? undefined,
    min_order_brl: formData.get("min_order_brl") ?? undefined,
    avg_prep_minutes: formData.get("avg_prep_minutes") ?? undefined,
    logo_url: formData.get("logo_url") ?? undefined,
    cover_url: formData.get("cover_url") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const access = await checkOwnerOrAdmin(parsed.data.id);
  if ("error" in access) return { ok: false, error: access.error };

  const opening: Record<string, { open: string; close: string; closed?: boolean }> = {};
  for (const d of DAYS) {
    const closed = formData.get(`oh_${d}_closed`) === "on";
    const open = String(formData.get(`oh_${d}_open`) ?? "").slice(0, 5);
    const close = String(formData.get(`oh_${d}_close`) ?? "").slice(0, 5);
    opening[d] = { open: open || "08:00", close: close || "22:00", closed };
  }

  const prep = Number.parseInt(parsed.data.avg_prep_minutes ?? "", 10);
  const update = {
    description: parsed.data.description?.trim() || null,
    whatsapp: parsed.data.whatsapp?.trim() || null,
    district: parsed.data.district?.trim() || null,
    address: parsed.data.address?.trim() || null,
    delivery_fee_cents: parseBrl(parsed.data.delivery_fee_brl),
    min_order_cents: parseBrl(parsed.data.min_order_brl),
    avg_prep_minutes: Number.isFinite(prep) && prep > 0 ? prep : null,
    logo_url: parsed.data.logo_url?.trim() || null,
    cover_url: parsed.data.cover_url?.trim() || null,
    opening_hours: opening,
  };

  const { error } = await access.supabase!
    .from("businesses")
    .update(update)
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/loja");
  const slug = (await access.supabase!
    .from("businesses")
    .select("slug, type")
    .eq("id", parsed.data.id)
    .maybeSingle()).data;
  if (slug?.slug) {
    const segment = vitrineSegmentFor(slug.type);
    if (segment) revalidatePath(`/app/${segment}/${slug.slug}`);
  }
  return { ok: true };
}

function vitrineSegmentFor(type: string | null | undefined): string | null {
  switch (type) {
    case "restaurante":
    case "mercado":
    case "farmacia":
    case "conveniencia":
    case "loja":
      return "restaurante";
    case "pousada":
      return "pousada";
    case "residencia":
      return "casa";
    case "operador_passeio":
      return "passeio";
    case "locadora":
      return "aluguel";
    case "servico":
      return "servico";
    default:
      return null;
  }
}

export async function toggleBusinessOpen(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("is_active") === "true";
  if (!z.string().uuid().safeParse(id).success) return;

  const access = await checkOwnerOrAdmin(id);
  if ("error" in access) return;

  await access.supabase!
    .from("businesses")
    .update({ is_active: active })
    .eq("id", id);
  revalidatePath("/parceiro/painel/loja");
  revalidatePath("/parceiro/painel");
  const biz = (await access.supabase!
    .from("businesses")
    .select("slug, type")
    .eq("id", id)
    .maybeSingle()).data;
  if (biz?.slug) {
    const segment = vitrineSegmentFor(biz.type);
    if (segment) revalidatePath(`/app/${segment}/${biz.slug}`);
  }
}
