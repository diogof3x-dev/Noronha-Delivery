"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const InviteSchema = z.object({
  business_id: z.string().uuid(),
  email: z.string().email().max(160),
  role: z.enum(["manager", "staff"]),
});

async function guardOwner(supabase: Awaited<ReturnType<typeof getServerClient>>, businessId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sessão expirada" };
  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_id, name")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz || biz.owner_id !== user.id) return { ok: false as const, error: "Sem permissão" };
  return { ok: true as const, user, businessName: biz.name };
}

export async function inviteMember(formData: FormData) {
  const parsed = InviteSchema.safeParse({
    business_id: formData.get("business_id"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };

  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, parsed.data.business_id);
  if (!guard.ok) return guard;

  const lower = parsed.data.email.toLowerCase().trim();

  // tenta linkar ao user existente
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id");
  // não pode escanear todos os profiles (RLS) — vamos inserir só com email; se a pessoa criar conta com esse email, um trigger ou check no login completa o user_id

  const { error } = await supabase.from("business_members").insert({
    business_id: parsed.data.business_id,
    invited_email: lower,
    role: parsed.data.role,
    invited_by: guard.user.id,
  });
  if (error) {
    if (error.code === "23505") return { ok: false as const, error: "Esse email já foi convidado" };
    return { ok: false as const, error: error.message };
  }

  // TODO: disparar email de convite via Resend
  revalidatePath("/parceiro/painel/equipe");
  return { ok: true as const };
}

export async function removeMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  if (!z.string().uuid().safeParse(businessId).success) return;

  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, businessId);
  if (!guard.ok) return;

  await supabase
    .from("business_members")
    .update({ removed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", businessId);

  revalidatePath("/parceiro/painel/equipe");
}

export async function updateMemberRole(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!["manager", "staff"].includes(role)) return;
  if (!z.string().uuid().safeParse(id).success) return;

  const supabase = await getServerClient();
  const guard = await guardOwner(supabase, businessId);
  if (!guard.ok) return;

  await supabase
    .from("business_members")
    .update({ role: role as "manager" | "staff" })
    .eq("id", id)
    .eq("business_id", businessId);

  revalidatePath("/parceiro/painel/equipe");
}
