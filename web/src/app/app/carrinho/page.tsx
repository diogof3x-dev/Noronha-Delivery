import { getServerClient } from "@/lib/supabase/server-client";
import { CartView } from "./cart-view";
import type { SavedAddress } from "@/components/checkout/address-picker";

export const metadata = { title: "Carrinho" };
export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let savedAddresses: SavedAddress[] = [];
  if (user) {
    const { data } = await supabase
      .from("customer_addresses")
      .select("id, label, kind, address, notes, geo, is_default")
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    savedAddresses = (data ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      kind: a.kind as SavedAddress["kind"],
      address: a.address,
      notes: a.notes,
      geo:
        a.geo &&
        typeof (a.geo as { lat?: unknown }).lat === "number" &&
        typeof (a.geo as { lng?: unknown }).lng === "number"
          ? { lat: (a.geo as { lat: number }).lat, lng: (a.geo as { lng: number }).lng }
          : null,
      is_default: a.is_default,
    }));
  }

  return <CartView savedAddresses={savedAddresses} />;
}
