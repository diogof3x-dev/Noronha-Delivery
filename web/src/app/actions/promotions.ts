"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

async function guardOwner(supabase: Awaited<ReturnType<typeof getServerClient>>, businessId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sessão expirada" };
  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_id, slug, type")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz || biz.owner_id !== user.id) return { ok: false as const, error: "Sem permissão" };
  return { ok: true as const, user, biz };
}

// ============ Cupons ============

const CouponSchema = z.object({
  business_id: z.string().uuid(),
  code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/i, "Use só letras, números, _ ou -"),
  description: z.string().max(160).optional(),
  discount_kind: z.enum(["percent", "fixed"]),
  discount_value: z.coerce.number().int().min(1),
  min_subtotal_cents: z.coerce.number().int().min(0).optional(),
  max_uses: z.coerce.number().int().min(1).optional(),
  per_user_limit: z.coerce.number().int().min(1).default(1),
  first_order_only: z.coerce.boolean().optional(),
  ends_at: z.string().optional(),
});

export async function createCoupon(formData: FormData) {
  const parsed = CouponSchema.safeParse({
    business_id: formData.get("business_id"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    discount_kind: formData.get("discount_kind"),
    discount_value: formData.get("discount_value"),
    min_subtotal_cents: formData.get("min_subtotal_cents") || undefined,
    max_uses: formData.get("max_uses") || undefined,
    per_user_limit: formData.get("per_user_limit") || 1,
    first_order_only: formData.get("first_order_only") === "on",
    ends_at: formData.get("ends_at") || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  if (parsed.data.discount_kind === "percent" && parsed.data.discount_value > 80) {
    return { ok: false as const, error: "Desconto percentual máx. 80%" };
  }

  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, parsed.data.business_id);
  if (!guard.ok) return guard;

  const { error } = await supabase.from("business_coupons").insert({
    business_id: parsed.data.business_id,
    code: parsed.data.code.toUpperCase(),
    description: parsed.data.description ?? null,
    discount_kind: parsed.data.discount_kind,
    discount_value: parsed.data.discount_value,
    min_subtotal_cents: parsed.data.min_subtotal_cents ?? 0,
    max_uses: parsed.data.max_uses ?? null,
    per_user_limit: parsed.data.per_user_limit,
    first_order_only: parsed.data.first_order_only ?? false,
    ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
    created_by: guard.user.id,
  });
  if (error) {
    if (error.code === "23505") return { ok: false as const, error: "Já existe um cupom com esse código" };
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/parceiro/painel/promocoes");
  return { ok: true as const };
}

export async function toggleCoupon(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  const active = formData.get("active") === "true";
  if (!z.string().uuid().safeParse(id).success) return;
  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, businessId);
  if (!guard.ok) return;
  await supabase
    .from("business_coupons")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", businessId);
  revalidatePath("/parceiro/painel/promocoes");
}

export async function deleteCoupon(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, businessId);
  if (!guard.ok) return;
  await supabase.from("business_coupons").delete().eq("id", id).eq("business_id", businessId);
  revalidatePath("/parceiro/painel/promocoes");
}

// ============ Boost ============

const BoostSchema = z.object({
  business_id: z.string().uuid(),
  kind: z.enum(["home_feature", "category_top", "banner"]),
  days: z.coerce.number().int().min(1).max(30),
  daily_budget_cents: z.coerce.number().int().min(500).max(100_000).optional(),
});

export async function createBoost(formData: FormData) {
  const parsed = BoostSchema.safeParse({
    business_id: formData.get("business_id"),
    kind: formData.get("kind"),
    days: formData.get("days"),
    daily_budget_cents: formData.get("daily_budget_cents") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, parsed.data.business_id);
  if (!guard.ok) return guard;

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + parsed.data.days);

  const { error } = await supabase.from("business_boosts").insert({
    business_id: parsed.data.business_id,
    kind: parsed.data.kind,
    ends_at: endsAt.toISOString(),
    daily_budget_cents: parsed.data.daily_budget_cents ?? null,
    status: "active",
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/parceiro/painel/promocoes");
  return { ok: true as const };
}

export async function pauseBoost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  const newStatus = String(formData.get("status") ?? "paused");
  if (!["active", "paused", "ended"].includes(newStatus)) return;
  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, businessId);
  if (!guard.ok) return;
  await supabase
    .from("business_boosts")
    .update({ status: newStatus as "active" | "paused" | "ended" })
    .eq("id", id)
    .eq("business_id", businessId);
  revalidatePath("/parceiro/painel/promocoes");
}

// ============ Banner ============

const BannerSchema = z.object({
  business_id: z.string().uuid(),
  banner_text: z.string().max(120).optional(),
  banner_cta_label: z.string().max(40).optional(),
  banner_cta_url: z.string().max(200).optional(),
  banner_color: z.string().max(20).optional(),
});

export async function updateBanner(formData: FormData) {
  const parsed = BannerSchema.safeParse({
    business_id: formData.get("business_id"),
    banner_text: formData.get("banner_text") || undefined,
    banner_cta_label: formData.get("banner_cta_label") || undefined,
    banner_cta_url: formData.get("banner_cta_url") || undefined,
    banner_color: formData.get("banner_color") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, parsed.data.business_id);
  if (!guard.ok) return guard;

  await supabase
    .from("businesses")
    .update({
      banner_text: parsed.data.banner_text ?? null,
      banner_cta_label: parsed.data.banner_cta_label ?? null,
      banner_cta_url: parsed.data.banner_cta_url ?? null,
      banner_color: parsed.data.banner_color ?? null,
    })
    .eq("id", parsed.data.business_id);

  revalidatePath("/parceiro/painel/promocoes");
  if (guard.biz.slug) revalidatePath(`/app/restaurante/${guard.biz.slug}`);
  return { ok: true as const };
}
