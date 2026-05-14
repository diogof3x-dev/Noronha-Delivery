import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { ProductCustomizer } from "./customizer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Item · ${id.slice(0, 6)}` };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();

  const { data: service } = await supabase
    .from("services")
    .select(
      "id, name, description, price_cents, original_price_cents, image_url, serves_people, stock, is_active, business_id, businesses(id, slug, name, delivery_fee_cents, min_order_cents, avg_prep_minutes, is_active, metadata)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!service || !service.is_active) notFound();

  const business = service.businesses as {
    id: string;
    slug: string | null;
    name: string;
    delivery_fee_cents: number | null;
    min_order_cents: number | null;
    avg_prep_minutes: number | null;
    is_active: boolean;
    metadata: { hero_color?: string } | null;
  } | null;
  if (!business || !business.is_active) notFound();

  const { data: groups } = await supabase
    .from("service_option_groups")
    .select("id, name, kind, min_choices, max_choices, position")
    .eq("service_id", service.id)
    .order("position");

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: options } = groupIds.length
    ? await supabase
        .from("service_options")
        .select("id, group_id, name, price_delta_cents, is_active, is_default, position")
        .in("group_id", groupIds)
        .eq("is_active", true)
        .order("position")
    : { data: [] };

  const grouped = (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    kind: g.kind,
    minChoices: g.min_choices,
    maxChoices: g.max_choices,
    options: (options ?? []).filter((o) => o.group_id === g.id),
  }));

  const hasPromo =
    service.original_price_cents != null &&
    service.original_price_cents > service.price_cents &&
    service.price_cents > 0;
  const pct = hasPromo
    ? Math.round(
        ((service.original_price_cents! - service.price_cents) / service.original_price_cents!) *
          100,
      )
    : 0;

  return (
    <div className="-mx-4 -mt-3 -mb-4 flex flex-col">
      <header className="relative aspect-square w-full overflow-hidden bg-secondary">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-7xl font-bold text-muted-foreground/30">
            {service.name.charAt(0)}
          </span>
        )}
        <Link
          href={`/app/restaurante/${business.slug ?? business.id}`}
          aria-label="Voltar"
          className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {hasPromo && (
          <span className="absolute right-3 top-3 rounded-full bg-[color:var(--turtle)] px-2 py-1 text-xs font-bold text-white">
            -{pct}%
          </span>
        )}
      </header>

      <div className="space-y-4 px-4 py-5">
        <section>
          <p className="text-xs text-muted-foreground">{business.name}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{service.name}</h1>
          {service.description && (
            <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
          )}
          {service.serves_people && service.serves_people > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Serve {service.serves_people} pessoa{service.serves_people > 1 ? "s" : ""}
            </p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                hasPromo ? "text-[color:var(--turtle)]" : ""
              }`}
            >
              {formatCents(service.price_cents)}
            </span>
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCents(service.original_price_cents!)}
              </span>
            )}
          </div>
        </section>

        <ProductCustomizer
          business={{
            id: business.id,
            slug: business.slug ?? business.id,
            name: business.name,
            deliveryFeeCents: business.delivery_fee_cents,
            minOrderCents: business.min_order_cents,
            avgPrepMinutes: business.avg_prep_minutes,
            heroColor: business.metadata?.hero_color,
          }}
          item={{
            serviceId: service.id,
            name: service.name,
            priceCents: service.price_cents,
            imageUrl: service.image_url,
          }}
          groups={grouped}
        />
      </div>
    </div>
  );
}
