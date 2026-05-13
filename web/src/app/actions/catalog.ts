"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

function parseMoneyValue(input: string): number | null {
  const cleaned = String(input).trim().replace(/\s/g, "").replace(/^r\$/i, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

const ManualSchema = z.object({
  business_id: z.string().uuid("Selecione a loja"),
  name: z.string().min(2, "Nome muito curto").max(160),
  description: z.string().max(600).optional().or(z.literal("")),
  price_brl: z.string().min(1, "Informe o preço"),
  original_price_brl: z.string().max(20).optional().or(z.literal("")),
  section: z.string().max(60).optional().or(z.literal("")),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_featured: z.string().optional().or(z.literal("")),
  serves_people: z.string().max(5).optional().or(z.literal("")),
});

export type CatalogState = {
  ok: boolean;
  error?: string;
  created?: number;
};

async function ensureAccess(businessId: string) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada", supabase };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) return { error: "Loja não encontrada", supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  const isOwner = business.owner_id === user.id;
  if (!isAdmin && !isOwner) return { error: "Sem permissão pra essa loja", supabase };

  return { supabase, user };
}

export async function addServiceManual(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const parsed = ManualSchema.safeParse({
    business_id: formData.get("business_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    price_brl: formData.get("price_brl"),
    original_price_brl: formData.get("original_price_brl") ?? undefined,
    section: formData.get("section") ?? undefined,
    image_url: formData.get("image_url") ?? undefined,
    is_featured: formData.get("is_featured") ?? undefined,
    serves_people: formData.get("serves_people") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const price_brl = parseMoneyValue(parsed.data.price_brl);
  if (price_brl === null) {
    return { ok: false, error: "Preço inválido" };
  }

  const access = await ensureAccess(parsed.data.business_id);
  if ("error" in access && access.error) return { ok: false, error: access.error };

  const supabase = access.supabase!;
  const price_cents = Math.round(price_brl * 100);
  const originalRaw = parseMoneyValue(parsed.data.original_price_brl ?? "");
  const original_price_cents =
    originalRaw !== null && originalRaw * 100 > price_cents ? Math.round(originalRaw * 100) : null;
  const serves = Number.parseInt(parsed.data.serves_people ?? "", 10);

  const { error } = await supabase.from("services").insert({
    business_id: parsed.data.business_id,
    kind: "food_item",
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    price_cents,
    original_price_cents,
    image_url: parsed.data.image_url?.trim() || null,
    section: parsed.data.section?.trim() || null,
    is_featured: parsed.data.is_featured === "on",
    serves_people: Number.isFinite(serves) && serves > 0 ? serves : null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/cardapio");
  redirect("/parceiro/painel/cardapio");
}

const BulkSchema = z.object({
  business_id: z.string().uuid("Selecione a loja"),
  bulk: z.string().min(3, "Cole pelo menos uma linha"),
  default_section: z.string().max(60).optional().or(z.literal("")),
});

export async function addServicesBulk(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const parsed = BulkSchema.safeParse({
    business_id: formData.get("business_id"),
    bulk: formData.get("bulk"),
    default_section: formData.get("default_section") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const access = await ensureAccess(parsed.data.business_id);
  if ("error" in access && access.error) return { ok: false, error: access.error };
  const supabase = access.supabase!;
  const section = parsed.data.default_section?.trim();

  const lines = parsed.data.bulk
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: Array<{
    business_id: string;
    kind: "food_item";
    name: string;
    description: string | null;
    price_cents: number;
    section: string | null;
  }> = [];
  const errors: string[] = [];

  lines.forEach((line, idx) => {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Linha ${idx + 1}: precisa ter ao menos Nome | Preço`);
      return;
    }
    const name = parts[0]!;
    const description = parts.length >= 3 ? parts[1]! : "";
    const priceStr = parts[parts.length - 1]!;
    const price = parseMoneyValue(priceStr);
    if (!name || price === null) {
      errors.push(`Linha ${idx + 1}: preço inválido (${priceStr})`);
      return;
    }
    rows.push({
      business_id: parsed.data.business_id,
      kind: "food_item",
      name,
      description: description || null,
      price_cents: Math.round(price * 100),
      section: section ?? null,
    });
  });

  if (errors.length && !rows.length) {
    return { ok: false, error: errors.slice(0, 3).join(" · ") };
  }

  if (rows.length === 0) {
    return { ok: false, error: "Nenhuma linha válida" };
  }

  const { error } = await supabase.from("services").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/cardapio");
  redirect("/parceiro/painel/cardapio");
}

const ImportSchema = z.object({
  business_id: z.string().uuid("Selecione a loja"),
  source_url: z.string().url("URL inválida").optional().or(z.literal("")),
  pasted_menu: z.string().max(20000).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(600).optional().or(z.literal("")),
  price_brl: z.string().optional(),
  original_price_brl: z.string().optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  section: z.string().max(60).optional().or(z.literal("")),
  is_featured: z.string().optional().or(z.literal("")),
  serves_people: z.string().max(5).optional().or(z.literal("")),
});

export async function updateService(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") ?? undefined,
    description: formData.get("description") ?? undefined,
    price_brl: formData.get("price_brl") ?? undefined,
    original_price_brl: formData.get("original_price_brl") ?? undefined,
    image_url: formData.get("image_url") ?? undefined,
    section: formData.get("section") ?? undefined,
    is_featured: formData.get("is_featured") ?? undefined,
    serves_people: formData.get("serves_people") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const { data: svc } = await supabase
    .from("services")
    .select("id, business_id, businesses(owner_id)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!svc) return { ok: false, error: "Item não encontrado" };

  const ownerId = (svc.businesses as { owner_id?: string } | null)?.owner_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  if (!isAdmin && ownerId !== user.id) {
    return { ok: false, error: "Sem permissão" };
  }

  const update: {
    name?: string;
    description?: string | null;
    price_cents?: number;
    original_price_cents?: number | null;
    image_url?: string | null;
    section?: string | null;
    is_featured?: boolean;
    serves_people?: number | null;
  } = {};
  if (parsed.data.name) update.name = parsed.data.name.trim();
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description.trim() || null;
  if (parsed.data.image_url !== undefined)
    update.image_url = parsed.data.image_url.trim() || null;
  if (parsed.data.section !== undefined)
    update.section = parsed.data.section.trim() || null;
  if (parsed.data.is_featured !== undefined)
    update.is_featured = parsed.data.is_featured === "on";
  if (parsed.data.serves_people !== undefined) {
    const sv = Number.parseInt(parsed.data.serves_people, 10);
    update.serves_people = Number.isFinite(sv) && sv > 0 ? sv : null;
  }
  let priceCents: number | undefined;
  if (parsed.data.price_brl) {
    const price = parseMoneyValue(parsed.data.price_brl);
    if (price === null) return { ok: false, error: "Preço inválido" };
    priceCents = Math.round(price * 100);
    update.price_cents = priceCents;
  }
  if (parsed.data.original_price_brl !== undefined) {
    const orig = parseMoneyValue(parsed.data.original_price_brl);
    if (orig === null || orig === 0) update.original_price_cents = null;
    else {
      const origCents = Math.round(orig * 100);
      update.original_price_cents =
        priceCents != null ? (origCents > priceCents ? origCents : null) : origCents;
    }
  }

  const { error } = await supabase.from("services").update(update).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/cardapio");
  return { ok: true };
}

const ToggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.enum(["true", "false"]),
});

export async function toggleServiceActive(formData: FormData): Promise<void> {
  const parsed = ToggleSchema.safeParse({
    id: formData.get("id"),
    is_active: formData.get("is_active"),
  });
  if (!parsed.success) return;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: svc } = await supabase
    .from("services")
    .select("id, businesses(owner_id)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!svc) return;

  const ownerId = (svc.businesses as { owner_id?: string } | null)?.owner_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  if (!isAdmin && ownerId !== user.id) return;

  await supabase
    .from("services")
    .update({ is_active: parsed.data.is_active === "true" })
    .eq("id", parsed.data.id);

  revalidatePath("/parceiro/painel/cardapio");
}

export async function deleteService(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: svc } = await supabase
    .from("services")
    .select("id, businesses(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!svc) return;

  const ownerId = (svc.businesses as { owner_id?: string } | null)?.owner_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  if (!isAdmin && ownerId !== user.id) return;

  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/parceiro/painel/cardapio");
}

export async function requestImportFromExternal(
  _prev: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const parsed = ImportSchema.safeParse({
    business_id: formData.get("business_id"),
    source_url: formData.get("source_url") ?? undefined,
    pasted_menu: formData.get("pasted_menu") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  if (!parsed.data.source_url && !parsed.data.pasted_menu) {
    return { ok: false, error: "Informe a URL OU cole o cardápio" };
  }

  const access = await ensureAccess(parsed.data.business_id);
  if ("error" in access && access.error) return { ok: false, error: access.error };
  const supabase = access.supabase!;

  const { error } = await supabase.from("leads").insert({
    type: "comercio",
    name: `Import cardápio · ${parsed.data.business_id.slice(0, 8)}`,
    whatsapp: "import-cardapio",
    payload: {
      kind: "menu_import",
      business_id: parsed.data.business_id,
      source_url: parsed.data.source_url || null,
      pasted_menu: parsed.data.pasted_menu || null,
      notes: parsed.data.notes || null,
    },
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true, created: 0 };
}
