import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, MessageSquare, AlertTriangle } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function QualidadePage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/qualidade");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

  const [{ data: distRaw }, { data: ratings }, { data: lowBiz }] = await Promise.all([
    admin.from("ratings").select("stars").gte("created_at", ninetyDaysAgo),
    admin
      .from("ratings")
      .select("id, stars, comment, created_at, rated_entity, rated_entity_id, business_id, order_id")
      .lte("stars", 3)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("business_scores")
      .select("business_id, avg_stars, total_reviews")
      .gte("total_reviews", 3)
      .lt("avg_stars", 3.5)
      .order("avg_stars", { ascending: true }),
  ]);

  const counts = new Map<number, number>();
  for (const r of distRaw ?? []) counts.set(r.stars, (counts.get(r.stars) ?? 0) + 1);
  const distribution = [1, 2, 3, 4, 5].map((s) => ({ stars: s, count: counts.get(s) ?? 0 }));
  const totalReviews = distribution.reduce((acc, d) => acc + d.count, 0);

  const businessIds = (lowBiz ?? [])
    .map((b) => b.business_id)
    .filter((x): x is string => Boolean(x));
  const { data: lowBizDetails } = businessIds.length
    ? await admin
        .from("businesses")
        .select("id, name, slug, type, is_active")
        .in("id", businessIds)
    : { data: [] };
  const lowBizMap = new Map((lowBizDetails ?? []).map((b) => [b.id, b]));

  const orderIds = (ratings ?? [])
    .map((r) => r.order_id)
    .filter((x): x is string => Boolean(x));
  const { data: orderRows } = orderIds.length
    ? await admin.from("orders").select("id, code, business_id").in("id", orderIds)
    : { data: [] };
  const orderMap = new Map((orderRows ?? []).map((o) => [o.id, o]));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Qualidade</h1>
        <p className="text-xs text-muted-foreground">
          Distribuição de notas, comentários ≤ 3★ e lojas com média baixa
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Star className="h-3.5 w-3.5" /> Distribuição (90d · {totalReviews} avaliações)
        </h2>
        <ul className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((s) => {
            const row = distribution.find((d) => d.stars === s) ?? { stars: s, count: 0 };
            const pct = totalReviews ? (row.count / totalReviews) * 100 : 0;
            return (
              <li key={s} className="grid grid-cols-[40px,1fr,80px] items-center gap-3 text-xs">
                <span className="flex items-center gap-0.5 font-semibold">
                  {s}
                  <Star className="h-3 w-3 fill-[color:var(--sun)] text-[color:var(--sun)]" />
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${
                      s >= 4
                        ? "bg-[color:var(--turtle)]"
                        : s >= 3
                          ? "bg-[color:var(--sun)]"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right text-muted-foreground">
                  {row.count} ({pct.toFixed(0)}%)
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" /> Lojas com média baixa (≥3 reviews)
          </h2>
          <ul className="space-y-1.5 text-sm">
            {(lowBiz ?? []).map((b) => {
              const biz = b.business_id ? lowBizMap.get(b.business_id) : null;
              return (
                <li key={b.business_id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/super-admin/lojas/${b.business_id}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {biz?.name ?? b.business_id?.slice(0, 8)}
                  </Link>
                  <span className="shrink-0 font-mono text-xs">
                    {b.avg_stars?.toFixed(2)}★ · {b.total_reviews} reviews
                  </span>
                </li>
              );
            })}
            {(lowBiz ?? []).length === 0 && (
              <li className="text-xs text-muted-foreground">
                Tudo certo — nenhuma loja abaixo de 3.5★.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Comentários ≤ 3★ (últimos 50)
          </h2>
          <ul className="space-y-2 text-xs">
            {(ratings ?? []).map((r) => {
              const o = r.order_id ? orderMap.get(r.order_id) : null;
              return (
                <li key={r.id} className="rounded-lg border border-border bg-background p-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-destructive">
                      {r.stars}
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3">{r.comment}</p>
                  {o && (
                    <Link
                      href={`/app/pedidos/${o.id}`}
                      className="mt-1 inline-block text-[10px] text-primary hover:underline"
                    >
                      pedido #{o.code} →
                    </Link>
                  )}
                </li>
              );
            })}
            {(ratings ?? []).length === 0 && (
              <li className="text-muted-foreground">Sem comentários ruins.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
