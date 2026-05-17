import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Bike, Inbox, XCircle, Zap } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const SLA_TARGET_MINUTES = 60;

export default async function OperacaoPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/operacao");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: deliveredOrders }, { count: openOrders }, { count: cancelledLast30 }, { count: totalLast30 }, { data: activeDrivers }, { data: stuckOrders }] =
    await Promise.all([
      admin
        .from("orders")
        .select("id, placed_at, delivered_at, business_id")
        .not("delivered_at", "is", null)
        .gte("created_at", thirtyDaysAgo)
        .limit(2000),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "confirmed", "preparing", "ready", "in_transit"]),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "cancelled")
        .gte("created_at", thirtyDaysAgo),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      admin
        .from("profiles")
        .select("id, full_name, last_seen_at, is_online")
        .eq("role", "driver")
        .eq("is_online", true),
      admin
        .from("orders")
        .select("id, code, status, created_at, business_id, total_cents")
        .in("status", ["pending", "confirmed", "preparing", "ready"])
        .lt("created_at", new Date(Date.now() - 2 * 3600 * 1000).toISOString())
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

  const durations = (deliveredOrders ?? [])
    .filter((o) => o.placed_at && o.delivered_at)
    .map((o) => {
      const start = new Date(o.placed_at!).getTime();
      const end = new Date(o.delivered_at!).getTime();
      return Math.round((end - start) / 60000);
    });

  const avgMinutes = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const sortedDur = [...durations].sort((a, b) => a - b);
  const p50 = sortedDur.length ? sortedDur[Math.floor(sortedDur.length * 0.5)] : 0;
  const p90 = sortedDur.length ? sortedDur[Math.floor(sortedDur.length * 0.9)] : 0;
  const onTime = durations.filter((d) => d <= SLA_TARGET_MINUTES).length;
  const onTimeRate = durations.length ? (onTime / durations.length) * 100 : 0;
  const cancelRate = totalLast30 && totalLast30 > 0 ? ((cancelledLast30 ?? 0) / totalLast30) * 100 : 0;

  const businessIds = (stuckOrders ?? [])
    .map((o) => o.business_id)
    .filter((x): x is string => Boolean(x));
  const { data: bizMap } = businessIds.length
    ? await admin.from("businesses").select("id, name").in("id", businessIds)
    : { data: [] };
  const bizLookup = new Map((bizMap ?? []).map((b) => [b.id, b.name]));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Operação</h1>
        <p className="text-xs text-muted-foreground">
          SLAs de entrega · pedidos parados · motoboys online · taxa de cancelamento (30d)
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={Clock}
          label="Tempo médio entrega"
          value={`${avgMinutes} min`}
          tone={avgMinutes > SLA_TARGET_MINUTES ? "destructive" : "turtle"}
        />
        <KpiCard
          icon={Zap}
          label={`% no prazo (≤${SLA_TARGET_MINUTES}min)`}
          value={`${onTimeRate.toFixed(0)}%`}
          tone={onTimeRate < 70 ? "destructive" : "turtle"}
        />
        <KpiCard
          icon={Bike}
          label="Motoboys online agora"
          value={String(activeDrivers?.length ?? 0)}
          tone="primary"
        />
        <KpiCard
          icon={XCircle}
          label="Taxa cancelamento (30d)"
          value={`${cancelRate.toFixed(1)}%`}
          tone={cancelRate > 5 ? "destructive" : "muted"}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="P50 entrega" value={`${p50} min`} />
        <Stat label="P90 entrega" value={`${p90} min`} />
        <Stat label="Pedidos abertos" value={String(openOrders ?? 0)} />
        <Stat label="Cancelados (30d)" value={String(cancelledLast30 ?? 0)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Inbox className="h-3.5 w-3.5" /> Pedidos parados há mais de 2h
          </h2>
          {(stuckOrders ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nada parado. Op limpa.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {(stuckOrders ?? []).map((o) => {
                const hours = Math.round((Date.now() - new Date(o.created_at).getTime()) / 3600000);
                return (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/super-admin/pedidos`}
                      className="truncate font-semibold text-destructive hover:underline"
                    >
                      #{o.code} · {bizLookup.get(o.business_id ?? "") ?? "—"}
                    </Link>
                    <span className="shrink-0 font-mono text-[10px]">
                      {o.status} · {hours}h · {formatCents(o.total_cents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Bike className="h-3.5 w-3.5" /> Motoboys online agora
          </h2>
          {(activeDrivers ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum motoboy online.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {(activeDrivers ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{d.full_name ?? d.id.slice(0, 8)}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {d.last_seen_at
                      ? `visto ${new Date(d.last_seen_at).toLocaleTimeString("pt-BR")}`
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
  tone: "primary" | "turtle" | "destructive" | "muted";
}) {
  const toneClass = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    turtle: "border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 text-[color:var(--turtle)]",
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
