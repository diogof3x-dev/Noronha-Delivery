"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const Schema = z.object({
  code: z.string().min(2).max(40),
  subtotalCents: z.number().int().min(0),
  businessId: z.string().uuid(),
});

export type ValidateCouponResult =
  | { ok: true; discountCents: number; couponId: string; code: string }
  | { ok: false; error: string };

export async function validateCoupon(input: z.infer<typeof Schema>): Promise<ValidateCouponResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cupom inválido" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rl = await consumeRateLimit(
    rateLimitKey("validateCoupon", user?.id ?? parsed.data.businessId),
    { limit: 20, windowSeconds: 60 },
  );
  if (!rl.ok) return { ok: false, error: rl.error };

  const { data, error } = await supabase.rpc("validate_coupon", {
    p_code: parsed.data.code.trim(),
    p_subtotal_cents: parsed.data.subtotalCents,
    p_business_id: parsed.data.businessId,
    p_customer_id: user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };

  const row = (data ?? [])[0];
  if (!row || row.error || !row.coupon_id) {
    return { ok: false, error: row?.error ?? "Cupom não encontrado" };
  }
  return {
    ok: true,
    couponId: row.coupon_id,
    discountCents: row.discount_cents,
    code: parsed.data.code.trim().toUpperCase(),
  };
}
