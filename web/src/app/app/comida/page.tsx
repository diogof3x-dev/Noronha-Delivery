import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { BusinessCard } from "@/components/app/business-card";
import { isBusinessOpenNow } from "@/lib/business-open";

type BusinessMeta = { cuisine?: string; hero_color?: string };

export const metadata = { title: "Comida" };

type Filter = "open" | "free" | "fast" | "top";
type Sort = "score" | "fast" | "free" | "name";

function parseList(v: string | string[] | undefined): Set<string> {
  if (!v) return new Set();
  const arr = Array.isArray(v) ? v : v.split(",");
  return new Set(arr.filter(Boolean));
}

const FILTER_META: Record<Filter, { label: string; icon: string }> = {
  open: { label: "Aberto agora", icon: "🟢" },
  free: { label: "Frete grátis", icon: "🚚" },
  fast: { label: "<30 min", icon: "⚡" },
  top: { label: "4★+", icon: "⭐" },
};

const SORT_LABEL: Record<Sort, string> = {
  score: "Mais avaliados",
  fast: "Mais rápidos",
  free: "Frete grátis primeiro",
  name: "A-Z",
};

export default async function ComidaPage({
  searchParams,
}: {
  searchParams?: Promise<{ filters?: string; sort?: string; cuisine?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const activeFilters = parseList(params.filters);
  const sort: Sort = (params.sort as Sort) ?? "score";
  const cuisineFilter = params.cuisine ?? null;

  const supabase = await getServerClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, district, logo_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, opening_hours, metadata",
    )
    .eq("type", "restaurante")
    .eq("is_active", true);

  const ids = (businesses ?? []).map((b) => b.id);
  const { data: scores } = ids.length
    ? await supabase
        .from("business_scores")
        .select("business_id, avg_stars, total_reviews")
        .in("business_id", ids)
    : { data: [] };

  const scoreMap = new Map<string, { avg: number | null; total: number | null }>();
  for (const s of scores ?? []) {
    if (s.business_id) {
      scoreMap.set(s.business_id, { avg: s.avg_stars, total: s.total_reviews });
    }
  }

  const cuisines = Array.from(
    new Set(
      (businesses ?? [])
        .map((b) => (b.metadata as BusinessMeta | null)?.cuisine)
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort();

  // aplica filtros
  let filtered = (businesses ?? []).map((b) => ({
    ...b,
    _score: scoreMap.get(b.id),
    _open: isBusinessOpenNow(b.opening_hours),
  }));

  if (cuisineFilter) {
    filtered = filtered.filter(
      (b) => (b.metadata as BusinessMeta | null)?.cuisine === cuisineFilter,
    );
  }
  if (activeFilters.has("open")) filtered = filtered.filter((b) => b._open);
  if (activeFilters.has("free"))
    filtered = filtered.filter((b) => (b.delivery_fee_cents ?? 0) === 0);
  if (activeFilters.has("fast"))
    filtered = filtered.filter((b) => (b.avg_prep_minutes ?? 999) < 30);
  if (activeFilters.has("top"))
    filtered = filtered.filter((b) => (b._score?.avg ?? 0) >= 4);

  // ordena
  filtered.sort((a, b) => {
    if (sort === "score") {
      const sa = a._score?.avg ?? 0;
      const sb = b._score?.avg ?? 0;
      if (sa !== sb) return sb - sa;
      return (b._score?.total ?? 0) - (a._score?.total ?? 0);
    }
    if (sort === "fast")
      return (a.avg_prep_minutes ?? 999) - (b.avg_prep_minutes ?? 999);
    if (sort === "free")
      return (a.delivery_fee_cents ?? 0) - (b.delivery_fee_cents ?? 0);
    return a.name.localeCompare(b.name);
  });

  function toggleHref(filter: Filter): string {
    const next = new Set(activeFilters);
    if (next.has(filter)) next.delete(filter);
    else next.add(filter);
    const sp = new URLSearchParams();
    if (next.size > 0) sp.set("filters", [...next].join(","));
    if (sort !== "score") sp.set("sort", sort);
    if (cuisineFilter) sp.set("cuisine", cuisineFilter);
    return `/app/comida${sp.toString() ? "?" + sp.toString() : ""}`;
  }

  function sortHref(s: Sort): string {
    const sp = new URLSearchParams();
    if (activeFilters.size > 0) sp.set("filters", [...activeFilters].join(","));
    if (s !== "score") sp.set("sort", s);
    if (cuisineFilter) sp.set("cuisine", cuisineFilter);
    return `/app/comida${sp.toString() ? "?" + sp.toString() : ""}`;
  }

  function cuisineHref(c: string | null): string {
    const sp = new URLSearchParams();
    if (activeFilters.size > 0) sp.set("filters", [...activeFilters].join(","));
    if (sort !== "score") sp.set("sort", sort);
    if (c) sp.set("cuisine", c);
    return `/app/comida${sp.toString() ? "?" + sp.toString() : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Comida</h1>
      </div>

      <Link
        href="/app/buscar?escopo=restaurante"
        className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <Search className="h-4 w-4" />
        Buscar restaurantes ou pratos
      </Link>

      {/* Filtros rápidos */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-1.5">
          {(Object.keys(FILTER_META) as Filter[]).map((f) => {
            const active = activeFilters.has(f);
            const meta = FILTER_META[f];
            return (
              <li key={f}>
                <Link
                  href={toggleHref(f)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card"
                  }`}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Cozinhas */}
      {cuisines.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-1.5">
            <li>
              <Link
                href={cuisineHref(null)}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${
                  !cuisineFilter
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card"
                }`}
              >
                Todas
              </Link>
            </li>
            {cuisines.map((c) => {
              const active = cuisineFilter === c;
              return (
                <li key={c}>
                  <Link
                    href={cuisineHref(c)}
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card"
                    }`}
                  >
                    {c}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {filtered.length} restaurante{filtered.length === 1 ? "" : "s"}
          </h2>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
              Ordem: {SORT_LABEL[sort]}
            </summary>
            <ul className="absolute right-0 z-10 mt-1 min-w-[180px] rounded-xl border border-border bg-background p-1 shadow-lg">
              {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                <li key={s}>
                  <Link
                    href={sortHref(s)}
                    className={`block rounded-md px-3 py-1.5 text-xs ${
                      sort === s ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted"
                    }`}
                  >
                    {SORT_LABEL[s]}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum restaurante com esses filtros agora.{" "}
            <Link href="/app/comida" className="text-primary underline">
              Limpar filtros
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((b) => {
              const meta = (b.metadata as BusinessMeta | null) ?? {};
              const score = b._score;
              return (
                <li key={b.id} className={!b._open ? "opacity-60" : ""}>
                  <BusinessCard
                    slug={b.slug ?? b.id}
                    name={b.name}
                    district={b.district}
                    cuisine={meta.cuisine}
                    heroColor={meta.hero_color}
                    logoUrl={b.logo_url}
                    isEco={b.is_eco_certified}
                    prepMinutes={b.avg_prep_minutes}
                    feeCents={b.delivery_fee_cents}
                    avgStars={score?.avg ?? null}
                    totalReviews={score?.total ?? null}
                  />
                  {!b._open && (
                    <p className="mt-1 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Fechado agora
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
