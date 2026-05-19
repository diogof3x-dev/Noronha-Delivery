"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const Schema = z.object({
  kind: z.enum(["business", "service"]),
  business_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
});

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string };

export async function toggleFavorite(input: {
  kind: "business" | "service";
  businessId: string;
  serviceId?: string;
}): Promise<ToggleFavoriteResult> {
  const parsed = Schema.safeParse({
    kind: input.kind,
    business_id: input.businessId,
    service_id: input.serviceId,
  });
  if (!parsed.success) return { ok: false, error: "Inválido" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra favoritar" };

  const rl = await consumeRateLimit(rateLimitKey("toggleFavorite", user.id), {
    limit: 30,
    windowSeconds: 60,
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  // checa se já existe
  let q = supabase
    .from("customer_favorites")
    .select("id")
    .eq("customer_id", user.id)
    .eq("kind", parsed.data.kind)
    .eq("business_id", parsed.data.business_id);
  q = parsed.data.service_id
    ? q.eq("service_id", parsed.data.service_id)
    : q.is("service_id", null);
  const { data: existing } = await q.maybeSingle();

  if (existing) {
    await supabase.from("customer_favorites").delete().eq("id", existing.id);
    revalidatePath("/app");
    revalidatePath("/app/favoritos");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase.from("customer_favorites").insert({
    customer_id: user.id,
    kind: parsed.data.kind,
    business_id: parsed.data.business_id,
    service_id: parsed.data.service_id ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/favoritos");
  return { ok: true, favorited: true };
}
