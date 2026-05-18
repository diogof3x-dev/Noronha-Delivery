import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, Clock, Download, TrendingUp } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { SalesChart } from "@/components/parceiro/sales-chart";
import { WithdrawalForm } from "./withdrawal-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Aguardando",
  approved: "Aprovado",
  paid: "Pago",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

const TX_LABEL: Record<string, string> = {
  order_settled: "Pedido liberado",
  withdrawal: "Saque",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

export default async function PainelVendas() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, payout_pix_key, payout_pix_kind")
    .eq("owner_id", user.id);

  if (!businesses?.length) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Cadastre uma loja em <Link href="/parceiro/painel/loja" className="text-primary underline">Minha loja</Link> primeiro.
      </div>
    );
  }

  const business = businesses[0];
  const admin = getAdminClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const thirtyDayISO = thirtyDaysAgo.toISOString().slice(0, 10);

  const [
    { data: account },
    pendingBalanceRes,
    { data: transactions },
    { data: withdrawals },
    { data: daily30 },
  ] = await Promise.all([
    supabase
      .from("wallet_accounts")
      .select("id, balance_cents")
      .eq("business_id", business.id)
      .maybeSingle(),
    admin
      ? admin.rpc("business_pending_balance", { p_business_id: business.id })
      : Promise.resolve({ data: 0 }),
    admin
      ? admin
          .from("wallet_transactions")
          .select(
            "id, type, amount_cents, balance_after_cents, order_id, withdrawal_id, description, created_at, account_id",
          )
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    supabase
      .from("withdrawal_requests")
      .select("id, amount_cents, status, created_at, paid_at, rejection_reason, pix_key, pix_kind")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      ? admin
          .from("mv_business_daily")
          .select("day, gmv_cents, fee_cents, paid_count")
          .eq("business_id", business.id)
          .gte("day", thirtyDayISO)
          .order("day", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const accountId = account?.id ?? null;
  const balance = account?.balance_cents ?? 0;
  const pendingBalance = Number(pendingBalanceRes?.data ?? 0);

  const filteredTxs =
    accountId && transactions
      ? transactions.filter((t) => t.account_id === accountId).slice(0, 30)
      : [];

  const totalGmv30d = (daily30 ?? []).reduce((sum, r) => sum + Number(r.gmv_cents), 0);
  const totalFee30d = (daily30 ?? []).reduce((sum, r) => sum + Number(r.fee_cents), 0);
  const liquido30d = totalGmv30d - totalFee30d;

  const series = (daily30 ?? []).map((r) => ({
    label: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gmv: Number(r.gmv_cents) / 100,
    fee: Number(r.fee_cents) / 100,
    orders: Number(r.paid_count),
  }));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Vendas
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Financeiro · {business.name}
          </h1>
        </div>
        <a
          href={`/api/parceiro/extrato.csv?business_id=${business.id}`}
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
          sub="pronto pra saque"
          icon={Banknote}
          tone="turtle"
        />
        <KpiCard
          title="A liberar (D+8)"
          value={formatCents(pendingBalance)}
          sub="pedidos D+1 a D+7"
          icon={Clock}
          tone="sun"
        />
        <KpiCard
          title="Vendas 30d (líquido)"
          value={formatCents(liquido30d)}
          sub={`bruto ${formatCents(totalGmv30d)} · fee ${formatCents(totalFee30d)}`}
          icon={TrendingUp}
          tone="primary"
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Cash flow (30d)
        </h2>
        <SalesChart data={series} compact />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Solicitar saque
        </h2>
        {!business.payout_pix_key ? (
          <div className="mt-3 rounded-xl border border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-3 text-sm">
            <p>
              Cadastre sua chave PIX em{" "}
              <Link
                href="/parceiro/painel/loja"
                className="font-semibold text-primary hover:underline"
              >
                Minha loja
              </Link>{" "}
              antes de solicitar saque.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              PIX cadastrado: <strong>{business.payout_pix_kind?.toUpperCase()}</strong> ·{" "}
              {business.payout_pix_key.slice(0, 6)}…
            </p>
            <div className="mt-4">
              <WithdrawalForm
                businessId={business.id}
                balanceCents={balance}
                hasPendingRequest={(withdrawals ?? []).some((w) => w.status === "requested")}
              />
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
          Extrato detalhado
        </h2>
        {!filteredTxs.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem movimentação na carteira ainda. Os créditos chegam quando pedidos forem
            liberados (D+8).
          </p>
        ) : (
          <ul className="space-y-1">
            {filteredTxs.map((t) => (
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
        <p className="font-semibold text-foreground">Como funciona o repasse</p>
        <p className="mt-1">
          Cada pedido entregue libera o valor (descontada taxa de serviço e take rate) na
          sua carteira em <strong>D+8</strong> automaticamente, pelo cron diário das 03h
          (janela legal pra estornos). Você pode solicitar saque PIX a qualquer momento do
          saldo disponível. Pagamento via Mercado Pago em até 1 dia útil. Sem taxa de saque.
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
