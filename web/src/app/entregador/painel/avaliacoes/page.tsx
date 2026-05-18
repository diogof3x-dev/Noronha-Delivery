import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Star, ThumbsUp } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

type Filter = "todas" | "5" | "4" | "3" | "1-2";

export default async function EntregadorAvaliacoes({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = (params.filter as Filter) ?? "todas";

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  // todas as ratings do motoboy (pra distribuição + tags)
  const { data: allRatings } = await supabase
    .from("ratings")
    .select("stars, tags")
    .eq("rated_entity", "driver")
    .eq("rated_entity_id", user.id);

  // ratings filtradas + comentário (pra lista)
  let q = supabase
    .from("ratings")
    .select("id, stars, comment, tags, created_at")
    .eq("rated_entity", "driver")
    .eq("rated_entity_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter === "5") q = q.eq("stars", 5);
  else if (filter === "4") q = q.eq("stars", 4);
  else if (filter === "3") q = q.eq("stars", 3);
  else if (filter === "1-2") q = q.lte("stars", 2);
  const { data: ratings } = await q;

  const total = (allRatings ?? []).length;
  const sum = (allRatings ?? []).reduce((s, r) => s + r.stars, 0);
  const avg = total ? sum / total : 0;

  // distribuição 1-5
  const dist = new Map<number, number>();
  for (const r of allRatings ?? []) dist.set(r.stars, (dist.get(r.stars) ?? 0) + 1);

  // tags ranking
  const tagCount = new Map<string, number>();
  for (const r of allRatings ?? []) {
    for (const t of (r.tags as string[] | null) ?? []) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCount.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxTagCount = topTags[0]?.[1] ?? 0;

  // ranking interno (Bronze/Prata/Ouro/Diamante)
  const tier =
    avg >= 4.8 && total >= 50
      ? { name: "Diamante", color: "var(--turtle)", desc: "Top motoboy da plataforma" }
      : avg >= 4.6 && total >= 25
        ? { name: "Ouro", color: "var(--sun)", desc: "Cliente adora você" }
        : avg >= 4.2 && total >= 10
          ? { name: "Prata", color: "#94A3B8", desc: "Performance acima da média" }
          : { name: "Bronze", color: "#D97706", desc: "Construindo reputação" };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Avaliações
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          O que os clientes dizem
        </h1>
      </header>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--sun)]/15 text-[color:var(--sun)]">
            <Star className="h-6 w-6 fill-current" />
          </span>
          <h2 className="text-lg font-semibold">Sem avaliações ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Cada cliente avalia a entrega (pontualidade, educação, conhecimento da ilha).
            Notas altas te sobem no ranking de prioridade pra próximos pedidos.
          </p>
        </div>
      ) : (
        <>
          {/* Header: média + tier */}
          <section className="grid gap-4 md:grid-cols-[200px,1fr]">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Sua média
              </p>
              <p className="mt-2 text-5xl font-bold leading-none">{avg.toFixed(1)}</p>
              <div className="mt-2 inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= Math.round(avg)
                        ? "fill-[color:var(--sun)] text-[color:var(--sun)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {total} avaliaç{total === 1 ? "ão" : "ões"}
              </p>
            </div>

            <div
              className="rounded-2xl border-2 p-4"
              style={{ borderColor: `${tier.color}66`, background: `${tier.color}0F` }}
            >
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Award className="h-3.5 w-3.5" />
                Seu status
              </p>
              <p
                className="mt-1 text-2xl font-bold tracking-tight"
                style={{ color: tier.color }}
              >
                {tier.name}
              </p>
              <p className="text-xs text-muted-foreground">{tier.desc}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Como subir
              </p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                <li>• 4.2★+ com 10 entregas → Prata</li>
                <li>• 4.6★+ com 25 entregas → Ouro</li>
                <li>• 4.8★+ com 50 entregas → Diamante (prioridade nas corridas)</li>
              </ul>
            </div>
          </section>

          {/* Distribuição */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Distribuição de notas
            </h2>
            <ul className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => {
                const c = dist.get(s) ?? 0;
                const pct = total ? (c / total) * 100 : 0;
                return (
                  <li
                    key={s}
                    className="grid grid-cols-[40px,1fr,60px] items-center gap-3 text-xs"
                  >
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
                      {c} ({pct.toFixed(0)}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Tags mais citadas */}
          {topTags.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <ThumbsUp className="h-3.5 w-3.5" />
                O que clientes mais citam
              </h2>
              <ul className="space-y-1.5">
                {topTags.map(([tag, count]) => {
                  const pct = maxTagCount ? (count / maxTagCount) * 100 : 0;
                  return (
                    <li
                      key={tag}
                      className="grid grid-cols-[1fr,60px,40px] items-center gap-3 text-xs"
                    >
                      <span className="truncate font-semibold">{tag}</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-right text-muted-foreground">{count}×</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Filtros */}
          <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 text-xs">
            {(
              [
                ["todas", "Todas"],
                ["5", "5★"],
                ["4", "4★"],
                ["3", "3★"],
                ["1-2", "1-2★"],
              ] as const
            ).map(([f, label]) => (
              <Link
                key={f}
                href={`/entregador/painel/avaliacoes?filter=${f}`}
                className={`rounded-full px-3 py-1 font-semibold ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Lista */}
          {!ratings?.length ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhuma avaliação no filtro selecionado.
            </p>
          ) : (
            <ul className="space-y-3">
              {ratings.map((r) => (
                <li
                  key={r.id}
                  className={`rounded-2xl border bg-card p-4 ${
                    r.stars <= 2 ? "border-destructive/30" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-sm font-bold">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= r.stars
                              ? "fill-[color:var(--sun)] text-[color:var(--sun)]"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                      <span className="ml-1">{r.stars}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {r.tags && r.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.tags.map((t: string) => (
                        <span
                          key={t}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
