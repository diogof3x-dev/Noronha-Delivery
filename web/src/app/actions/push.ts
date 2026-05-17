"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  user_agent: z.string().max(500).optional(),
});

export async function savePushSubscription(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = SubscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inscrição inválida" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sem login" };

  const rl = await consumeRateLimit(rateLimitKey("savePush", user.id), {
    limit: 10,
    windowSeconds: 60,
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        user_agent: parsed.data.user_agent ?? null,
        failed_at: null,
      },
      { onConflict: "user_id,endpoint" },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deletePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  return { ok: true };
}
