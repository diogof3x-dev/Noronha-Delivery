import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export async function getServerClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars não configuradas");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of values) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component context: ignore, refresh happens via proxy
        }
      },
    },
  });
}
