"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const PayloadSchema = z.object({
  business: z
    .object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
      deliveryFeeCents: z.number().nullable(),
      minOrderCents: z.number().nullable(),
      avgPrepMinutes: z.number().nullable(),
      heroColor: z.string().optional(),
    })
    .nullable(),
  items: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        lineId: z.string(),
        name: z.string(),
        priceCents: z.number().int(),
        quantity: z.number().int().min(1).max(50),
        imageUrl: z.string().nullable().optional(),
        notes: z.string().optional(),
        options: z
          .array(
            z.object({
              groupId: z.string(),
              groupName: z.string(),
              optionId: z.string(),
              optionName: z.string(),
              priceDeltaCents: z.number().int(),
            }),
          )
          .optional(),
      }),
    )
    .max(50),
});

export type CartPayload = z.infer<typeof PayloadSchema>;
export type CartSyncResult =
  | { ok: true; remote?: CartPayload; updatedAt?: string }
  | { ok: false };

export async function saveCart(payload: CartPayload): Promise<{ ok: boolean }> {
  const parsed = PayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  if (!parsed.data.business || parsed.data.items.length === 0) {
    // carrinho vazio: deleta
    await supabase.from("customer_carts").delete().eq("customer_id", user.id);
    return { ok: true };
  }

  const { error } = await supabase
    .from("customer_carts")
    .upsert(
      {
        customer_id: user.id,
        payload: parsed.data as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id" },
    );
  return { ok: !error };
}

export async function loadCart(): Promise<CartSyncResult> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data, error } = await supabase
    .from("customer_carts")
    .select("payload, updated_at")
    .eq("customer_id", user.id)
    .maybeSingle();
  if (error || !data) return { ok: true };

  return {
    ok: true,
    remote: data.payload as CartPayload,
    updatedAt: data.updated_at,
  };
}

export async function clearServerCart(): Promise<{ ok: boolean }> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from("customer_carts").delete().eq("customer_id", user.id);
  return { ok: true };
}
