import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Leaf, Search, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { MenuItemCard } from "@/components/app/menu-item-card";
import { FeaturedRow } from "@/components/app/featured-row";
import { SectionTabs } from "@/components/app/section-tabs";
import { formatCents, formatPrepTime } from "@/lib/format";

type BusinessMeta = { cuisine?: string; hero_color?: string };

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function RestaurantePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, description, district, logo_url, cover_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, min_order_cents, metadata",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!business) notFound();

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name, description, price_cents, original_price_cents, image_url, stock, position, section, is_featured, serves_people, meta",
    )
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("section", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });

  const { data: scoreRow } = await supabase
    .from("business_scores")
    .select("avg_stars, total_reviews")
    .eq("business_id", business.id)
    .maybeSingle();

  const meta = (business.metadata as BusinessMeta | null) ?? {};
  const cover = business.cover_url ?? null;
  const heroColor = meta.hero_color ?? "#0B7FA8";

  const featured = (services ?? []).filter((s) => s.is_featured);

  const sections: Record<string, NonNullable<typeof services>> = {};
  for (const s of services ?? []) {
    const sectionName = s.section?.trim() || "Cardápio";
    (sections[sectionName] ??= []).push(s);
  }
  const sectionNames = Object.keys(sections);

  const cartBusiness = {
    id: business.id,
    slug: business.slug ?? business.id,
    name: business.name,
    deliveryFeeCents: business.delivery_fee_cents,
    minOrderCents: business.min_order_cents,
    avgPrepMinutes: business.avg_prep_minutes,
    heroColor,
  };

  const deliveryLabel =
    business.delivery_fee_cents == null
      ? "frete a calcular"
      : business.delivery_fee_cents === 0
        ? "Grátis"
        : formatCents(business.delivery_fee_cents);

  return (
    <div className="-mx-4 -mt-3 -mb-4 flex flex-col">
      <header
        className="relative isolate aspect-[3/1.4] overflow-hidden sm:aspect-[3/1]"
        style={{
          background: cover
            ? undefined
            : `linear-gradient(135deg, ${heroColor} 0%, var(--ocean-dark) 100%)`,
        }}
      >
        {cover && (
          <Image
            src={cover}
            alt={`Capa de ${business.name}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        )}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
          <Link
            href="/app/comida"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link
            href="/app/buscar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="-mt-12 px-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-md">
          <div className="flex items-end gap-3">
            <span className="relative -mt-12 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-card bg-secondary shadow-sm">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                  {business.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-xl font-bold tracking-tight">{business.name}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {meta.cuisine ? `${meta.cuisine} · ` : ""}
                {business.district}
                {business.min_order_cents
                  ? ` · Min ${formatCents(business.min_order_cents)}`
                  : ""}
              </p>
            </div>
          </div>

          {business.description && (
            <p className="mt-3 text-sm text-muted-foreground">{business.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Star className="h-3 w-3 fill-[color:var(--sun)] text-[color:var(--sun)]" />
              {scoreRow?.avg_stars ? Number(scoreRow.avg_stars).toFixed(1) : "Novo"}
              {scoreRow?.total_reviews ? (
                <span className="font-normal text-muted-foreground">
                  ({scoreRow.total_reviews})
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatPrepTime(business.avg_prep_minutes)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span
              className={
                business.delivery_fee_cents === 0
                  ? "font-semibold text-[color:var(--turtle)]"
                  : "font-medium"
              }
            >
              {deliveryLabel}
            </span>
            {business.is_eco_certified && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                <Leaf className="h-3 w-3" />
                100% elétrica
              </span>
            )}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mt-5 px-4">
          <h2 className="mb-2 text-base font-bold">Destaques</h2>
          <FeaturedRow
            items={featured.map((f) => ({
              id: f.id,
              name: f.name,
              priceCents: f.price_cents,
              originalPriceCents: f.original_price_cents,
              imageUrl: f.image_url,
            }))}
            business={cartBusiness}
          />
        </section>
      )}

      {sectionNames.length > 0 && (
        <SectionTabs sections={sectionNames} />
      )}

      <div className="space-y-6 px-4 pb-6 pt-5">
        {sectionNames.map((name) => (
          <section key={name} id={`sec-${encodeURIComponent(name)}`} className="scroll-mt-28">
            <h2 className="mb-3 text-base font-bold">{name}</h2>
            <ul className="space-y-3">
              {sections[name]!.map((s) => (
                <li key={s.id}>
                  <MenuItemCard
                    business={cartBusiness}
                    serviceId={s.id}
                    name={s.name}
                    description={s.description}
                    priceCents={s.price_cents}
                    originalPriceCents={s.original_price_cents}
                    imageUrl={s.image_url}
                    serves={s.serves_people}
                    outOfStock={s.stock !== null && s.stock <= 0}
                    featured={s.is_featured}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {sectionNames.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Cardápio em preparação.
          </p>
        )}
      </div>
    </div>
  );
}
