"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { logAdminAction } from "@/lib/audit";

async function guardAdmin() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sem login" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { ok: false as const, error: "Sem permissão" };
  const admin = getAdminClient();
  if (!admin) return { ok: false as const, error: "Service role não configurado" };
  return { ok: true as const, adminId: user.id, admin };
}

const SuspendSchema = z.object({
  business_id: z.string().uuid(),
  reason: z.string().min(3).max(280),
});

export async function suspendBusiness(formData: FormData) {
  const ctx = await guardAdmin();
  if (!ctx.ok) return ctx;
  const parsed = SuspendSchema.safeParse({
    business_id: formData.get("business_id"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const { data: biz } = await ctx.admin
    .from("businesses")
    .select("name")
    .eq("id", parsed.data.business_id)
    .maybeSingle();

  const { error } = await ctx.admin
    .from("businesses")
    .update({
      is_active: false,
      suspended_reason: parsed.data.reason,
      suspended_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.business_id);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction({
    adminId: ctx.adminId,
    action: "suspend_business",
    targetType: "business",
    targetId: parsed.data.business_id,
    targetLabel: biz?.name ?? null,
    payload: { reason: parsed.data.reason },
  });

  revalidatePath("/super-admin/lojas");
  revalidatePath("/super-admin/auditoria");
  return { ok: true as const };
}

export async function unsuspendBusiness(formData: FormData) {
  const ctx = await guardAdmin();
  if (!ctx.ok) return ctx;
  const id = String(formData.get("business_id") ?? "");
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false as const, error: "ID inválido" };
  }

  const { data: biz } = await ctx.admin
    .from("businesses")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await ctx.admin
    .from("businesses")
    .update({ is_active: true, suspended_reason: null, suspended_at: null })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction({
    adminId: ctx.adminId,
    action: "unsuspend_business",
    targetType: "business",
    targetId: id,
    targetLabel: biz?.name ?? null,
  });
  revalidatePath("/super-admin/lojas");
  return { ok: true as const };
}

const BanSchema = z.object({
  customer_id: z.string().uuid(),
  reason: z.string().min(3).max(280),
});

export async function banCustomer(formData: FormData) {
  const ctx = await guardAdmin();
  if (!ctx.ok) return ctx;
  const parsed = BanSchema.safeParse({
    customer_id: formData.get("customer_id"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const { data: prof } = await ctx.admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", parsed.data.customer_id)
    .maybeSingle();
  if (prof?.role === "admin") return { ok: false as const, error: "Não pode banir admin" };

  const { error } = await ctx.admin
    .from("profiles")
    .update({
      is_banned: true,
      banned_reason: parsed.data.reason,
      banned_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.customer_id);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction({
    adminId: ctx.adminId,
    action: "ban_customer",
    targetType: "profile",
    targetId: parsed.data.customer_id,
    targetLabel: prof?.full_name ?? null,
    payload: { reason: parsed.data.reason },
  });
  return { ok: true as const };
}

export async function unbanCustomer(formData: FormData) {
  const ctx = await guardAdmin();
  if (!ctx.ok) return ctx;
  const id = String(formData.get("customer_id") ?? "");
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false as const, error: "ID inválido" };
  }

  const { data: prof } = await ctx.admin
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await ctx.admin
    .from("profiles")
    .update({ is_banned: false, banned_reason: null, banned_at: null })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction({
    adminId: ctx.adminId,
    action: "unban_customer",
    targetType: "profile",
    targetId: id,
    targetLabel: prof?.full_name ?? null,
  });
  return { ok: true as const };
}

const TakeRateSchema = z.object({
  business_id: z.string().uuid(),
  bps: z.coerce.number().int().min(0).max(5000),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  note: z.string().max(120).optional(),
});

export async function setBusinessTakeRate(formData: FormData) {
  const ctx = await guardAdmin();
  if (!ctx.ok) return ctx;
  const parsed = TakeRateSchema.safeParse({
    business_id: formData.get("business_id"),
    bps: formData.get("bps"),
    starts_at: formData.get("starts_at") || undefined,
    ends_at: formData.get("ends_at") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const { data: biz } = await ctx.admin
    .from("businesses")
    .select("name")
    .eq("id", parsed.data.business_id)
    .maybeSingle();

  const startsAt = parsed.data.starts_at
    ? new Date(parsed.data.starts_at).toISOString()
    : new Date().toISOString();
  const endsAt = parsed.data.ends_at
    ? new Date(parsed.data.ends_at).toISOString()
    : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

  // desativa overrides anteriores pra essa loja
  await ctx.admin
    .from("take_rate_campaigns")
    .update({ is_active: false })
    .eq("applies_to", "business")
    .eq("applies_id", parsed.data.business_id);

  const { error } = await ctx.admin.from("take_rate_campaigns").insert({
    name: parsed.data.note ?? `Override loja ${biz?.name ?? parsed.data.business_id.slice(0, 8)}`,
    applies_to: "business",
    applies_id: parsed.data.business_id,
    take_rate_bps: parsed.data.bps,
    priority: 100,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: true,
  });
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction({
    adminId: ctx.adminId,
    action: "set_business_take_rate",
    targetType: "business",
    targetId: parsed.data.business_id,
    targetLabel: biz?.name ?? null,
    payload: { bps: parsed.data.bps, note: parsed.data.note, starts_at: startsAt, ends_at: endsAt },
  });

  revalidatePath("/super-admin/lojas");
  revalidatePath("/super-admin/taxas");
  return { ok: true as const };
}
