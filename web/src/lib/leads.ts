import { createPublicClient } from "@/lib/supabase/public-client";
import { sendLeadNotification } from "@/lib/email";

export type LeadType =
  | "waitlist"
  | "comercio"
  | "operador"
  | "motorista"
  | "pousada";

export type LeadInput = {
  type: LeadType;
  name: string;
  whatsapp: string;
  email?: string | null;
  payload?: Record<string, unknown>;
};

export async function saveLead(input: LeadInput) {
  const supabase = createPublicClient();

  if (!supabase) {
    console.warn("[leads] Supabase not configured — lead logged locally only", input);
    return { devMode: true } as const;
  }

  const { error } = await supabase.from("leads").insert({
    type: input.type,
    name: input.name,
    whatsapp: input.whatsapp,
    email: input.email,
    payload: input.payload ?? {},
  });

  if (error) throw error;

  // Notifica equipe via e-mail (fire-and-forget; falha não bloqueia o cadastro)
  void sendLeadNotification({
    type: input.type,
    name: input.name,
    whatsapp: input.whatsapp,
    email: input.email,
    payload: input.payload,
  });

  return { devMode: false } as const;
}
