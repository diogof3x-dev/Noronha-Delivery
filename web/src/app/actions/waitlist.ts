"use server";

import { z } from "zod";
import { saveLead } from "@/lib/leads";

const WaitlistSchema = z.object({
  name: z.string().min(2, "Informe seu nome").max(120),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .max(20)
    .regex(/[\d\s()\-+]+/, "WhatsApp inválido"),
  email: z.string().email("E-mail inválido").max(160).optional().or(z.literal("")),
  profile: z.enum(["turista", "morador"]),
});

export type WaitlistState = {
  ok: boolean;
  error?: string;
};

export async function submitWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const parsed = WaitlistSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email") ?? undefined,
    profile: formData.get("profile"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await saveLead({
      type: "waitlist",
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email || null,
      payload: { profile: parsed.data.profile },
    });
  } catch (err) {
    console.error("[waitlist] saveLead failed", err);
    return { ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." };
  }

  return { ok: true };
}
