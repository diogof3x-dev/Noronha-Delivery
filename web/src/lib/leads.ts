import { createServiceClient } from "@/lib/supabase/service";

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
  const supabase = createServiceClient();

  if (!supabase) {
    console.warn("[leads] Supabase not configured — lead logged locally only", input);
    return { id: "local-dev", devMode: true } as const;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      type: input.type,
      name: input.name,
      whatsapp: input.whatsapp,
      email: input.email,
      payload: input.payload ?? {},
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
