import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Leaf, MapPin, Sailboat, Search, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { TourBookingFlow } from "./booking-flow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function PasseioPage({ params }: Props) {
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
  if (!business || business.type !== "operador_passeio") notFound();

  const { data: tours } = await supabase
    .from("services")
    .select("id, name, description, price_cents, duration_minutes, capacity, image_url, position")
    .eq("business_id", business.id)
    .eq("kind", "tour")
    .eq("is_active", true)
    .order("position");

  const tourIds = (tours ?? []).map((t) => t.id);
  const { data: sessions } = tourIds.length
    ? await supabase
        .from("tour_sessions")
        .select("id, service_id, start_at, capacity, sold_pax, meeting_point")
        .in("service_id", tourIds)
        .eq("is_active", true)
        .gte("start_at", new Date().toISOString())
        .order("start_at")
        .limit(200)
    : { data: [] };

  const { data: scoreRow } = await supabase
    .from("business_scores")
    .select("avg_stars, total_reviews")
    .eq("business_id", business.id)
    .maybeSingle();

  const meta = (business.metadata as { hero_color?: string } | null) ?? {};
  const cover = business.cover_url ?? null;
  const heroColor = meta.hero_color ?? "#0B7FA8";

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
            alt={business.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
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
                <Sailboat className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-xl font-bold tracking-tight">{business.name}</h1>
              <p className="truncate text-xs text-muted-foreground">
                Operador de passeios · {business.district}
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
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {business.district}
            </span>
            {business.is_eco_certified && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                <Leaf className="h-3 w-3" />
                Eco
              </span>
            )}
          </div>
        </div>
      </section>

      {(tours?.length ?? 0) > 0 ? (
        <TourBookingFlow
          businessId={business.id}
          tours={(tours ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            price_cents: t.price_cents,
            duration_minutes: t.duration_minutes,
            capacity: t.capacity,
            image_url: t.image_url,
            sessions: (sessions ?? [])
              .filter((s) => s.service_id === t.id)
              .map((s) => ({
                id: s.id,
                start_at: s.start_at,
                capacity: s.capacity,
                spots_left: Math.max(0, s.capacity - s.sold_pax),
                meeting_point: s.meeting_point,
              })),
          }))}
        />
      ) : (
        <div className="px-4 py-5">
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            A operadora ainda não cadastrou passeios. Volte em breve.
          </p>
        </div>
      )}
    </div>
  );
}
