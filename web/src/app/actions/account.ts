"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

export type AccountState = {
  ok: boolean;
  error?: string;
  message?: string;
};

const PersonalSchema = z.object({
  full_name: z.string().min(2, "Informe seu nome").max(120),
  whatsapp: z.string().min(8, "WhatsApp inválido").max(20),
  cpf: z.string().max(20).optional().or(z.literal("")),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD)")
    .optional()
    .or(z.literal("")),
});

export async function updatePersonal(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = PersonalSchema.safeParse({
    full_name: formData.get("full_name"),
    whatsapp: formData.get("whatsapp"),
    cpf: formData.get("cpf") ?? undefined,
    birth_date: formData.get("birth_date") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      whatsapp: parsed.data.whatsapp,
      cpf: parsed.data.cpf || null,
      birth_date: parsed.data.birth_date || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/cadastro");
  revalidatePath("/app/perfil");
  return { ok: true, message: "Dados atualizados" };
}

const AddressSchema = z.object({
  cep: z.string().max(12).optional().or(z.literal("")),
  street: z.string().max(160).optional().or(z.literal("")),
  number: z.string().max(20).optional().or(z.literal("")),
  complement: z.string().max(120).optional().or(z.literal("")),
  district: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(40).optional().or(z.literal("")),
});

export async function updateAddress(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = AddressSchema.safeParse({
    cep: formData.get("cep") ?? undefined,
    street: formData.get("street") ?? undefined,
    number: formData.get("number") ?? undefined,
    complement: formData.get("complement") ?? undefined,
    district: formData.get("district") ?? undefined,
    city: formData.get("city") ?? undefined,
    state: formData.get("state") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const address = {
    cep: parsed.data.cep || "",
    street: parsed.data.street || "",
    number: parsed.data.number || "",
    complement: parsed.data.complement || "",
    district: parsed.data.district || "",
    city: parsed.data.city || "Fernando de Noronha",
    state: parsed.data.state || "PE",
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      address,
      district: parsed.data.district || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/cadastro");
  revalidatePath("/app/perfil");
  return { ok: true, message: "Endereço atualizado" };
}

const PixSchema = z.object({
  pix_kind: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
  pix_value: z.string().min(3, "Informe o valor da chave").max(120),
});

export async function updatePix(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = PixSchema.safeParse({
    pix_kind: formData.get("pix_kind"),
    pix_value: formData.get("pix_value"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const { error } = await supabase
    .from("profiles")
    .update({
      pix_kind: parsed.data.pix_kind,
      pix_value: parsed.data.pix_value.trim(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/parceiro/painel/cadastro");
  return { ok: true, message: "Chave PIX atualizada" };
}

const VehicleSchema = z.object({
  cnh_number: z.string().max(40).optional().or(z.literal("")),
  cnh_category: z.string().max(5).optional().or(z.literal("")),
  vehicle_kind: z
    .enum(["bike_eletrica", "scooter_eletrica", "moto", "buggy", "carro_eletrico", "carro"])
    .optional()
    .or(z.literal("")),
  plate: z.string().max(10).optional().or(z.literal("")),
  model: z.string().max(80).optional().or(z.literal("")),
  year: z.string().max(8).optional().or(z.literal("")),
  color: z.string().max(40).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export async function updateVehicle(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = VehicleSchema.safeParse({
    cnh_number: formData.get("cnh_number") ?? undefined,
    cnh_category: formData.get("cnh_category") ?? undefined,
    vehicle_kind: formData.get("vehicle_kind") ?? undefined,
    plate: formData.get("plate") ?? undefined,
    model: formData.get("model") ?? undefined,
    year: formData.get("year") ?? undefined,
    color: formData.get("color") ?? undefined,
    photo_url: formData.get("photo_url") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const vehicle = {
    kind: parsed.data.vehicle_kind || "",
    plate: (parsed.data.plate || "").toUpperCase(),
    model: parsed.data.model || "",
    year: parsed.data.year || "",
    color: parsed.data.color || "",
    photo_url: parsed.data.photo_url || "",
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      cnh_number: parsed.data.cnh_number || null,
      cnh_category: parsed.data.cnh_category || null,
      vehicle,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/entregador/painel/cadastro");
  return { ok: true, message: "Dados do veículo atualizados" };
}

const PasswordSchema = z
  .object({
    new_password: z.string().min(6, "Senha muito curta").max(72),
    confirm: z.string().min(6),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Senhas não conferem",
    path: ["confirm"],
  });

export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = PasswordSchema.safeParse({
    new_password: formData.get("new_password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Senha alterada com sucesso" };
}
