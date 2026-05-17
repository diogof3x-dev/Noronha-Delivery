"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { sendLeadApprovedNotification } from "@/lib/email";

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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const LEAD_TO_TYPE: Record<string, string> = {
  comercio: "restaurante",
  pousada: "pousada",
  operador: "operador_passeio",
  motorista: "motorista",
};

const ApproveLeadSchema = z.object({
  lead_id: z.string().uuid(),
  business_type: z.enum([
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
  ]),
  business_name: z.string().min(2).max(120),
  district: z.string().min(2).max(80),
  owner_email: z.string().email().optional().or(z.literal("")),
});

export type LeadAdminState = { ok: boolean; error?: string; businessId?: string };

export async function approveLead(_prev: LeadAdminState, formData: FormData): Promise<LeadAdminState> {
  const access = await requireAdmin();
  if ("error" in access) return { ok: false, error: access.error };

  const parsed = ApproveLeadSchema.safeParse({
    lead_id: formData.get("lead_id"),
    business_type: formData.get("business_type"),
    business_name: formData.get("business_name"),
    district: formData.get("district"),
    owner_email: formData.get("owner_email") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = access.supabase!;

  const { data: lead } = await supabase
    .from("leads")
    .select("id, type, name, whatsapp, email, payload, contacted")
    .eq("id", parsed.data.lead_id)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead não encontrado" };

  const payload = (lead.payload as { about?: string; cnpj?: string; category?: string } | null) ?? {};

  // tenta achar o profile do owner pelo email ou whatsapp do lead
  const ownerEmail = parsed.data.owner_email?.trim() || lead.email?.trim() || "";
  let ownerId: string | null = null;

  if (ownerEmail) {
    // chama auth admin via service role pra achar user pelo email
    const { data: authUsers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", `%${lead.name.split(" ").slice(0, 2).join(" ")}%`)
      .limit(5);
    if (authUsers && authUsers.length > 0) ownerId = authUsers[0].id;
  }

  if (!ownerId && lead.whatsapp) {
    const { data: byWa } = await supabase
      .from("profiles")
      .select("id")
      .ilike("whatsapp", `%${lead.whatsapp.slice(-9)}%`)
      .limit(1)
      .maybeSingle();
    if (byWa) ownerId = byWa.id;
  }

  if (!ownerId) {
    return {
      ok: false,
      error: "Owner não encontrado. Peça pra ele logar com Google primeiro, depois reaprove.",
    };
  }

  await supabase
    .from("profiles")
    .update({
      role: "business_owner",
      whatsapp: lead.whatsapp ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ownerId);

  // slug único
  let baseSlug = slugify(parsed.data.business_name);
  if (!baseSlug) baseSlug = `loja-${Date.now().toString(36)}`;
  let slug = baseSlug;
  for (let i = 0; i < 8; i++) {
    const { data: exists } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`;
  }

  const { data: created, error: bErr } = await supabase
    .from("businesses")
    .insert({
      owner_id: ownerId,
      type: parsed.data.business_type,
      name: parsed.data.business_name.trim(),
      slug,
      description: payload.about ?? null,
      district: parsed.data.district.trim(),
      whatsapp: lead.whatsapp ?? null,
      delivery_fee_cents: 0,
      min_order_cents: 0,
      avg_prep_minutes: 35,
      delivery_enabled: true,
      is_active: true,
      is_verified: true,
      metadata: { cnpj: payload.cnpj ?? null, category: payload.category ?? null, from_lead: lead.id },
    })
    .select("id")
    .single();
  if (bErr || !created) return { ok: false, error: bErr?.message ?? "Falha ao criar loja" };

  await supabase.from("leads").update({ contacted: true }).eq("id", lead.id);

  // notifica o lojista que sua loja foi aprovada
  if (lead.email || ownerEmail) {
    void sendLeadApprovedNotification({
      email: lead.email ?? ownerEmail,
      name: lead.name.split(" ")[0] ?? lead.name,
      businessName: parsed.data.business_name,
      businessSlug: slug,
      businessType: parsed.data.business_type,
    });
  }

  revalidatePath("/super-admin/leads");
  revalidatePath("/super-admin/lojas");
  return { ok: true, businessId: created.id };
}

export async function dismissLead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!.from("leads").update({ contacted: true }).eq("id", id);
  revalidatePath("/super-admin/leads");
}

export async function deleteLead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const access = await requireAdmin();
  if ("error" in access) return;
  await access.supabase!.from("leads").delete().eq("id", id);
  revalidatePath("/super-admin/leads");
}
