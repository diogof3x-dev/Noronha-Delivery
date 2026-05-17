import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, DollarSign, RefreshCw, ShoppingBag, Wallet } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { TimeSeriesChart } from "./time-series-chart";
import { PaymentSplitChart } from "./payment-split-chart";

export const dynamic = "force-dynamic";

type Range = "7d" | "30d" | "90d";

function rangeToDays(r: Range): number {
  return r === "7d" ? 7 : r === "30d" ? 30 : 90;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: Range = params.range === "7d" || params.range === "90d" ? params.range : "30d";

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/financeiro");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) {
    return (
      <div className="p-8 text-sm text-destructive">
        Service role não configurado — não consigo ler agregações.
      </div>
    );
  }

  const days = rangeToDays(range);
  const since = isoDaysAgo(days - 1);

  const [{ data: daily }, { data: payment }, { data: geography }, { data: topBiz }, { data: topCust }] =
    await Promise.all([
      admin
        .from("mv_platform_daily")
        .select("*")
        .gte("day", since)
        .order("day", { ascending: true }),
      admin
        .from("mv_payment_methods_weekly")
        .select("*")
        .gte("week", isoDaysAgo(60))
        .order("week", { ascending: true }),
      admin
        .from("mv_geography_orders")
        .select("*")
        .order("gmv_cents", { ascending: false })
        .limit(10),
      admin
        .from("mv_business_lifetime")
        .select("*")
        .order("gmv_cents", { ascending: false })
        .limit(10),
      admin
        .from("mv_customer_lifetime")
        .select("*")
        .order("total_spent_cents", { ascending: false })
        .limit(10),
    ]);

  const rows = daily ?? [];
  const totalGmv = rows.reduce((acc, r) => acc + Number(r.gmv_cents), 0);
  const totalFee = rows.reduce((acc, r) => acc + Number(r.fee_cents), 0);
  const totalOrders = rows.reduce((acc, r) => acc + Number(r.paid_count), 0);
  const totalCancelled = rows.reduce((acc, r) => acc + Number(r.cancelled_count), 0);
  const refundRate = totalOrders + totalCancelled === 0
    ? 0
    : (totalCancelled / (totalOrders + totalCancelled)) * 100;
  const avgTicket = totalOrders === 0 ? 0 : Math.round(totalGmv / totalOrders);

  // série pra gráfico
  const series = rows.map((r) => ({
    day: r.day,
    label: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gmv: Number(r.gmv_cents) / 100,
    fee: Number(r.fee_cents) / 100,
    orders: Number(r.paid_count),
  }));

  const paymentWeeks = (payment ?? []).map((r) => ({
    label: new Date(r.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    pix: Number(r.pix_gmv_cents) / 100,
    card: Number(r.card_gmv_cents) / 100,
  }));

  return (
    <div className="space-y-8 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Super admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Financeiro
          </h1>
          <p className="text-xs text-muted-foreground">
            Dados agregados via materialized views (refresh a cada 5 min)
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <Link
              key={r}
              href={`/super-admin/financeiro?range=${r}`}
              className={`rounded-full px-3 py-1 font-semibold ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label={`GMV (${range})`}
          value={formatCents(totalGmv)}
          tone="primary"
        />
        <KpiCard
          icon={Wallet}
          label={`Receita plataforma (${range})`}
          value={formatCents(totalFee)}
          tone="turtle"
        />
        <KpiCard
          icon={ShoppingBag}
          label={`Pedidos pagos (${range})`}
          value={totalOrders.toLocaleString("pt-BR")}
          tone="sun"
        />
        <KpiCard
          icon={RefreshCw}
          label="Refund rate"
          value={`${refundRate.toFixed(1)}%`}
          tone={refundRate > 5 ? "destructive" : "muted"}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SmallStat label="Ticket médio" value={formatCents(avgTicket)} />
        <SmallStat
          label="Take rate efetivo"
          value={totalGmv > 0 ? `${((totalFee / totalGmv) * 100).toFixed(2)}%` : "—"}
        />
        <SmallStat
          label="Cancelados"
          value={totalCancelled.toLocaleString("pt-BR")}
        />
        <SmallStat
          label="Pix vs Cartão (período)"
          value={
            paymentWeeks.length
              ? `${pixShare(payment ?? [])}% PIX`
              : "—"
          }
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          GMV diário · receita · pedidos
        </h2>
        <TimeSeriesChart data={series} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            PIX vs Cartão (60d, semanal)
          </h2>
          <PaymentSplitChart data={paymentWeeks} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Onde estão os pedidos (90d)
          </h2>
          <ul className="space-y-1.5 text-sm">
            {(geography ?? []).map((g) => (
              <li
                key={g.destination_kind}
                className="flex items-center justify-between gap-3"
              >
                <span className="capitalize">{g.destination_kind}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {g.orders_count} pedidos · {formatCents(g.gmv_cents)}
                </span>
              </li>
            ))}
            {(geography ?? []).length === 0 && (
              <li className="text-xs text-muted-foreground">Sem dados ainda.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Top lojas por GMV (lifetime)
          </h2>
          <ul className="space-y-1.5 text-sm">
            {(topBiz ?? []).map((b, i) => (
              <li key={b.business_id} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  <span className="mr-1 text-xs text-muted-foreground">{i + 1}.</span>
                  {b.name}
                  <span className="ml-1 text-[10px] text-muted-foreground">· {b.type}</span>
                </span>
                <span className="shrink-0 font-mono text-xs">
                  {formatCents(b.gmv_cents)} · {b.paid_count} pedidos
                </span>
              </li>
            ))}
            {(topBiz ?? []).length === 0 && (
              <li className="text-xs text-muted-foreground">Sem dados ainda.</li>
            )}
          </ul>
          <Link
            href="/super-admin/lojas"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Ver todas as lojas <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Top clientes por gasto (lifetime)
          </h2>
          <ul className="space-y-1.5 text-sm">
            {(topCust ?? []).map((c, i) => (
              <li key={c.customer_id} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  <span className="mr-1 text-xs text-muted-foreground">{i + 1}.</span>
                  {c.name ?? "—"}
                  {c.district && (
                    <span className="ml-1 text-[10px] text-muted-foreground">· {c.district}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-xs">
                  {formatCents(c.total_spent_cents)} · {c.paid_orders_count}x
                </span>
              </li>
            ))}
            {(topCust ?? []).length === 0 && (
              <li className="text-xs text-muted-foreground">Sem dados ainda.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "turtle" | "sun" | "destructive" | "muted";
}) {
  const toneClass = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    turtle: "border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 text-[color:var(--turtle)]",
    sun: "border-[color:var(--sun)]/30 bg-[color:var(--sun)]/5 text-[color:var(--sun)]",
    destructive: "border-destructive/30 bg-destructive/5 text-destructive",
    muted: "border-border bg-muted/30 text-muted-foreground",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <Icon className="mb-2 h-4 w-4" />
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function pixShare(rows: { pix_count: number; card_count: number }[]): string {
  const pix = rows.reduce((acc, r) => acc + Number(r.pix_count), 0);
  const card = rows.reduce((acc, r) => acc + Number(r.card_count), 0);
  if (pix + card === 0) return "—";
  return ((pix / (pix + card)) * 100).toFixed(0);
}
