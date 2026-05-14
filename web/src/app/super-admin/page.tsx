import { BadgePercent, Banknote, Store, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuperAdminHome() {
  const supabase = await getServerClient();

  const [
    { count: lojas },
    { count: pedidosHoje },
    { count: saques },
    { data: settings },
    { data: gmvRow },
  ] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "requested"),
    supabase.from("platform_settings").select("default_take_rate_bps, d_plus_days").eq("id", 1).maybeSingle(),
    supabase
      .from("orders")
      .select("total_cents, platform_fee_cents")
      .eq("payment_status", "paid")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
  ]);

  const gmv30 = (gmvRow ?? []).reduce((acc, o) => acc + (o.total_cents ?? 0), 0);
  const fee30 = (gmvRow ?? []).reduce((acc, o) => acc + (o.platform_fee_cents ?? 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Agência F3X
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Operação Noronha</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Lojas" value={String(lojas ?? 0)} sub="ativas + inativas" icon={Store} />
        <Card title="Pedidos hoje" value={String(pedidosHoje ?? 0)} sub="todas as lojas" icon={Banknote} />
        <Card title="Saques pendentes" value={String(saques ?? 0)} sub="aguardando aprovação" icon={Users} />
        <Card title="Take rate" value={`${((settings?.default_take_rate_bps ?? 1000) / 100).toFixed(1)}%`} sub={`D+${settings?.d_plus_days ?? 8}`} icon={BadgePercent} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card title="GMV 30 dias" value={formatCents(gmv30)} sub="pedidos pagos" icon={Banknote} />
        <Card title="Receita F3X 30 dias" value={formatCents(fee30)} sub="taxa recolhida" icon={BadgePercent} />
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.18em]">{title}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
