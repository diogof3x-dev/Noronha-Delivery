import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EntregadorHistorico() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, code, status, total_cents, delivered_at, business_id, businesses(name)")
    .eq("driver_id", user.id)
    .in("status", ["delivered", "completed", "cancelled"])
    .order("delivered_at", { ascending: false, nullsFirst: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Histórico
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Entregas concluídas
        </h1>
      </header>

      {!orders?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <History className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Sem histórico ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Quando você concluir entregas, vão aparecer aqui com data, valor e avaliação.
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
                <p className="text-xs text-muted-foreground">
                  {o.delivered_at
                    ? new Date(o.delivered_at).toLocaleString("pt-BR")
                    : "—"}
                </p>
              </div>
              <span className="text-sm font-bold">{formatCents(o.total_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
