import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Leaf, MapPin, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { MenuItemCard } from "@/components/app/menu-item-card";
import { formatDeliveryFee, formatPrepTime } from "@/lib/format";

type BusinessMeta = { cuisine?: string; hero_color?: string };
type ServiceMeta = { section?: string; serves?: number };

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
    .select("id, name, description, price_cents, image_url, stock, position, meta")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("position", { ascending: true });

  const { data: scoreRow } = await supabase
    .from("business_scores")
    .select("avg_stars, total_reviews")
    .eq("business_id", business.id)
    .maybeSingle();

  const meta = (business.metadata as BusinessMeta | null) ?? {};

  const sections: Record<string, NonNullable<typeof services>> = {};
  for (const s of services ?? []) {
    const section = (s.meta as ServiceMeta | null)?.section ?? "Cardápio";
    (sections[section] ??= []).push(s);
  }
  const sectionNames = Object.keys(sections);

  const cartBusiness = {
    id: business.id,
    slug: business.slug ?? business.id,
    name: business.name,
    deliveryFeeCents: business.delivery_fee_cents,
    minOrderCents: business.min_order_cents,
    avgPrepMinutes: business.avg_prep_minutes,
    heroColor: meta.hero_color,
  };

  return (
    <div className="-mx-4 -mt-3 -mb-4 flex flex-col">
      <header
        className="relative isolate overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${meta.hero_color ?? "#0B7FA8"} 0%, var(--ocean-dark) 100%)`,
        }}
      >
        <div className="px-4 pb-16 pt-4 text-white">
          <Link
            href="/app/comida"
            className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="mt-4 flex items-end gap-3">
            <span
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-2xl font-bold backdrop-blur"
              aria-hidden
            >
              {business.name
                .split(/\s+/)
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight">{business.name}</h1>
              <p className="mt-0.5 truncate text-sm text-white/85">
                {meta.cuisine ? `${meta.cuisine} · ` : ""}
                {business.district}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="-mt-10 px-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {business.description && (
            <p className="mb-3 text-sm text-muted-foreground">{business.description}</p>
          )}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="h-3 w-3 fill-[color:var(--sun)] text-[color:var(--sun)]" />
                {scoreRow?.avg_stars ? Number(scoreRow.avg_stars).toFixed(1) : "Novo"}
              </span>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {scoreRow?.total_reviews ? `${scoreRow.total_reviews} avaliações` : "Sem avaliações"}
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock className="h-3 w-3" />
                {formatPrepTime(business.avg_prep_minutes)}
              </span>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Tempo de entrega</p>
            </div>
            <div>
              <span className="font-semibold">{formatDeliveryFee(business.delivery_fee_cents)}</span>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {business.min_order_cents
                  ? `Pedido mín ${formatDeliveryFee(business.min_order_cents).replace("Frete ", "")}`
                  : "Sem mínimo"}
              </p>
            </div>
          </div>

          {business.is_eco_certified && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[color:var(--turtle)]/10 px-3 py-2 text-xs text-[color:var(--turtle)]">
              <Leaf className="h-4 w-4" />
              Entrega 100% elétrica
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {business.district} · Fernando de Noronha
          </div>
        </div>
      </section>

      {sectionNames.length > 0 && (
        <nav className="sticky top-14 z-20 mt-5 -mx-4 border-b border-border bg-background/95 backdrop-blur">
          <ul className="mx-auto flex max-w-md gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sectionNames.map((name) => (
              <li key={name}>
                <a
                  href={`#sec-${encodeURIComponent(name)}`}
                  className="inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="space-y-6 px-4 pb-6 pt-5">
        {sectionNames.map((name) => (
          <section key={name} id={`sec-${encodeURIComponent(name)}`} className="scroll-mt-28">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {name}
            </h2>
            <ul className="space-y-3">
              {sections[name]!.map((s) => {
                const m = (s.meta as ServiceMeta | null) ?? {};
                return (
                  <li key={s.id}>
                    <MenuItemCard
                      business={cartBusiness}
                      serviceId={s.id}
                      name={s.name}
                      description={s.description}
                      priceCents={s.price_cents}
                      imageUrl={s.image_url}
                      serves={m.serves}
                      outOfStock={s.stock !== null && s.stock <= 0}
                    />
                  </li>
                );
              })}
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
