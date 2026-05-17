import Link from "next/link";
import {
  BadgeCheck,
  BadgePercent,
  Banknote,
  Bike,
  Clock,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuperAdminHome() {
  const supabase = await getServerClient();

  const [
    { count: lojas },
    { count: lojasPendentes },
    { count: motoboysCandidatos },
    { count: leadsPendentes },
    { count: pedidosHoje },
    { count: saques },
    { data: settings },
    { data: gmvRow },
  ] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .not("cnh_number", "is", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("contacted", false),
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

  const aprovacoesNeeded =
    (lojasPendentes ?? 0) + (motoboysCandidatos ?? 0) + (saques ?? 0) + (leadsPendentes ?? 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Agência F3X
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Operação Noronha</h1>
      </header>

      {aprovacoesNeeded > 0 && (
        <section className="rounded-2xl border-2 border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-bold">
            <Clock className="h-4 w-4 text-[color:var(--sun)]" />
            {aprovacoesNeeded} ite{aprovacoesNeeded === 1 ? "m" : "ns"} aguardando aprovação
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(leadsPendentes ?? 0) > 0 && (
              <Link
                href="/super-admin/leads?filter=pendentes"
                className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Store className="h-3.5 w-3.5 text-[color:var(--sun)]" />
                {leadsPendentes} solicitaç{(leadsPendentes ?? 0) > 1 ? "ões" : "ão"} de
                credenciamento
              </Link>
            )}
            {(lojasPendentes ?? 0) > 0 && (
              <Link
                href="/super-admin/lojas?filter=pendentes"
                className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Store className="h-3.5 w-3.5 text-[color:var(--sun)]" />
                {lojasPendentes} loja{(lojasPendentes ?? 0) > 1 ? "s" : ""} pendente
                {(lojasPendentes ?? 0) > 1 ? "s" : ""}
              </Link>
            )}
            {(motoboysCandidatos ?? 0) > 0 && (
              <Link
                href="/super-admin/entregadores?filter=candidatos"
                className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Bike className="h-3.5 w-3.5 text-[color:var(--sun)]" />
                {motoboysCandidatos} motoboy{(motoboysCandidatos ?? 0) > 1 ? "s" : ""} pra aprovar
              </Link>
            )}
            {(saques ?? 0) > 0 && (
              <Link
                href="/super-admin/saques"
                className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Banknote className="h-3.5 w-3.5 text-[color:var(--sun)]" />
                {saques} saque{(saques ?? 0) > 1 ? "s" : ""} pendente
                {(saques ?? 0) > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardLink href="/super-admin/lojas" title="Lojas" value={String(lojas ?? 0)} sub="ativas + inativas" icon={Store} />
        <CardLink href="/super-admin/entregadores" title="Entregadores" value={`+${motoboysCandidatos ?? 0}`} sub="candidatos hoje" icon={Bike} />
        <Card title="Pedidos hoje" value={String(pedidosHoje ?? 0)} sub="todas as lojas" icon={Banknote} />
        <CardLink href="/super-admin/saques" title="Saques pendentes" value={String(saques ?? 0)} sub="aguardando aprovação" icon={Users} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CardLink
          href="/super-admin/taxas"
          title="Take rate padrão"
          value={`${((settings?.default_take_rate_bps ?? 1000) / 100).toFixed(1)}%`}
          sub={`D+${settings?.d_plus_days ?? 8} pra liberar saldo · campanhas`}
          icon={BadgePercent}
        />
        <CardLink href="/super-admin/cupons" title="Cupons" value="Gerir" sub="Criar / pausar / excluir" icon={Ticket} />
        <Card title="GMV 30 dias" value={formatCents(gmv30)} sub={`Receita F3X ${formatCents(fee30)}`} icon={BadgeCheck} />
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

function CardLink({
  href,
  title,
  value,
  sub,
  icon: Icon,
}: {
  href: string;
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.18em]">{title}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
