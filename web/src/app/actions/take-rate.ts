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

const SettingsSchema = z.object({
  default_take_rate_pct: z.string(),
  d_plus_days: z.string(),
});

export async function updatePlatformSettings(_prev: unknown, formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return { ok: false, error: access.error };

  const parsed = SettingsSchema.safeParse({
    default_take_rate_pct: formData.get("default_take_rate_pct"),
    d_plus_days: formData.get("d_plus_days"),
  });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const pct = Number.parseFloat((parsed.data.default_take_rate_pct ?? "").replace(",", "."));
  const days = Number.parseInt(parsed.data.d_plus_days ?? "", 10);
  if (!Number.isFinite(pct) || pct < 0 || pct > 50) return { ok: false, error: "Take rate fora do range (0–50%)" };
  if (!Number.isFinite(days) || days < 0 || days > 90) return { ok: false, error: "D+ inválido (0–90)" };

  await access.supabase!
    .from("platform_settings")
    .update({
      default_take_rate_bps: Math.round(pct * 100),
      d_plus_days: days,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  revalidatePath("/super-admin/taxas");
  return { ok: true };
}

const CampaignSchema = z.object({
  name: z.string().min(2).max(120),
  take_rate_pct: z.string(),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  applies_to: z.enum(["all", "business", "category"]),
  applies_id: z.string().max(80).optional().or(z.literal("")),
  priority: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function createCampaign(_prev: unknown, formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return { ok: false, error: access.error };

  const parsed = CampaignSchema.safeParse({
    name: formData.get("name"),
    take_rate_pct: formData.get("take_rate_pct"),
    starts_at: formData.get("starts_at") ?? undefined,
    ends_at: formData.get("ends_at") ?? undefined,
    applies_to: formData.get("applies_to"),
    applies_id: formData.get("applies_id") ?? undefined,
    priority: formData.get("priority") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const pct = Number.parseFloat(parsed.data.take_rate_pct.replace(",", "."));
  if (!Number.isFinite(pct) || pct < 0 || pct > 50) return { ok: false, error: "Take rate fora do range" };
  const priority = Number.parseInt(parsed.data.priority ?? "100", 10);

  await access.supabase!.from("take_rate_campaigns").insert({
    name: parsed.data.name.trim(),
    take_rate_bps: Math.round(pct * 100),
    starts_at: parsed.data.starts_at ? new Date(parsed.data.starts_at).toISOString() : null,
    ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
    applies_to: parsed.data.applies_to,
    applies_id: parsed.data.applies_to === "all" ? null : parsed.data.applies_id?.trim() || null,
    priority: Number.isFinite(priority) ? priority : 100,
    notes: parsed.data.notes?.trim() || null,
    is_active: true,
    created_by: access.user!.id,
  });
  revalidatePath("/super-admin/taxas");
  return { ok: true };
}

export async function toggleCampaign(formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return;
  const id = String(formData.get("id") ?? "");
  const is_active = formData.get("is_active") === "true";
  if (!z.string().uuid().safeParse(id).success) return;
  await access.supabase!.from("take_rate_campaigns").update({ is_active }).eq("id", id);
  revalidatePath("/super-admin/taxas");
}

export async function deleteCampaign(formData: FormData) {
  const access = await requireAdmin();
  if ("error" in access) return;
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  await access.supabase!.from("take_rate_campaigns").delete().eq("id", id);
  revalidatePath("/super-admin/taxas");
}
