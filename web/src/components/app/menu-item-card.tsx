import { AddToCartButton } from "./add-to-cart-button";
import type { CartBusiness } from "@/lib/cart-store";
import { formatCents } from "@/lib/format";

type Props = {
  business: CartBusiness;
  serviceId: string;
  name: string;
  description: string | null;
  priceCents: number;
  originalPriceCents?: number | null;
  imageUrl?: string | null;
  serves?: number | null;
  outOfStock?: boolean;
  featured?: boolean;
};

export function MenuItemCard({
  business,
  serviceId,
  name,
  description,
  priceCents,
  originalPriceCents,
  imageUrl,
  serves,
  outOfStock,
  featured,
}: Props) {
  const hasPromo =
    originalPriceCents != null && originalPriceCents > priceCents && priceCents > 0;
  const discountPct = hasPromo
    ? Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100)
    : 0;

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-semibold leading-tight">{name}</h3>
        {description && (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          <p className={`text-sm font-bold ${hasPromo ? "text-[color:var(--turtle)]" : ""}`}>
            {formatCents(priceCents)}
          </p>
          {hasPromo && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {formatCents(originalPriceCents)}
              </span>
              <span className="rounded-full bg-[color:var(--turtle)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                -{discountPct}%
              </span>
            </>
          )}
        </div>
        {serves != null && serves > 0 && (
          <p className="text-[10px] text-muted-foreground">Serve {serves} pessoa{serves > 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="relative h-24 w-24 shrink-0">
        {featured && (
          <span className="absolute left-1 top-1 z-10 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Mais pedido
          </span>
        )}
        <div className="h-full w-full overflow-hidden rounded-xl bg-secondary">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground/50">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <AddToCartButton
          business={business}
          item={{ serviceId, name, priceCents, imageUrl }}
          outOfStock={outOfStock}
        />
      </div>
    </div>
  );
}
