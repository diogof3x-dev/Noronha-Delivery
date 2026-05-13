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
