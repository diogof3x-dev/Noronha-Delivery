"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, Store, Utensils, X } from "lucide-react";
import { searchInstant, type SearchHit } from "@/app/actions/search";
import { formatCents } from "@/lib/format";

export function InstantSearch({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (q.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      start(async () => {
        const res = await searchInstant({ q, limit: 10 });
        if (res.ok) {
          setHits(res.hits);
          setOpen(true);
        }
      });
    }, 250);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [q]);

  const businessHits = hits.filter((h) => h.type === "business");
  const serviceHits = hits.filter((h) => h.type === "service");

  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder="Restaurantes, pratos, passeios, mercados…"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setHits([]);
              setOpen(false);
            }}
            aria-label="Limpar busca"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-xl">
          {hits.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nada encontrado pra &quot;{q}&quot;.
            </p>
          ) : (
            <>
              {businessHits.length > 0 && (
                <section>
                  <h3 className="px-3 pt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Lojas
                  </h3>
                  <ul>
                    {businessHits.map((h) => (
                      <li key={`b-${h.id}`}>
                        <Link
                          href={`/app/${h.vitrineSegment}/${h.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 border-b border-border px-3 py-2.5 hover:bg-muted/40"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                            {h.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={h.logoUrl} alt={h.name} className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{h.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {h.cuisine ? `${h.cuisine} · ` : ""}
                              {h.district ?? "Noronha"}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {serviceHits.length > 0 && (
                <section>
                  <h3 className="px-3 pt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Pratos / produtos
                  </h3>
                  <ul>
                    {serviceHits.map((h) => (
                      <li key={`s-${h.id}`}>
                        <Link
                          href={`/app/${h.vitrineSegment}/${h.businessSlug}#${h.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 border-b border-border px-3 py-2.5 hover:bg-muted/40"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                            {h.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={h.imageUrl} alt={h.name} className="h-full w-full object-cover" />
                            ) : (
                              <Utensils className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{h.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {h.businessName}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold">
                            {formatCents(h.priceCents)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
