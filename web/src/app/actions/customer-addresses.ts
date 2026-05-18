"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { geocodeAddress } from "@/lib/geocoding";

const KINDS = ["pousada", "praia", "barco", "casa", "outro"] as const;

const SaveSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(60),
  kind: z.enum(KINDS),
  address: z.string().min(3).max(300),
  notes: z.string().max(300).optional(),
  is_default: z.boolean().optional(),
});

export type AddressResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveCustomerAddress(formData: FormData): Promise<AddressResult> {
  const parsed = SaveSchema.safeParse({
    id: formData.get("id") || undefined,
    label: formData.get("label"),
    kind: formData.get("kind"),
    address: formData.get("address"),
    notes: formData.get("notes") || undefined,
    is_default:
      formData.get("is_default") === "on" || formData.get("is_default") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const geo = await geocodeAddress(parsed.data.address);

  if (parsed.data.id) {
    const { data: existing } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("id", parsed.data.id)
      .eq("customer_id", user.id)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Endereço não encontrado" };

    const { error } = await supabase
      .from("customer_addresses")
      .update({
        label: parsed.data.label,
        kind: parsed.data.kind,
        address: parsed.data.address,
        notes: parsed.data.notes ?? null,
        geo: geo as never,
        is_default: parsed.data.is_default ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/app/perfil/enderecos");
    revalidatePath("/app/carrinho");
    return { ok: true, id: parsed.data.id };
  }

  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: user.id,
      label: parsed.data.label,
      kind: parsed.data.kind,
      address: parsed.data.address,
      notes: parsed.data.notes ?? null,
      geo: geo as never,
      is_default: parsed.data.is_default ?? false,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Falha ao salvar" };

  revalidatePath("/app/perfil/enderecos");
  revalidatePath("/app/carrinho");
  return { ok: true, id: data.id };
}

export async function deleteCustomerAddress(formData: FormData): Promise<{ ok: boolean }> {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return { ok: false };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", user.id);

  revalidatePath("/app/perfil/enderecos");
  return { ok: true };
}

export async function setDefaultAddress(formData: FormData): Promise<{ ok: boolean }> {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return { ok: false };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from("customer_addresses")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("customer_id", user.id);

  revalidatePath("/app/perfil/enderecos");
  revalidatePath("/app/carrinho");
  return { ok: true };
}
