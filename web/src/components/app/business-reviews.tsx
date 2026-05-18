import { Star } from "lucide-react";
import { getPublicClient } from "@/lib/supabase/public-client";
import { getAdminClient } from "@/lib/supabase/admin-client";

type Review = {
  id: string;
  stars: number;
  comment: string | null;
  tags: string[] | null;
  photo_urls: string[] | null;
  reply: string | null;
  reply_at: string | null;
  created_at: string;
  rated_by: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / (24 * 3600 * 1000));
  if (days < 1) return "hoje";
  if (days < 7) return `${days}d atrás`;
  if (days < 30) return `${Math.round(days / 7)}sem atrás`;
  if (days < 365) return `${Math.round(days / 30)}mês atrás`;
  return `${Math.round(days / 365)}ano atrás`;
}

function maskName(name: string | null): string {
  if (!name) return "Cliente";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0)}.`;
}

export async function BusinessReviews({
  businessId,
  avgStars,
  totalReviews,
}: {
  businessId: string;
  avgStars: number | null;
  totalReviews: number | null;
}) {
  const supabase = getPublicClient();

  // distribuição (lite, last 90d basta)
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const [{ data: distRaw }, { data: reviews }] = await Promise.all([
    supabase
      .from("ratings")
      .select("stars")
      .eq("business_id", businessId)
      .eq("rated_entity", "business")
      .gte("created_at", since),
    supabase
      .from("ratings")
      .select(
        "id, stars, comment, tags, photo_urls, reply, reply_at, created_at, rated_by",
      )
      .eq("business_id", businessId)
      .eq("rated_entity", "business")
      .order("created_at", { ascending: false })
      .limit(12) as never,
  ]);

  const reviewList = (reviews ?? []) as Review[];

  if (reviewList.length === 0) return null;

  // hidrata nomes via admin (RLS bloqueia leitura de profile alheio)
  const admin = getAdminClient();
  const raterIds = Array.from(new Set(reviewList.map((r) => r.rated_by)));
  const { data: profiles } = admin && raterIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", raterIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const counts = new Map<number, number>();
  for (const r of distRaw ?? []) counts.set(r.stars, (counts.get(r.stars) ?? 0) + 1);
  const totalDist = (distRaw ?? []).length;
  const totalShown = totalReviews ?? totalDist;
  const avg = avgStars ?? 0;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold tracking-tight">O que clientes dizem</h2>
        <p className="text-xs text-muted-foreground">
          {totalShown} avaliaç{totalShown === 1 ? "ão" : "ões"} de quem pediu mesmo
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-[160px,1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-4xl font-bold leading-none">{avg.toFixed(1)}</p>
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
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {totalShown} avaliações
          </p>
        </div>

        {totalDist > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <ul className="space-y-1">
              {[5, 4, 3, 2, 1].map((s) => {
                const c = counts.get(s) ?? 0;
                const pct = totalDist ? (c / totalDist) * 100 : 0;
                return (
                  <li key={s} className="grid grid-cols-[24px,1fr,32px] items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-0.5 font-semibold">
                      {s}
                      <Star className="h-2.5 w-2.5 fill-[color:var(--sun)] text-[color:var(--sun)]" />
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
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
                    <span className="text-right text-muted-foreground">{c}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Lista de reviews */}
      <ul className="space-y-3">
        {reviewList.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{maskName(nameMap.get(r.rated_by) ?? null)}</p>
              <span className="text-[10px] text-muted-foreground">{fmtDate(r.created_at)}</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-0.5">
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
            </div>
            {r.tags && r.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}

            {r.photo_urls && r.photo_urls.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto">
                {r.photo_urls.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}

            {r.reply && (
              <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs">
                <p className="font-semibold text-primary">
                  Resposta {r.reply_at && `· ${fmtDate(r.reply_at)}`}
                </p>
                <p className="mt-1">{r.reply}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
