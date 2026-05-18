"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const Schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().nonnegative().optional(),
  order_id: z.string().uuid().nullable().optional(),
});

export async function updateDriverPosition(input: {
  lat: number;
  lng: number;
  accuracy?: number;
  order_id?: string | null;
}): Promise<{ ok: boolean }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("driver_live_positions")
    .upsert(
      {
        driver_id: user.id,
        order_id: parsed.data.order_id ?? null,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        accuracy: parsed.data.accuracy ?? null,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "driver_id" },
    );

  return { ok: !error };
}

export async function clearDriverPosition(): Promise<{ ok: boolean }> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from("driver_live_positions").delete().eq("driver_id", user.id);
  return { ok: true };
}
