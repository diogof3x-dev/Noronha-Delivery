import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Home, Leaf, MapPin, Search, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { RoomsBookingFlow } from "@/app/app/pousada/[slug]/booking-flow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description, type, district, slug, logo_url, cover_url, is_eco_certified")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!business) return { title: slug.replace(/-/g, " ") };
  const { buildBusinessMetadata } = await import("@/lib/og-metadata");
  return buildBusinessMetadata(business);
}

export default async function CasaPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, description, district, address, logo_url, cover_url, is_eco_certified, type, metadata",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!business || (business.type !== "residencia" && business.type !== "pousada")) notFound();

  const { data: rooms } = await supabase
    .from("rooms")
    .select(
      "id, name, description, capacity, price_per_night_cents, bed_layout, amenities, photos",
    )
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("position");

  const { data: scoreRow } = await supabase
    .from("business_scores")
    .select("avg_stars, total_reviews")
    .eq("business_id", business.id)
    .maybeSingle();

  const meta = (business.metadata as { hero_color?: string } | null) ?? {};
  const heroColor = meta.hero_color ?? "#0B7FA8";
  const isResidencia = business.type === "residencia";

  return (
    <div className="-mx-4 -mt-3 -mb-4 flex flex-col">
      <header
        className="relative isolate aspect-[3/1.4] overflow-hidden sm:aspect-[3/1]"
        style={{
          background: business.cover_url
            ? undefined
            : `linear-gradient(135deg, ${heroColor} 0%, var(--ocean-dark) 100%)`,
        }}
      >
        {business.cover_url && (
          <Image src={business.cover_url} alt={business.name} fill priority className="object-cover" sizes="100vw" unoptimized />
        )}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
          <Link
            href="/app"
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
                <Home className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-xl font-bold tracking-tight">{business.name}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {isResidencia ? "Casa particular" : "Pousada"} · {business.district}
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
                <span className="font-normal text-muted-foreground">({scoreRow.total_reviews})</span>
              ) : null}
            </span>
            {business.address && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {business.district}
                </span>
              </>
            )}
            {business.is_eco_certified && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                <Leaf className="h-3 w-3" />
                Eco
              </span>
            )}
          </div>
        </div>
      </section>

      {(rooms?.length ?? 0) > 0 ? (
        <RoomsBookingFlow
          businessId={business.id}
          businessName={business.name}
          rooms={(rooms ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            capacity: r.capacity,
            price_per_night_cents: r.price_per_night_cents,
            bed_layout: r.bed_layout,
            amenities: r.amenities,
            photo: r.photos?.[0] ?? null,
          }))}
        />
      ) : (
        <div className="space-y-4 p-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Home className="h-5 w-5" />
            </span>
            <p className="max-w-md text-sm text-muted-foreground">
              {isResidencia
                ? "O anfitrião ainda não cadastrou a casa. Volte em breve."
                : "A pousada ainda não cadastrou quartos."}
            </p>
          </div>
        </div>
      )}

      <section className="space-y-2 px-4 py-4">
        <p className="text-xs text-muted-foreground">
          {isResidencia
            ? "Aluguel de casa particular. Verifique as regras da casa com o anfitrião antes de confirmar."
            : "Reservas confirmadas só após pagamento. Cancelamento gratuito até 48h antes do check-in."}
        </p>
      </section>
    </div>
  );
}
