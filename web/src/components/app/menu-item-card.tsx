import { Plus } from "lucide-react";
import { formatCents } from "@/lib/format";

type Props = {
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl?: string | null;
  serves?: number;
  outOfStock?: boolean;
};

export function MenuItemCard({
  name,
  description,
  priceCents,
  imageUrl,
  serves,
  outOfStock,
}: Props) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-semibold leading-tight">{name}</h3>
        {description && (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{description}</p>
        )}
        <div className="mt-auto pt-2">
          <p className="text-sm font-bold">{formatCents(priceCents)}</p>
          {serves && (
            <p className="text-[10px] text-muted-foreground">Serve {serves} pessoas</p>
          )}
        </div>
      </div>

      <div className="relative h-24 w-24 shrink-0">
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
        <button
          type="button"
          disabled={outOfStock}
          className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          aria-label={`Adicionar ${name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
