"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { CartBusiness } from "@/lib/cart-store";
import { MenuItemCard } from "./menu-item-card";
import { FeaturedRow } from "./featured-row";
import { SectionTabs } from "./section-tabs";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  original_price_cents: number | null;
  image_url: string | null;
  serves_people: number | null;
  is_featured: boolean;
  stock: number | null;
  section: string | null;
};

export function RestaurantMenu({
  business,
  businessName,
  services,
  servicesWithOptions,
}: {
  business: CartBusiness;
  businessName: string;
  services: Service[];
  servicesWithOptions: string[];
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const withOptions = useMemo(() => new Set(servicesWithOptions), [servicesWithOptions]);

  const filtered = useMemo(() => {
    if (!normalized) return services;
    return services.filter((s) => {
      const hay = `${s.name} ${s.description ?? ""} ${s.section ?? ""}`.toLowerCase();
      return hay.includes(normalized);
    });
  }, [services, normalized]);

  const featured = useMemo(() => filtered.filter((s) => s.is_featured), [filtered]);

  const sections = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    for (const s of filtered) {
      const k = s.section?.trim() || "Cardápio";
      (grouped[k] ??= []).push(s);
    }
    return grouped;
  }, [filtered]);

  const sectionNames = Object.keys(sections);
  const hasQuery = normalized.length > 0;

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-sm shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar em ${businessName}`}
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
      </div>

      {!hasQuery && featured.length > 0 && (
        <section className="mt-5 px-4">
          <h2 className="mb-2 text-base font-bold">Destaques</h2>
          <FeaturedRow
            items={featured.map((f) => ({
              id: f.id,
              name: f.name,
              priceCents: f.price_cents,
              originalPriceCents: f.original_price_cents,
              imageUrl: f.image_url,
              hasOptions: withOptions.has(f.id),
            }))}
            business={business}
          />
        </section>
      )}

      {!hasQuery && sectionNames.length > 0 && <SectionTabs sections={sectionNames} />}

      <div className="space-y-6 px-4 pb-6 pt-5">
        {hasQuery && filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nada encontrado por &ldquo;{query}&rdquo;. Tenta outra palavra.
          </p>
        )}

        {hasQuery && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          </p>
        )}

        {sectionNames.map((name) => (
          <section key={name} id={`sec-${encodeURIComponent(name)}`} className="scroll-mt-32">
            <h2 className="mb-3 text-base font-bold">{name}</h2>
            <ul className="space-y-3">
              {sections[name]!.map((s) => (
                <li key={s.id}>
                  <MenuItemCard
                    business={business}
                    serviceId={s.id}
                    name={s.name}
                    description={s.description}
                    priceCents={s.price_cents}
                    originalPriceCents={s.original_price_cents}
                    imageUrl={s.image_url}
                    serves={s.serves_people}
                    outOfStock={s.stock !== null && s.stock <= 0}
                    featured={s.is_featured}
                    hasOptions={withOptions.has(s.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
