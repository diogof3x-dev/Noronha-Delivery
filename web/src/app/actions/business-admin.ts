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
  return { supabase };
}

export async function approveBusinessAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!
    .from("businesses")
    .update({ is_verified: true, is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/super-admin/lojas");
}

export async function unapproveBusinessAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!
    .from("businesses")
    .update({ is_verified: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/super-admin/lojas");
}

export async function setBusinessActiveAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!
    .from("businesses")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/super-admin/lojas");
}

export async function toggleEcoCertifiedAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const eco = formData.get("eco") === "true";
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!
    .from("businesses")
    .update({ is_eco_certified: eco, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/super-admin/lojas");
}
