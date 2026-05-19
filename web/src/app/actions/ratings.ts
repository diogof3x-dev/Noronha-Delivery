"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const Schema = z.object({
  order_id: z.string().uuid(),
  business_stars: z.coerce.number().int().min(1).max(5),
  driver_stars: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(600).optional().or(z.literal("")),
  business_tags: z.array(z.string().max(40)).max(10).optional(),
  driver_tags: z.array(z.string().max(40)).max(10).optional(),
  photo_urls: z.array(z.string().url().max(500)).max(3).optional(),
});

export type RatingState = { ok: boolean; error?: string };

export async function rateOrder(_prev: RatingState, formData: FormData): Promise<RatingState> {
  const parsed = Schema.safeParse({
    order_id: formData.get("order_id"),
    business_stars: formData.get("business_stars"),
    driver_stars: formData.get("driver_stars") || undefined,
    comment: formData.get("comment") ?? undefined,
    business_tags: formData.getAll("business_tags").map(String).filter(Boolean),
    driver_tags: formData.getAll("driver_tags").map(String).filter(Boolean),
    photo_urls: formData.getAll("photo_urls").map(String).filter(Boolean),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login" };

  const rl = await consumeRateLimit(rateLimitKey("rateOrder", user.id), {
    limit: 5,
    windowSeconds: 600,
    errorMessage: "Muitas avaliações em pouco tempo. Aguarde.",
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, business_id, driver_id, status")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado" };
  if (order.customer_id !== user.id) return { ok: false, error: "Só o cliente pode avaliar" };
  if (!["delivered", "completed"].includes(order.status)) {
    return { ok: false, error: "Pedido ainda não foi entregue" };
  }

  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("order_id", parsed.data.order_id)
    .eq("rated_by", user.id)
    .limit(1);
  if (existing && existing.length > 0) {
    return { ok: false, error: "Você já avaliou este pedido" };
  }

  const rows: Array<{
    order_id: string;
    business_id: string;
    rated_entity: "business" | "driver";
    rated_entity_id: string;
    rated_by: string;
    stars: number;
    comment: string | null;
    tags?: string[];
    photo_urls?: string[];
  }> = [];

  rows.push({
    order_id: order.id,
    business_id: order.business_id,
    rated_entity: "business",
    rated_entity_id: order.business_id,
    rated_by: user.id,
    stars: parsed.data.business_stars,
    comment: parsed.data.comment?.trim() || null,
    tags: parsed.data.business_tags?.length ? parsed.data.business_tags : undefined,
    photo_urls: parsed.data.photo_urls?.length ? parsed.data.photo_urls : undefined,
  });

  if (parsed.data.driver_stars && order.driver_id) {
    rows.push({
      order_id: order.id,
      business_id: order.business_id,
      rated_entity: "driver",
      rated_entity_id: order.driver_id,
      rated_by: user.id,
      stars: parsed.data.driver_stars,
      comment: null,
      tags: parsed.data.driver_tags?.length ? parsed.data.driver_tags : undefined,
    });
  }

  const { error } = await supabase.from("ratings").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/pedidos/${parsed.data.order_id}`);
  return { ok: true };
}
