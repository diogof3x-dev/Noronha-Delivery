import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getMerchantScope } from "@/lib/merchant-scope";
import { ReplyForm } from "./reply-form";

export const dynamic = "force-dynamic";

type Filter = "todas" | "1-2" | "3" | "4-5" | "sem-resposta";

export default async function PainelAvaliacoes({
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
  if (!user) redirect("/parceiro/entrar");

  const profile = await getProfile(user);
  const scope = await getMerchantScope(supabase, user.id, profile);
  const isAdmin = scope.showAll;

  let bizQuery = supabase.from("businesses").select("id, name");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;

  const ids = (businesses ?? []).map((b) => b.id);

  let ratingsQuery = supabase
    .from("ratings")
    .select(
      "id, stars, comment, tags, reply, reply_at, created_at, business_id, businesses(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (ids.length) ratingsQuery = ratingsQuery.in("business_id", ids);

  if (filter === "1-2") ratingsQuery = ratingsQuery.lte("stars", 2);
  else if (filter === "3") ratingsQuery = ratingsQuery.eq("stars", 3);
  else if (filter === "4-5") ratingsQuery = ratingsQuery.gte("stars", 4);
  else if (filter === "sem-resposta") ratingsQuery = ratingsQuery.is("reply", null);

  const { data: ratings } = await ratingsQuery;

  const { data: allRatings } = ids.length
    ? await supabase.from("ratings").select("stars").in("business_id", ids)
    : { data: [] };
  const counts = new Map<number, number>();
  for (const r of allRatings ?? []) counts.set(r.stars, (counts.get(r.stars) ?? 0) + 1);
  const totalRated = (allRatings ?? []).length;
  const avgStars = totalRated
    ? (allRatings ?? []).reduce((s, r) => s + r.stars, 0) / totalRated
    : 0;
  const { count: replyMissingCount } = ids.length
    ? await supabase
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .in("business_id", ids)
        .is("reply", null)
        .lte("stars", 3)
    : { count: 0 };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Avaliações
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {isAdmin ? "Todas as avaliações" : "Suas avaliações"}
        </h1>
      </header>

      {totalRated === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--sun)]/15 text-[color:var(--sun)]">
            <Star className="h-6 w-6 fill-current" />
          </span>
          <h2 className="text-lg font-semibold">Sem avaliações ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Quando o primeiro cliente avaliar um pedido, vai aparecer aqui.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-[200px,1fr]">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Média
              </p>
              <p className="mt-2 text-4xl font-bold leading-none">{avgStars.toFixed(1)}</p>
              <div className="mt-2 inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= Math.round(avgStars)
                        ? "fill-[color:var(--sun)] text-[color:var(--sun)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {totalRated} avaliaç{totalRated === 1 ? "ão" : "ões"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Distribuição
              </p>
              <ul className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const c = counts.get(s) ?? 0;
                  const pct = totalRated ? (c / totalRated) * 100 : 0;
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
            </div>
          </section>

          {(replyMissingCount ?? 0) > 0 && (
            <Link
              href="/parceiro/painel/avaliacoes?filter=sem-resposta"
              className="flex items-center gap-3 rounded-2xl border border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-3"
            >
              <MessageSquare className="h-4 w-4 text-[color:var(--sun)]" />
              <p className="flex-1 text-sm">
                <strong>{replyMissingCount}</strong> avaliações de 3★ ou menos sem
                resposta — responder ajuda a virar a percepção.
              </p>
              <span className="text-xs font-bold text-[color:var(--sun)]">
                Responder →
              </span>
            </Link>
          )}

          <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 text-xs">
            {(
              [
                ["todas", "Todas"],
                ["4-5", "4-5★"],
                ["3", "3★"],
                ["1-2", "1-2★"],
                ["sem-resposta", "Sem resposta"],
              ] as const
            ).map(([f, label]) => (
              <Link
                key={f}
                href={`/parceiro/painel/avaliacoes?filter=${f}`}
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

          {!ratings?.length ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhuma avaliação no filtro selecionado.
            </p>
          ) : (
            <ul className="space-y-3">
              {ratings.map((r) => {
                const bizName = (r.businesses as { name?: string } | null)?.name ?? "—";
                return (
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
                        {bizName} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
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

                    {r.reply ? (
                      <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs">
                        <p className="font-semibold text-primary">
                          Resposta · {r.reply_at && new Date(r.reply_at).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="mt-1 text-foreground">{r.reply}</p>
                      </div>
                    ) : (
                      !isAdmin && <ReplyForm ratingId={r.id} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
