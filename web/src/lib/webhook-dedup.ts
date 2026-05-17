import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

export type DedupResult = "fresh" | "duplicate" | "error";

export async function recordWebhookEvent(
  supa: SupabaseClient<Database>,
  provider: "stripe" | "mercadopago",
  eventId: string,
  payload?: unknown,
): Promise<DedupResult> {
  const { error } = await supa
    .from("webhook_events")
    .insert({ provider, event_id: eventId, payload: payload as never });
  if (!error) return "fresh";
  if (error.code === "23505") return "duplicate";
  return "error";
}
