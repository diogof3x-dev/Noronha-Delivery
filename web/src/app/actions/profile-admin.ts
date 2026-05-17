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

export async function setProfileRoleAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  if (!["customer", "business_owner", "driver", "admin"].includes(role)) return;

  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!
    .from("profiles")
    .update({ role: role as "customer" | "business_owner" | "driver" | "admin", updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/super-admin/entregadores");
  revalidatePath("/super-admin/usuarios");
}

export async function setDriverApprovedAdmin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const approved = formData.get("approved") === "true";
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  // promove pra driver se aprovado, customer se desaprovado
  await access.supabase!
    .from("profiles")
    .update({
      role: approved ? "driver" : "customer",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/super-admin/entregadores");
}
