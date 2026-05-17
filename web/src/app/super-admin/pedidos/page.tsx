import Link from "next/link";
import { Inbox } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

type Filter = "ativos" | "pagos" | "todos";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  in_transit: "Em rota",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-[color:var(--sun)]/15 text-[color:var(--sun)]",
  confirmed: "bg-primary/15 text-primary",
  preparing: "bg-primary/15 text-primary",
  ready: "bg-primary/15 text-primary",
  in_transit: "bg-primary/15 text-primary",
  delivered: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
  completed: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-destructive/15 text-destructive",
};

export default async function SuperAdminPedidos({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = (params.filter as Filter) ?? "ativos";

  const supabase = await getServerClient();

  let q = supabase
    .from("orders")
    .select(
      "id, code, status, payment_status, payment_method, total_cents, platform_fee_cents, created_at, business_id, businesses(name), driver_id, profiles!orders_driver_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "ativos") {
    q = q.in("status", ["pending", "confirmed", "preparing", "ready", "in_transit"]);
  } else if (filter === "pagos") {
    q = q.eq("payment_status", "paid");
  }

  const { data } = await q;

  const [{ count: ativos }, { count: pagos }, { count: total }] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "preparing", "ready", "in_transit"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: "ativos", label: "Em andamento", count: ativos ?? 0 },
    { value: "pagos", label: "Pagos", count: pagos ?? 0 },
    { value: "todos", label: "Todos", count: total ?? 0 },
  ];

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Pedidos</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Todos os pedidos da plataforma. Pra agir em um pedido específico, abra a página do
          pedido como cliente.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const isActive = filter === t.value;
          return (
            <Link
              key={t.value}
              href={`/super-admin/pedidos?filter=${t.value}`}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  isActive ? "bg-primary-foreground/20" : "bg-background"
                }`}
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {!data?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">Nenhum pedido nesta categoria.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((o) => {
            const biz = o.businesses as { name?: string } | null;
            const driver = o.profiles as { full_name?: string } | null;
            return (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      #{o.code}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[o.status]}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      {o.payment_status === "paid" && (
                        <span className="text-[10px] text-[color:var(--turtle)]">PAGO</span>
                      )}
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {o.payment_method}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {biz?.name ?? "—"} ·{" "}
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                      {driver?.full_name ? ` · entregador: ${driver.full_name}` : ""}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Taxa F3X: {formatCents(o.platform_fee_cents)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold">{formatCents(o.total_cents)}</span>
                    <Link
                      href={`/app/pedidos/${o.id}`}
                      target="_blank"
                      className="text-xs text-primary hover:underline"
                    >
                      Abrir ↗
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
