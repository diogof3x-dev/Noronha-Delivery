import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { BusinessCard } from "@/components/app/business-card";
import { iconFor, GROUP_META, GROUP_ORDER } from "@/lib/category-icon";

type BusinessMeta = { cuisine?: string; hero_color?: string };

type Props = { searchParams: Promise<{ grupo?: string; q?: string }> };

export const dynamic = "force-dynamic";
export const metadata = { title: "Buscar" };

export default async function BuscarPage({ searchParams }: Props) {
  const { grupo, q } = await searchParams;
  const supabase = await getServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, label, group_id, icon")
    .eq("is_active", true)
    .order("position");

  let businessQuery = supabase
    .from("businesses")
    .select(
      "id, slug, name, district, logo_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, metadata, category_id, type",
    )
    .eq("is_active", true)
    .order("name");

  if (q) businessQuery = businessQuery.ilike("name", `%${q}%`);

  const { data: businesses } = await businessQuery;

  const byGroup = (categories ?? []).reduce<Record<string, NonNullable<typeof categories>>>(
    (acc, c) => {
      (acc[c.group_id] ??= []).push(c);
      return acc;
    },
    {},
  );

  const visibleGroups = grupo
    ? GROUP_ORDER.filter((g) => g === grupo)
    : GROUP_ORDER.filter((g) => byGroup[g]?.length);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Buscar</h1>
      </div>

      <form action="/app/buscar" className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Restaurantes, pratos, passeios, mercados…"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {grupo && <input type="hidden" name="grupo" value={grupo} />}
      </form>

      {q && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {(businesses ?? []).length} resultados para &ldquo;{q}&rdquo;
          </h2>
          {(businesses ?? []).length > 0 ? (
            <ul className="space-y-3">
              {(businesses ?? []).map((b) => {
                const meta = (b.metadata as BusinessMeta | null) ?? {};
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
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nada encontrado. Tenta outra palavra.
            </p>
          )}
        </section>
      )}

      {!q &&
        visibleGroups.map((groupId) => {
          const meta = GROUP_META[groupId];
          const items = byGroup[groupId] ?? [];
          return (
            <section key={groupId} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">{meta.label}</h2>
                <p className="text-xs text-muted-foreground">{meta.tagline}</p>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {items.map((cat) => {
                  const Icon = iconFor(cat.icon);
                  return (
                    <li key={cat.id}>
                      <Link
                        href={`/app/categoria/${cat.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-secondary/30"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="line-clamp-2 text-xs font-medium leading-tight">
                          {cat.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
