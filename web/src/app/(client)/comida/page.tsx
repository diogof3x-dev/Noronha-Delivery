import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { BusinessCard } from "@/components/app/business-card";

type BusinessMeta = { cuisine?: string; hero_color?: string };

export const metadata = { title: "Comida" };

export default async function ComidaPage() {
  const supabase = await getServerClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, district, logo_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, metadata",
    )
    .eq("type", "restaurante")
    .eq("is_active", true)
    .order("name");

  const ids = (businesses ?? []).map((b) => b.id);
  const { data: scores } = ids.length
    ? await supabase.from("business_scores").select("business_id, avg_stars, total_reviews").in("business_id", ids)
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
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Comida</h1>
      </div>

      <Link
        href="/buscar?escopo=restaurante"
        className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <Search className="h-4 w-4" />
        Buscar restaurantes ou pratos
      </Link>

      {cuisines.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-2">
            {cuisines.map((c) => (
              <li key={c}>
                <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {businesses?.length ?? 0} restaurantes em Noronha
          </h2>
        </div>

        <ul className="space-y-3">
          {(businesses ?? []).map((b) => {
            const meta = (b.metadata as BusinessMeta | null) ?? {};
            const score = scoreMap.get(b.id);
            return (
              <li key={b.id}>
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
              </li>
            );
          })}
        </ul>

        {(businesses ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum restaurante cadastrado ainda.
          </p>
        )}
      </section>
    </div>
  );
}
