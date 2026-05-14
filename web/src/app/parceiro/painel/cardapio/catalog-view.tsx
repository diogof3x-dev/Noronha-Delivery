"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, UtensilsCrossed, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CardapioItemRow } from "./item-row";

export type CatalogService = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  original_price_cents: number | null;
  kind: string;
  is_active: boolean;
  position: number;
  image_url: string | null;
  section: string | null;
  is_featured: boolean;
  serves_people: number | null;
};

type Business = { id: string; name: string };

export function CardapioCatalog({
  businesses,
  services,
}: {
  businesses: Business[];
  services: CatalogService[];
}) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return services;
    return services.filter((s) => {
      const hay = `${s.name} ${s.description ?? ""} ${s.section ?? ""}`.toLowerCase();
      return hay.includes(normalized);
    });
  }, [services, normalized]);

  // group: business -> section -> services
  const groupedByBusiness = useMemo(() => {
    const map = new Map<string, Map<string, CatalogService[]>>();
    for (const b of businesses) map.set(b.id, new Map());
    for (const s of filtered) {
      const bMap = map.get(s.business_id);
      if (!bMap) continue;
      const sectionKey = s.section?.trim() || "Sem seção";
      if (!bMap.has(sectionKey)) bMap.set(sectionKey, []);
      bMap.get(sectionKey)!.push(s);
    }
    return map;
  }, [filtered, businesses]);

  // sections do primeiro business (pra tabs rápidas — útil quando o user só tem 1 loja)
  const firstBiz = businesses[0];
  const firstSections = useMemo(() => {
    if (!firstBiz) return [] as { name: string; count: number }[];
    const sectionMap = new Map<string, number>();
    for (const s of services.filter((x) => x.business_id === firstBiz.id)) {
      const k = s.section?.trim() || "Sem seção";
      sectionMap.set(k, (sectionMap.get(k) ?? 0) + 1);
    }
    return Array.from(sectionMap.entries()).map(([name, count]) => ({ name, count }));
  }, [services, firstBiz]);

  return (
    <div className="space-y-5">
      <label className="sticky top-0 z-20 flex h-11 items-center gap-2 rounded-2xl border border-border bg-background/95 px-3 text-sm shadow-sm backdrop-blur">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar item no cardápio..."
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      {firstSections.length > 1 && !normalized && (
        <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSection === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Tudo · {services.filter((s) => s.business_id === firstBiz.id).length}
          </button>
          {firstSections.map((sec) => (
            <button
              key={sec.name}
              type="button"
              onClick={() => setActiveSection(sec.name)}
              className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === sec.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {sec.name} · {sec.count}
            </button>
          ))}
        </div>
      )}

      {businesses.map((b) => {
        const sectionMap = groupedByBusiness.get(b.id);
        const sectionList = sectionMap ? Array.from(sectionMap.entries()) : [];
        const totalForBiz = sectionList.reduce((acc, [, list]) => acc + list.length, 0);

        // se filtrou por section ativa, esconder outras
        const visibleSections = activeSection
          ? sectionList.filter(([name]) => name === activeSection)
          : sectionList;

        if (totalForBiz === 0) {
          return (
            <section key={b.id} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {b.name}
              </h2>
              <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {normalized
                  ? `Nada encontrado por "${query}"`
                  : "Cardápio vazio. Use o botão Adicionar itens acima."}
              </p>
            </section>
          );
        }

        return (
          <section key={b.id} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {b.name} · {totalForBiz} {totalForBiz === 1 ? "item" : "itens"}
            </h2>

            {visibleSections.map(([sectionName, items]) => (
              <details key={sectionName} open className="group rounded-2xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm font-semibold">
                    {sectionName}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {items.length} {items.length === 1 ? "item" : "itens"}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <ul className="space-y-2 border-t border-border p-3">
                  {items.map((s) => (
                    <CardapioItemRow
                      key={s.id}
                      id={s.id}
                      name={s.name}
                      description={s.description}
                      priceCents={s.price_cents}
                      originalPriceCents={s.original_price_cents}
                      imageUrl={s.image_url}
                      isActive={s.is_active}
                      section={s.section}
                      isFeatured={s.is_featured}
                      servesPeople={s.serves_people}
                    />
                  ))}
                </ul>
              </details>
            ))}
          </section>
        );
      })}
    </div>
  );
}
