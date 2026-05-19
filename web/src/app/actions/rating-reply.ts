"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const ReplySchema = z.object({
  rating_id: z.string().uuid(),
  reply: z.string().min(1).max(600),
});

export async function replyToRating(formData: FormData) {
  const parsed = ReplySchema.safeParse({
    rating_id: formData.get("rating_id"),
    reply: formData.get("reply"),
  });
  if (!parsed.success) return { ok: false as const, error: "Resposta inválida" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sessão expirada" };

  const rl = await consumeRateLimit(rateLimitKey("replyRating", user.id), {
    limit: 10,
    windowSeconds: 60,
  });
  if (!rl.ok) return { ok: false as const, error: rl.error };

  // valida que a rating pertence a uma loja do user
  const { data: rating } = await supabase
    .from("ratings")
    .select("id, business_id, businesses(owner_id)")
    .eq("id", parsed.data.rating_id)
    .maybeSingle();
  const ownerId = (rating?.businesses as { owner_id?: string } | null)?.owner_id;
  if (!rating || ownerId !== user.id) {
    return { ok: false as const, error: "Sem permissão" };
  }

  const { error } = await supabase
    .from("ratings")
    .update({
      reply: parsed.data.reply,
      reply_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.rating_id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/parceiro/painel/avaliacoes");
  return { ok: true as const };
}
