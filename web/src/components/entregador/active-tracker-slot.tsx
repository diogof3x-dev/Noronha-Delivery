import { getServerClient } from "@/lib/supabase/server-client";
import { DriverPositionTracker } from "./position-tracker";

/**
 * Slot server-side: detecta a corrida ativa do motoboy (in_transit) e
 * passa pro tracker client-side. Se não tem in_transit, retorna null.
 */
export async function ActiveTrackerSlot() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("driver_id", user.id)
    .in("status", ["in_transit", "ready"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <DriverPositionTracker activeOrderId={order?.id ?? null} />;
}
