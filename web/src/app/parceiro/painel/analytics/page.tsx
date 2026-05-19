import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { SalesChart } from "@/components/parceiro/sales-chart";
import { HourlyChart } from "@/components/parceiro/hourly-chart";
import { HeatmapDowHour } from "@/components/parceiro/heatmap-dow-hour";
import { PaymentSplitChart } from "@/app/super-admin/financeiro/payment-split-chart";
import { Stat } from "@/components/dashboard/cards";

export const dynamic = "force-dynamic";

type Range = "7d" | "30d" | "90d";

function rangeDays(r: Range): number {
  return r === "7d" ? 7 : r === "30d" ? 30 : 90;
}

export default async function PainelAnalytics({
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
  if (!user) redirect("/parceiro/entrar");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id);
  const business = businesses?.[0];

  if (!business) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Cadastre uma loja em <Link href="/parceiro/painel/loja" className="text-primary underline">Minha loja</Link> primeiro.
      </div>
    );
  }

  const admin = getAdminClient();
  if (!admin) return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;

  const since = new Date();
  since.setDate(since.getDate() - rangeDays(range) + 1);
  since.setHours(0, 0, 0, 0);
  const sinceISO = since.toISOString().slice(0, 10);

  const [{ data: daily }, { data: dowHour }, { data: topProducts }, { data: paidOrders }, { data: customers }] =
    await Promise.all([
      admin
        .from("mv_business_daily")
        .select("*")
        .eq("business_id", business.id)
        .gte("day", sinceISO)
        .order("day", { ascending: true }),
      admin.from("mv_business_dow_hour").select("*").eq("business_id", business.id),
      admin
        .from("mv_business_top_products")
        .select("*")
        .eq("business_id", business.id)
        .order("revenue_cents", { ascending: false })
        .limit(15),
      admin
        .from("orders")
        .select("customer_id, total_cents")
        .eq("business_id", business.id)
        .eq("payment_status", "paid")
        .gte("created_at", since.toISOString()),
      admin
        .from("orders")
        .select("customer_id")
        .eq("business_id", business.id)
        .eq("payment_status", "paid"),
    ]);

  const rows = daily ?? [];
  const totalGmv = rows.reduce((sum, r) => sum + Number(r.gmv_cents), 0);
  const totalFee = rows.reduce((sum, r) => sum + Number(r.fee_cents), 0);
  const totalOrders = rows.reduce((sum, r) => sum + Number(r.paid_count), 0);
  const totalCancelled = rows.reduce((sum, r) => sum + Number(r.cancelled_count), 0);
  const pix = rows.reduce((sum, r) => sum + Number(r.pix_count), 0);
  const card = rows.reduce((sum, r) => sum + Number(r.card_count), 0);
  const avgTicket = totalOrders ? Math.round(totalGmv / totalOrders) : 0;
  const liquido = totalGmv - totalFee;

  // novos vs recorrentes
  const allCustomerIds = (customers ?? []).map((o) => o.customer_id).filter((x): x is string => !!x);
  const firstOrderMap = new Map<string, number>();
  for (const cid of allCustomerIds) {
    firstOrderMap.set(cid, (firstOrderMap.get(cid) ?? 0) + 1);
  }
  const customersInRange = new Set(
    (paidOrders ?? []).map((o) => o.customer_id).filter((x): x is string => !!x),
  );
  let newCustomers = 0;
  let returning = 0;
  for (const cid of customersInRange) {
    if ((firstOrderMap.get(cid) ?? 0) === (paidOrders ?? []).filter((o) => o.customer_id === cid).length) {
      newCustomers++;
    } else {
      returning++;
    }
  }

  // série pra chart
  const series = rows.map((r) => ({
    label: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gmv: Number(r.gmv_cents) / 100,
    fee: Number(r.fee_cents) / 100,
    orders: Number(r.paid_count),
  }));

  // hourly
  const hourlyAgg = new Map<number, number>();
  for (const h of dowHour ?? []) {
    hourlyAgg.set(h.hour, (hourlyAgg.get(h.hour) ?? 0) + Number(h.orders_count));
  }
  const hourlyChart = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    orders: hourlyAgg.get(h) ?? 0,
  }));

  // payment split weekly (no period)
  const weeklyMap = new Map<string, { pix: number; card: number; pix_gmv: number; card_gmv: number }>();
  for (const r of rows) {
    const d = new Date(r.day);
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const cur = weeklyMap.get(key) ?? { pix: 0, card: 0, pix_gmv: 0, card_gmv: 0 };
    cur.pix += Number(r.pix_count);
    cur.card += Number(r.card_count);
    weeklyMap.set(key, cur);
  }
  const paymentWeeks = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({
      label: new Date(k).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      pix: v.pix * (avgTicket / 100),
      card: v.card * (avgTicket / 100),
    }));

  const topList = topProducts ?? [];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/parceiro/painel"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Analytics
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              {business.name}
            </h1>
          </div>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <Link
              key={r}
              href={`/parceiro/painel/analytics?range=${r}`}
              className={`rounded-full px-3 py-1 font-semibold ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Vendas brutas" value={formatCents(totalGmv)} />
        <Stat label="Líquido pra você" value={formatCents(liquido)} />
        <Stat label="Pedidos pagos" value={String(totalOrders)} />
        <Stat label="Ticket médio" value={formatCents(avgTicket)} />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Taxa plataforma" value={totalGmv ? `${((totalFee / totalGmv) * 100).toFixed(1)}%` : "—"} />
        <Stat label="Cancelados" value={String(totalCancelled)} />
        <Stat label="Clientes novos" value={String(newCustomers)} />
        <Stat label="Recorrentes" value={String(returning)} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Vendas no período
        </h2>
        <SalesChart data={series} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pedidos por hora (30d)
          </h2>
          <HourlyChart data={hourlyChart} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pagamento (PIX × Cartão)
          </h2>
          <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">PIX</p>
              <p className="text-lg font-bold">{pix} pedidos</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cartão</p>
              <p className="text-lg font-bold">{card} pedidos</p>
            </div>
          </div>
          {paymentWeeks.length > 0 ? (
            <PaymentSplitChart data={paymentWeeks} />
          ) : (
            <p className="text-xs text-muted-foreground">Sem pedidos pagos ainda.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Heatmap — quando seu cliente pede (30d)
        </h2>
        <HeatmapDowHour data={(dowHour ?? []).map((c) => ({ dow: c.dow, hour: c.hour, orders: Number(c.orders_count) }))} />
        <p className="mt-2 text-[10px] text-muted-foreground">
          Cor mais escura = mais pedidos. Use pra decidir horários abertos e promoções.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Top 15 produtos (lifetime)
        </h2>
        {topList.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem vendas suficientes pra ranquear.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {topList.map((p, i) => {
              const maxRev = Math.max(...topList.map((x) => Number(x.revenue_cents)));
              const pct = (Number(p.revenue_cents) / maxRev) * 100;
              return (
                <li key={p.service_id} className="grid grid-cols-[20px,1fr,auto] items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs">
                    {p.qty_total}× · {formatCents(Number(p.revenue_cents))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

