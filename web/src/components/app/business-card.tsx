import Link from "next/link";
import { Clock, Leaf, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDeliveryFee, formatPrepTime } from "@/lib/format";

type Props = {
  slug: string;
  name: string;
  district: string | null;
  cuisine?: string;
  heroColor?: string;
  logoUrl?: string | null;
  isEco: boolean;
  prepMinutes: number | null;
  feeCents: number | null;
  avgStars?: number | null;
  totalReviews?: number | null;
};

export function BusinessCard({
  slug,
  name,
  district,
  cuisine,
  heroColor,
  logoUrl,
  isEco,
  prepMinutes,
  feeCents,
  avgStars,
  totalReviews,
}: Props) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const score = avgStars ?? null;

  return (
    <Link
      href={`/restaurante/${slug}`}
      className="group flex gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-secondary/30"
    >
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
        style={{ backgroundColor: heroColor ?? "var(--ocean)" }}
        aria-hidden
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full rounded-xl object-cover" />
        ) : (
          initials
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-tight">{name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {cuisine ? `${cuisine} · ` : ""}
            {district}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
            <Star className="h-3 w-3 fill-[color:var(--sun)] text-[color:var(--sun)]" />
            {score !== null && score !== undefined ? Number(score).toFixed(1) : "Novo"}
            {totalReviews ? (
              <span className="font-normal text-muted-foreground">({totalReviews})</span>
            ) : null}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatPrepTime(prepMinutes)}
          </span>
          <span>{formatDeliveryFee(feeCents)}</span>
        </div>
      </div>

      {isEco && (
        <Badge
          className="self-start border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/10 text-[10px] text-[color:var(--turtle)]"
          variant="outline"
        >
          <Leaf className="mr-0.5 h-3 w-3" />
          Eco
        </Badge>
      )}
    </Link>
  );
}
