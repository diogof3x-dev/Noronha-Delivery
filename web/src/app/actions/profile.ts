"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const DISTRICTS = [
  "Vila dos Remédios",
  "Vila do Trinta",
  "Vila do Boldró",
  "Floresta Nova",
  "Floresta Velha",
  "Vila do Sueste",
  "Porto",
] as const;

const OnboardingSchema = z.object({
  full_name: z.string().min(2, "Informe seu nome").max(120),
  is_resident: z.enum(["true", "false"]).transform((v) => v === "true"),
  district: z.enum(DISTRICTS),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
});

export type OnboardingState = {
  ok: boolean;
  error?: string;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = OnboardingSchema.safeParse({
    full_name: formData.get("full_name"),
    is_resident: formData.get("is_resident"),
    district: formData.get("district"),
    whatsapp: formData.get("whatsapp") ?? undefined,
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
      is_resident: parsed.data.is_resident,
      district: parsed.data.district,
      whatsapp: parsed.data.whatsapp || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export { DISTRICTS };
