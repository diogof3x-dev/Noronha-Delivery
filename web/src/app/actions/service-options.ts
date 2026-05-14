"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const GroupSchema = z.object({
  service_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: z.enum(["required", "optional"]),
  min_choices: z.coerce.number().int().min(0).max(20).default(0),
  max_choices: z.coerce.number().int().min(1).max(20).default(1),
});

export async function addOptionGroup(formData: FormData): Promise<void> {
  const parsed = GroupSchema.safeParse({
    service_id: formData.get("service_id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    min_choices: formData.get("min_choices") ?? 0,
    max_choices: formData.get("max_choices") ?? 1,
  });
  if (!parsed.success) return;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("service_option_groups").insert({
    service_id: parsed.data.service_id,
    name: parsed.data.name.trim(),
    kind: parsed.data.kind,
    min_choices: parsed.data.kind === "required" ? Math.max(1, parsed.data.min_choices) : parsed.data.min_choices,
    max_choices: parsed.data.max_choices,
  });

  revalidatePath("/parceiro/painel/cardapio");
}

export async function deleteOptionGroup(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const supabase = await getServerClient();
  await supabase.from("service_option_groups").delete().eq("id", id);
  revalidatePath("/parceiro/painel/cardapio");
}

const OptionSchema = z.object({
  group_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  price_delta_brl: z.string().optional().or(z.literal("")),
});

function parseBrl(input?: string): number {
  if (!input) return 0;
  const cleaned = String(input).trim().replace(/\s/g, "").replace(/^r\$/i, "");
  if (!cleaned) return 0;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export async function addOption(formData: FormData): Promise<void> {
  const parsed = OptionSchema.safeParse({
    group_id: formData.get("group_id"),
    name: formData.get("name"),
    price_delta_brl: formData.get("price_delta_brl") ?? undefined,
  });
  if (!parsed.success) return;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("service_options").insert({
    group_id: parsed.data.group_id,
    name: parsed.data.name.trim(),
    price_delta_cents: parseBrl(parsed.data.price_delta_brl),
  });

  revalidatePath("/parceiro/painel/cardapio");
}

export async function deleteOption(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;
  const supabase = await getServerClient();
  await supabase.from("service_options").delete().eq("id", id);
  revalidatePath("/parceiro/painel/cardapio");
}
