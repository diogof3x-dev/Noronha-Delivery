import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto pra coleta",
  in_transit: "Em rota",
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
    .select("id, code, status, total_cents, created_at, business_id, businesses(name)")
    .eq("driver_id", user.id)
    .in("status", ["confirmed", "preparing", "ready", "in_transit"])
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Entregas ativas
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Corridas em andamento
        </h1>
      </header>

      {!orders?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <ListChecks className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhuma entrega ativa</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Quando você ficar online (em breve), os pedidos disponíveis aparecem aqui pra
            aceitar.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  #{o.code} · {(o.businesses as { name?: string } | null)?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">{STATUS_LABEL[o.status]}</p>
              </div>
              <span className="text-sm font-bold">{formatCents(o.total_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
