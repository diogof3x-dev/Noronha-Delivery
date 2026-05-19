import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  Check,
  ChevronRight,
  Clock,
  ListChecks,
  Megaphone,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { ShareLinkPanel } from "./share-link";
import { HealthRing } from "@/components/parceiro/health-ring";
import { SalesChart } from "@/components/parceiro/sales-chart";
import { HourlyChart } from "@/components/parceiro/hourly-chart";
import { KpiCard, SummaryCard } from "@/components/dashboard/cards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUICK_ACTIONS = [
  { href: "/parceiro/painel/pedidos", label: "Pedidos", icon: ListChecks, tone: "primary" },
  { href: "/parceiro/painel/cardapio", label: "Cardápio", icon: UtensilsCrossed, tone: "turtle" },
  { href: "/parceiro/painel/analytics", label: "Analytics", icon: TrendingUp, tone: "sun" },
  { href: "/parceiro/painel/vendas", label: "Financeiro", icon: Banknote, tone: "primary" },
  { href: "/parceiro/painel/promocoes", label: "Promoções", icon: Megaphone, tone: "sun" },
  { href: "/parceiro/painel/avaliacoes", label: "Avaliações", icon: Star, tone: "turtle" },
];

const DOW_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function ParceiroPainelHome() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, type, is_active, is_verified, district, avg_prep_minutes, delivery_fee_cents, logo_url, cover_url, description, payout_pix_key, opening_hours",
    )
    .eq("owner_id", user.id);

  const business = businesses?.[0];

  if (!business) {
    return (
      <div className="space-y-6 p-4 md:space-y-8 md:p-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Sua loja</h1>
        </header>
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">Nenhuma loja cadastrada ainda</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie sua loja em <strong>Minha loja</strong> pra começar a vender.
          </p>
          <Link
            href="/parceiro/painel/loja"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Criar loja
          </Link>
        </div>
      </div>
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const sevenDayISO = sevenDaysAgo.toISOString().slice(0, 10);
  const thirtyDayISO = thirtyDaysAgo.toISOString().slice(0, 10);

  const admin = getAdminClient();

  const [
    { count: pedidosHoje },
    { data: paid7d },
    { data: scoreRow },
    { data: acc },
    { count: pedidosAbertos },
    { count: cancelled30d },
    { count: total30d },
    { data: daily30d },
    { data: hourly30d },
    { data: topProducts },
    healthBalanceRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("total_cents, platform_fee_cents")
      .eq("business_id", business.id)
      .eq("payment_status", "paid")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("business_scores")
      .select("avg_stars, total_reviews")
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("wallet_accounts")
      .select("balance_cents")
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ["pending", "confirmed", "preparing", "ready", "in_transit"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "cancelled")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    admin
      ? admin
          .from("mv_business_daily")
          .select("day, gmv_cents, fee_cents, paid_count")
          .eq("business_id", business.id)
          .gte("day", thirtyDayISO)
          .order("day", { ascending: true })
      : Promise.resolve({ data: [] as Array<{ day: string; gmv_cents: number; fee_cents: number; paid_count: number }> }),
    admin
      ? admin
          .from("mv_business_dow_hour")
          .select("dow, hour, orders_count")
          .eq("business_id", business.id)
      : Promise.resolve({ data: [] as Array<{ dow: number; hour: number; orders_count: number }> }),
    admin
      ? admin
          .from("mv_business_top_products")
          .select("name, qty_total, revenue_cents")
          .eq("business_id", business.id)
          .order("revenue_cents", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as Array<{ name: string; qty_total: number; revenue_cents: number }> }),
    Promise.all([
      admin ? admin.rpc("business_health_score", { p_business_id: business.id }) : Promise.resolve({ data: null }),
      admin ? admin.rpc("business_pending_balance", { p_business_id: business.id }) : Promise.resolve({ data: 0 }),
    ]),
  ]);

  const receita7d = (paid7d ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
  const fee7d = (paid7d ?? []).reduce((sum, o) => sum + (o.platform_fee_cents ?? 0), 0);
  const liquido7d = receita7d - fee7d;
  const ticketMedio7d = (paid7d ?? []).length
    ? Math.round(receita7d / (paid7d ?? []).length)
    : 0;
  const acceptRate = total30d
    ? (((total30d ?? 0) - (cancelled30d ?? 0)) / (total30d ?? 1)) * 100
    : 100;
  const healthScore = Number(healthBalanceRes[0]?.data ?? 0);
  const pendingBalance = Number(healthBalanceRes[1]?.data ?? 0);
  const saldoCarteira = acc?.balance_cents ?? 0;

  const series = (daily30d ?? []).map((r) => ({
    label: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gmv: Number(r.gmv_cents) / 100,
    fee: Number(r.fee_cents) / 100,
    orders: Number(r.paid_count),
  }));

  // agrega pedidos por hora (24 buckets)
  const hourlyAgg = new Map<number, number>();
  for (const h of hourly30d ?? []) {
    hourlyAgg.set(h.hour, (hourlyAgg.get(h.hour) ?? 0) + Number(h.orders_count));
  }
  const hourlyChart = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    orders: hourlyAgg.get(h) ?? 0,
  }));

  // Onboarding checklist
  const opening = (business.opening_hours as Array<{ day: number; opens: string; closes: string }> | null | undefined) ?? [];
  const checklist = [
    { label: "Logo da loja", done: !!business.logo_url, href: "/parceiro/painel/loja" },
    { label: "Capa da loja", done: !!business.cover_url, href: "/parceiro/painel/loja" },
    {
      label: "Descrição (mín. 30 caracteres)",
      done: !!business.description && business.description.length >= 30,
      href: "/parceiro/painel/loja",
    },
    { label: "Chave PIX cadastrada", done: !!business.payout_pix_key, href: "/parceiro/painel/loja" },
    { label: "Horários definidos", done: opening.length > 0, href: "/parceiro/painel/horarios" },
    { label: "Pelo menos 1 item no cardápio", done: false, href: "/parceiro/painel/cardapio" },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  const topRows = topProducts ?? [];

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Visão geral
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {business.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {business.district} ·{" "}
            {business.is_active ? (
              <span className="inline-flex items-center gap-1 text-[color:var(--turtle)]">
                <BadgeCheck className="h-3.5 w-3.5" /> Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Pausada
              </span>
            )}
          </p>
        </div>
        <HealthRing score={healthScore} />
      </header>

      {business.slug && business.is_verified && business.is_active && (
        <ShareLinkPanel type={business.type} slug={business.slug} name={business.name} />
      )}

      {!business.is_verified && (
        <div className="rounded-2xl border-2 border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-4 text-sm">
          <p className="font-semibold">Loja aguardando aprovação</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Você já pode cadastrar produtos, mas o link público só fica acessível depois
            que a Agência F3X aprovar.
          </p>
        </div>
      )}

      {pedidosAbertos !== null && pedidosAbertos > 0 && (
        <Link
          href="/parceiro/painel/pedidos"
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 hover:bg-primary/10"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ListChecks className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {pedidosAbertos} pedido{pedidosAbertos > 1 ? "s" : ""} em aberto
            </p>
            <p className="text-xs text-muted-foreground">Atenda agora →</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard
          label="Hoje"
          value={String(pedidosHoje ?? 0)}
          sub={`pedido${(pedidosHoje ?? 0) === 1 ? "" : "s"}`}
          icon={ListChecks}
        />
        <KpiCard label="Vendas 7d" value={formatCents(receita7d)} sub={`líquido ${formatCents(liquido7d)}`} icon={TrendingUp} />
        <KpiCard label="Ticket médio" value={formatCents(ticketMedio7d)} sub="últimos 7d" icon={Wallet} />
        <KpiCard label="Aceite 30d" value={`${acceptRate.toFixed(0)}%`} sub={`${cancelled30d ?? 0} cancelados`} icon={Check} />
        <KpiCard
          label="Avaliação"
          value={scoreRow?.avg_stars ? Number(scoreRow.avg_stars).toFixed(1) : "—"}
          sub={
            scoreRow?.total_reviews
              ? `${scoreRow.total_reviews} reviews`
              : "novo na plataforma"
          }
          icon={Star}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vendas (30d)
            </h2>
            <Link href="/parceiro/painel/analytics" className="text-[11px] text-primary hover:underline">
              Ver mais →
            </Link>
          </header>
          <SalesChart data={series} compact />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pedidos por hora (30d)
            </h2>
            <Link href="/parceiro/painel/analytics" className="text-[11px] text-primary hover:underline">
              Heatmap →
            </Link>
          </header>
          <HourlyChart data={hourlyChart} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr,1.2fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Top 5 produtos
          </h2>
          {topRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem vendas suficientes pra ranquear.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topRows.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="mr-2 text-xs font-bold text-muted-foreground">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 text-xs">
                    {p.qty_total}× · {formatCents(Number(p.revenue_cents))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Onboarding ({completion}%)
            </h2>
            {completion < 100 && (
              <span className="text-[11px] text-[color:var(--sun)]">
                Faltam {checklist.length - checklist.filter((c) => c.done).length} item(s)
              </span>
            )}
          </header>
          <ul className="space-y-1.5">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/50 ${
                    c.done ? "text-muted-foreground line-through" : "font-semibold"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        c.done
                          ? "border-[color:var(--turtle)] bg-[color:var(--turtle)] text-white"
                          : "border-border bg-background"
                      }`}
                    >
                      {c.done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {c.label}
                  </span>
                  {!c.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <SummaryCard
          label="Carteira"
          value={formatCents(saldoCarteira)}
          sub="saldo pra saque"
          href="/parceiro/painel/vendas"
          icon={Wallet}
        />
        <SummaryCard
          label="A liberar (D+8)"
          value={formatCents(pendingBalance)}
          sub="pedidos D+1 a D+7"
          href="/parceiro/painel/vendas"
          icon={Clock}
        />
        <SummaryCard
          label="Pedidos 30d"
          value={String(total30d ?? 0)}
          sub={`${cancelled30d ?? 0} cancelados`}
          href="/parceiro/painel/pedidos"
          icon={ListChecks}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ações
        </h2>
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            const toneClass = {
              primary: "bg-primary/10 text-primary",
              turtle: "bg-[color:var(--turtle)]/10 text-[color:var(--turtle)]",
              sun: "bg-[color:var(--sun)]/10 text-[color:var(--sun)]",
            }[a.tone];
            return (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/40"
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold">{a.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Como funciona o saldo</p>
        <p className="mt-1">
          Cada pedido entregue libera o valor (descontada taxa de serviço e take rate) na sua
          carteira em <strong>D+8</strong>. Janela legal pra evitar estornos. Cron diário 03h.
        </p>
      </section>

      <style data-dow-hidden>{DOW_LABEL.join(" ")}</style>
    </div>
  );
}

