"use server";

import { z } from "zod";
import { saveLead, type LeadType } from "@/lib/leads";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const PartnerSchema = z.object({
  type: z.enum(["comercio", "operador", "motorista", "pousada"]),
  name: z.string().min(2, "Informe seu nome").max(120),
  business: z.string().min(2, "Informe o nome do estabelecimento").max(160),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .max(20)
    .regex(/[\d\s()\-+]+/, "WhatsApp inválido"),
  email: z.string().email("E-mail inválido").max(160).optional().or(z.literal("")),
  cnpj: z.string().max(20).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  district: z.string().max(80).optional().or(z.literal("")),
  about: z.string().max(1000).optional().or(z.literal("")),
});

export type PartnerState = {
  ok: boolean;
  error?: string;
};

export async function submitPartner(
  _prev: PartnerState,
  formData: FormData
): Promise<PartnerState> {
  const parsed = PartnerSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    business: formData.get("business"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email") ?? undefined,
    cnpj: formData.get("cnpj") ?? undefined,
    category: formData.get("category") ?? undefined,
    district: formData.get("district") ?? undefined,
    about: formData.get("about") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const turnstile = await verifyTurnstileToken(formData.get("turnstile_token")?.toString() ?? null);
  if (!turnstile.ok) {
    return { ok: false, error: "Verificação anti-bot falhou. Recarregue a página." };
  }

  const rl = await consumeRateLimit(
    rateLimitKey("submitPartner", parsed.data.whatsapp),
    { limit: 3, windowSeconds: 300 },
  );
  if (!rl.ok) return { ok: false, error: rl.error };

  try {
    await saveLead({
      type: parsed.data.type as LeadType,
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email || null,
      payload: {
        business: parsed.data.business,
        cnpj: parsed.data.cnpj || null,
        category: parsed.data.category || null,
        district: parsed.data.district || null,
        about: parsed.data.about || null,
      },
    });
  } catch (err) {
    console.error("[partner] saveLead failed", err);
    return { ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." };
  }

  return { ok: true };
}
