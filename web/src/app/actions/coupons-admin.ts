"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

async function requireAdmin() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { error: "Sem permissão" as const };
  return { supabase, user };
}

function parseBrlToCents(v?: string | null): number | null {
  if (!v) return null;
  const cleaned = String(v).trim().replace(/\s/g, "").replace(/^r\$/i, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const CreateSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, "Use só letras, números, _ e -"),
  kind: z.enum(["percent", "fixed"]),
  value: z.string().min(1),
  min_subtotal_brl: z.string().optional().or(z.literal("")),
  max_discount_brl: z.string().optional().or(z.literal("")),
  business_id: z.string().uuid().optional().or(z.literal("")),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  max_uses: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type CouponState = { ok: boolean; error?: string };

export async function createCoupon(_prev: CouponState, formData: FormData): Promise<CouponState> {
  const access = await requireAdmin();
  if ("error" in access) return { ok: false, error: access.error };

  const parsed = CreateSchema.safeParse({
    code: formData.get("code"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    min_subtotal_brl: formData.get("min_subtotal_brl") ?? undefined,
    max_discount_brl: formData.get("max_discount_brl") ?? undefined,
    business_id: formData.get("business_id") ?? undefined,
    starts_at: formData.get("starts_at") ?? undefined,
    ends_at: formData.get("ends_at") ?? undefined,
    max_uses: formData.get("max_uses") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let value_int = 0;
  if (parsed.data.kind === "percent") {
    const pct = Number.parseFloat(parsed.data.value.replace(",", "."));
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return { ok: false, error: "Percentual deve ser entre 0,01 e 100" };
    }
    value_int = Math.round(pct * 100);
  } else {
    const cents = parseBrlToCents(parsed.data.value);
    if (cents === null || cents <= 0) return { ok: false, error: "Valor fixo inválido" };
    value_int = cents;
  }

  const maxUses = parsed.data.max_uses ? Number.parseInt(parsed.data.max_uses, 10) : null;

  const { error } = await access.supabase!.from("coupons").insert({
    code: parsed.data.code.trim().toUpperCase(),
    kind: parsed.data.kind,
    value_int,
    min_subtotal_cents: parseBrlToCents(parsed.data.min_subtotal_brl) ?? 0,
    max_discount_cents: parseBrlToCents(parsed.data.max_discount_brl),
    business_id: parsed.data.business_id?.trim() || null,
    starts_at: parsed.data.starts_at ? new Date(parsed.data.starts_at).toISOString() : null,
    ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
    max_uses: maxUses && Number.isFinite(maxUses) ? maxUses : null,
    notes: parsed.data.notes?.trim() || null,
    is_active: true,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Código já existe" };
    return { ok: false, error: error.message };
  }
  revalidatePath("/super-admin/cupons");
  return { ok: true };
}

export async function toggleCoupon(formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return;
  const id = String(formData.get("id") ?? "");
  const is_active = formData.get("is_active") === "true";
  if (!z.string().uuid().safeParse(id).success) return;
  await access.supabase!.from("coupons").update({ is_active }).eq("id", id);
  revalidatePath("/super-admin/cupons");
}

export async function deleteCoupon(formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return;
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  await access.supabase!.from("coupons").delete().eq("id", id);
  revalidatePath("/super-admin/cupons");
}
