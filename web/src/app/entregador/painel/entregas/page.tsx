import { redirect } from "next/navigation";
import Link from "next/link";
import { ListChecks, MapPin } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { ClaimNextButton } from "./claim-button";
import { DeliveryStepButtons } from "./step-buttons";
import { AvailableOrderCard } from "./available-order-card";

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

export default async function EntregadorEntregas() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, code, status, total_cents, created_at, business_id, destination_kind, destination_label, businesses(name, address, district)",
    )
    .eq("driver_id", user.id)
    .in("status", ["confirmed", "preparing", "ready", "in_transit"])
    .order("created_at", { ascending: false });

  const { data: availableOrders } = await supabase
    .from("orders")
    .select(
      "id, code, status, total_cents, created_at, business_id, destination_kind, destination_label, businesses(name, address, district)",
    )
    .is("driver_id", null)
    .in("status", ["confirmed", "preparing", "ready"])
    .order("placed_at", { ascending: false })
    .limit(20);

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
            Suas corridas
          </h2>
          <ul className="space-y-3">
            {orders.map((o) => {
              const biz = o.businesses as { name?: string; address?: string; district?: string } | null;
              return (
                <li key={o.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        #{o.code} · {biz?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{STATUS_LABEL[o.status]}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="font-medium">Coletar:</span>{" "}
                        {biz?.address ?? biz?.district ?? "—"}
                      </p>
                      {o.destination_label && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-[color:var(--turtle)]" />
                          <span className="font-medium capitalize">
                            {o.destination_kind ?? "Destino"}:
                          </span>{" "}
                          {o.destination_label}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-base font-bold">
                      {formatCents(o.total_cents)}
                    </span>
                  </div>
                  <DeliveryStepButtons orderId={o.id} status={o.status} />
                  <Link
                    href={`/app/pedidos/${o.id}`}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    Ver detalhes do pedido ↗
                  </Link>
                </li>
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
          <ul className="space-y-2">
            {availableOrders.map((o) => {
              const biz = o.businesses as { name?: string; address?: string; district?: string } | null;
              return (
                <AvailableOrderCard
                  key={o.id}
                  orderId={o.id}
                  code={o.code}
                  status={o.status}
                  totalCents={o.total_cents}
                  businessName={biz?.name ?? "—"}
                  businessAddress={biz?.address ?? biz?.district ?? "—"}
                  destinationKind={o.destination_kind}
                  destinationLabel={o.destination_label}
                  statusLabel={STATUS_LABEL[o.status] ?? o.status}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
