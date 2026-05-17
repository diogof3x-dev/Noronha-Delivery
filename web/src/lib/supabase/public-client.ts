import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let cached: SupabaseClient<Database> | null = null;

export function createPublicClient(): SupabaseClient<Database> | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Throws se env vars não estiverem configuradas; uso em ISR rotas públicas
// onde não faz sentido seguir sem cliente.
export function getPublicClient(): SupabaseClient<Database> {
  const c = createPublicClient();
  if (!c) throw new Error("Supabase env vars não configuradas (public client)");
  return c;
}
