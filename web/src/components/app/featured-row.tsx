"use client";

import { AddToCartButton } from "./add-to-cart-button";
import type { CartBusiness } from "@/lib/cart-store";
import { formatCents } from "@/lib/format";

type Item = {
  id: string;
  name: string;
  priceCents: number;
  originalPriceCents: number | null;
  imageUrl: string | null;
};

export function FeaturedRow({
  items,
  business,
}: {
  items: Item[];
  business: CartBusiness;
}) {
  return (
    <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((it) => {
        const hasPromo =
          it.originalPriceCents != null &&
          it.originalPriceCents > it.priceCents &&
          it.priceCents > 0;
        const pct = hasPromo
          ? Math.round(((it.originalPriceCents! - it.priceCents) / it.originalPriceCents!) * 100)
          : 0;
        return (
          <li key={it.id} className="w-36 shrink-0">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground/40">
                  {it.name.charAt(0)}
                </span>
              )}
              {hasPromo && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-[color:var(--turtle)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{pct}%
                </span>
              )}
              <AddToCartButton
                business={business}
                item={{
                  serviceId: it.id,
                  name: it.name,
                  priceCents: it.priceCents,
                  imageUrl: it.imageUrl ?? undefined,
                }}
              />
            </div>
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1.5">
                <p className="text-sm font-bold">{formatCents(it.priceCents)}</p>
                {hasPromo && (
                  <p className="text-[10px] text-muted-foreground line-through">
                    {formatCents(it.originalPriceCents!)}
                  </p>
                )}
              </div>
              <p className="line-clamp-2 text-[11px] leading-tight">{it.name}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
