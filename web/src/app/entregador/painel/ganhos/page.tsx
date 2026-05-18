import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, Clock, Download, TrendingUp } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { SalesChart } from "@/components/parceiro/sales-chart";
import { DriverWithdrawalForm } from "./withdrawal-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Aguardando",
  approved: "Aprovado",
  paid: "Pago",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

const TX_LABEL: Record<string, string> = {
  order_settled: "Entrega liberada",
  withdrawal: "Saque",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

export default async function EntregadorGanhos() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pix_value, pix_kind")
    .eq("id", user.id)
    .maybeSingle();

  const admin = getAdminClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const thirtyDayISO = thirtyDaysAgo.toISOString().slice(0, 10);

  const [
    { data: account },
    pendingBalanceRes,
    { data: deliveredToday },
    { data: delivered30d },
    { data: withdrawals },
    { data: daily30 },
  ] = await Promise.all([
    supabase
      .from("wallet_accounts")
      .select("id, balance_cents")
      .eq("owner_id", user.id)
      .is("business_id", null)
      .maybeSingle(),
    admin
      ? admin.rpc("driver_pending_balance", { p_driver_id: user.id })
      : Promise.resolve({ data: 0 }),
    supabase
      .from("orders")
      .select("delivery_fee_cents")
      .eq("driver_id", user.id)
      .in("status", ["delivered", "completed"])
      .gte("delivered_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("delivery_fee_cents")
      .eq("driver_id", user.id)
      .in("status", ["delivered", "completed"])
      .gte("delivered_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("withdrawal_requests")
      .select("id, amount_cents, status, created_at, paid_at, rejection_reason")
      .eq("requested_by", user.id)
      .is("business_id", null)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      ? admin
          .from("mv_driver_daily")
          .select("day, deliveries_count, earnings_cents")
          .eq("driver_id", user.id)
          .gte("day", thirtyDayISO)
          .order("day", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const balance = account?.balance_cents ?? 0;
  const pendingBalance = Number(pendingBalanceRes?.data ?? 0);
  const todayCount = (deliveredToday ?? []).length;
  const todayEarnings = (deliveredToday ?? []).reduce(
    (s, o) => s + (o.delivery_fee_cents ?? 0),
    0,
  );
  const monthCount = (delivered30d ?? []).length;
  const monthEarnings = (delivered30d ?? []).reduce(
    (s, o) => s + (o.delivery_fee_cents ?? 0),
    0,
  );
  const avgPerDelivery = monthCount > 0 ? Math.round(monthEarnings / monthCount) : 0;

  const series = (daily30 ?? []).map((r) => ({
    label: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gmv: Number(r.earnings_cents) / 100,
    fee: 0,
    orders: Number(r.deliveries_count),
  }));

  const hasPix = !!(profile?.pix_value && profile?.pix_kind);
  const hasPending = (withdrawals ?? []).some((w) => w.status === "requested");

  const { data: transactions } = account?.id && admin
    ? await admin
        .from("wallet_transactions")
        .select(
          "id, type, amount_cents, balance_after_cents, order_id, withdrawal_id, description, created_at",
        )
        .eq("account_id", account.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ganhos
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Sua carteira
          </h1>
        </div>
        <a
          href="/api/entregador/extrato.csv"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </a>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <KpiCard
          title="Saldo disponível"
          value={formatCents(balance)}
          sub="pronto pra saque PIX"
          icon={Banknote}
          tone="turtle"
        />
        <KpiCard
          title="A liberar"
          value={formatCents(pendingBalance)}
          sub="entregas dos últimos 8 dias"
          icon={Clock}
          tone="sun"
        />
        <KpiCard
          title="Ganho 30d"
          value={formatCents(monthEarnings)}
          sub={`${monthCount} entrega${monthCount === 1 ? "" : "s"} · média ${formatCents(avgPerDelivery)}`}
          icon={TrendingUp}
          tone="primary"
        />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Hoje" value={formatCents(todayEarnings)} sub={`${todayCount} entrega${todayCount === 1 ? "" : "s"}`} />
        <Stat
          label="Média por entrega"
          value={avgPerDelivery > 0 ? formatCents(avgPerDelivery) : "—"}
          sub="últimos 30d"
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ganhos diários (30d)
        </h2>
        <SalesChart data={series} compact />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Solicitar saque
        </h2>
        {!hasPix ? (
          <div className="mt-3 rounded-xl border border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-3 text-sm">
            <p>
              Cadastre sua chave PIX em{" "}
              <Link
                href="/entregador/painel/cadastro"
                className="font-semibold text-primary hover:underline"
              >
                Meu cadastro
              </Link>{" "}
              antes de solicitar saque.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              PIX cadastrado: <strong>{profile?.pix_kind?.toUpperCase()}</strong> ·{" "}
              {profile?.pix_value?.slice(0, 6)}…
            </p>
            <div className="mt-4">
              <DriverWithdrawalForm balanceCents={balance} hasPendingRequest={hasPending} />
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Histórico de saques
        </h2>
        {!withdrawals?.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem solicitações ainda.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {withdrawals.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm"
              >
                <div>
                  <p className="font-bold">{formatCents(w.amount_cents)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(w.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      w.status === "paid"
                        ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                        : w.status === "requested"
                          ? "bg-[color:var(--sun)]/15 text-[color:var(--sun)]"
                          : w.status === "rejected"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[w.status] ?? w.status}
                  </span>
                  {w.paid_at && (
                    <p className="text-[10px] text-muted-foreground">
                      pago em {new Date(w.paid_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {w.rejection_reason && (
                    <p className="text-[10px] text-destructive">{w.rejection_reason}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Extrato
        </h2>
        {!transactions?.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem movimentação ainda. Cada entrega concluída entra automaticamente
            como crédito após D+8.
          </p>
        ) : (
          <ul className="space-y-1">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {TX_LABEL[t.type] ?? t.type}
                    {t.description ? ` · ${t.description}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono font-bold ${
                      t.amount_cents > 0
                        ? "text-[color:var(--turtle)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {t.amount_cents > 0 ? "+" : ""}
                    {formatCents(t.amount_cents)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    saldo {formatCents(t.balance_after_cents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Como funciona</p>
        <p className="mt-1">
          Cada entrega concluída credita sua taxa de entrega na carteira em até{" "}
          <strong>1 dia útil</strong> após a confirmação do cliente. Você pode sacar PIX
          a qualquer momento sem taxa.
        </p>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "turtle" | "sun";
}) {
  const toneClass = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    turtle:
      "border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 text-[color:var(--turtle)]",
    sun: "border-[color:var(--sun)]/30 bg-[color:var(--sun)]/5 text-[color:var(--sun)]",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold uppercase tracking-[0.18em]">{title}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
