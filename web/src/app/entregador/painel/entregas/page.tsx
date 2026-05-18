import { redirect } from "next/navigation";
import { ListChecks, MapPin } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { haversineMeters, parseGeo, etaMinutes, urgencyFromPlaced, minutesSince } from "@/lib/geo";
import { ClaimNextButton } from "./claim-button";
import { DeliveryStepButtons } from "./step-buttons";
import { AvailableOrderCard } from "./available-order-card";
import { ActiveOrderCard } from "./active-order-card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado · aceitar e ir buscar",
  preparing: "Em preparo na loja",
  ready: "Pronto pra coleta",
  in_transit: "Em rota até o cliente",
  delivered: "Entregue",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const SELECT =
  "id, code, status, total_cents, delivery_fee_cents, created_at, placed_at, business_id, customer_id, payment_method, payment_status, destination_kind, destination_label, destination_geo, destination_notes, businesses(name, address, district, geo, whatsapp), order_items(name_snapshot, quantity)";

export default async function EntregadorEntregas() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const [{ data: orders }, { data: availableOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select(SELECT)
      .eq("driver_id", user.id)
      .in("status", ["confirmed", "preparing", "ready", "in_transit"])
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(SELECT)
      .is("driver_id", null)
      .in("status", ["confirmed", "preparing", "ready"])
      .order("placed_at", { ascending: false })
      .limit(20),
  ]);

  const admin = getAdminClient();
  const customerIds = Array.from(
    new Set(
      [...(orders ?? []), ...(availableOrders ?? [])]
        .map((o) => (o as { customer_id?: string }).customer_id)
        .filter((x): x is string => !!x),
    ),
  );
  const customerMap = new Map<string, { name: string | null; whatsapp: string | null }>();
  if (admin && customerIds.length) {
    const { data: customers } = await admin
      .from("profiles")
      .select("id, full_name, whatsapp")
      .in("id", customerIds);
    for (const c of customers ?? []) {
      customerMap.set(c.id, { name: c.full_name, whatsapp: c.whatsapp });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Entregas ativas
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Corridas em andamento
          </h1>
        </div>
        <ClaimNextButton available={availableOrders?.length ?? 0} />
      </header>

      {orders?.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Suas corridas ({orders.length})
          </h2>
          <ul className="space-y-3">
            {orders.map((o) => {
              const biz = o.businesses as { name?: string; address?: string; district?: string; geo?: unknown; whatsapp?: string } | null;
              const cust = o.customer_id ? customerMap.get(o.customer_id) : undefined;
              const pickupAddr = biz?.address ?? biz?.district ?? null;
              const pickupQuery = pickupAddr
                ? `${biz?.name ? biz.name + ", " : ""}${pickupAddr}, Fernando de Noronha`
                : null;
              const destQuery = o.destination_label
                ? `${o.destination_label}, Fernando de Noronha`
                : null;
              const bizGeo = parseGeo(biz?.geo);
              const destGeo = parseGeo(o.destination_geo);
              const routeM = bizGeo && destGeo ? haversineMeters(bizGeo, destGeo) : null;
              return (
                <ActiveOrderCard
                  key={o.id}
                  orderId={o.id}
                  code={o.code}
                  status={o.status}
                  statusLabel={STATUS_LABEL[o.status] ?? o.status}
                  driverEarningsCents={o.delivery_fee_cents ?? 0}
                  paymentMethod={o.payment_method}
                  paymentStatus={o.payment_status}
                  totalCents={o.total_cents}
                  businessName={biz?.name ?? "—"}
                  pickupAddr={pickupAddr}
                  pickupQuery={pickupQuery}
                  destinationKind={o.destination_kind}
                  destinationLabel={o.destination_label}
                  destinationNotes={o.destination_notes}
                  destQuery={destQuery}
                  routeKm={routeM != null ? routeM / 1000 : null}
                  customerName={cust?.name ?? null}
                  customerWhatsapp={cust?.whatsapp ?? null}
                  businessWhatsapp={biz?.whatsapp ?? null}
                  stepButtons={<DeliveryStepButtons orderId={o.id} status={o.status} />}
                />
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Corridas disponíveis ({availableOrders?.length ?? 0})
        </h2>
        {!availableOrders?.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <ListChecks className="h-5 w-5" />
            </span>
            <p className="max-w-md text-sm text-muted-foreground">
              {orders?.length
                ? "Nenhuma corrida nova aguardando. Termine as suas primeiro."
                : "Aguardando lojistas confirmarem pedidos. Aparece aqui assim que sair."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {availableOrders.map((o) => {
              const biz = o.businesses as { name?: string; address?: string; district?: string; geo?: unknown } | null;
              const items = (o.order_items as Array<{ name_snapshot: string; quantity: number }> | null) ?? [];
              const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
              const itemsPreview =
                items
                  .slice(0, 2)
                  .map((i) => `${i.quantity}× ${i.name_snapshot}`)
                  .join(", ") + (items.length > 2 ? `, +${items.length - 2}…` : "");

              const bizGeo = parseGeo(biz?.geo);
              const destGeo = parseGeo(o.destination_geo);
              const routeMeters = bizGeo && destGeo ? haversineMeters(bizGeo, destGeo) : null;

              return (
                <AvailableOrderCard
                  key={o.id}
                  orderId={o.id}
                  code={o.code}
                  status={o.status}
                  totalCents={o.total_cents}
                  driverEarningsCents={o.delivery_fee_cents ?? 0}
                  paymentMethod={o.payment_method}
                  paymentStatus={o.payment_status}
                  businessName={biz?.name ?? "—"}
                  businessAddress={biz?.address ?? biz?.district ?? "—"}
                  businessDistrict={biz?.district ?? null}
                  destinationKind={o.destination_kind}
                  destinationLabel={o.destination_label}
                  destinationDistrict={null}
                  itemsCount={itemsCount}
                  itemsPreview={itemsPreview}
                  pickupDistanceMeters={null}
                  routeDistanceMeters={routeMeters}
                  routeEtaMinutes={routeMeters != null ? etaMinutes(routeMeters) : null}
                  minutesSincePlaced={minutesSince(o.placed_at ?? o.created_at)}
                  urgency={urgencyFromPlaced(o.placed_at ?? o.created_at)}
                  statusLabel={STATUS_LABEL[o.status] ?? o.status}
                />
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> toque em <MapPin className="inline h-3 w-3 text-primary" /> num endereço pra
          abrir no Google Maps. Toque em <strong>WhatsApp</strong> pra falar direto com
          cliente ou lojista sem precisar guardar telefone.
        </p>
      </section>
    </div>
  );
}
