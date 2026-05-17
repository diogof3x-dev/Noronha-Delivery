import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Search, Sparkles, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { ServiceBookingFlow } from "./booking-flow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function ServicoPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, name, description, district, logo_url, cover_url, type, metadata")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!business || business.type !== "servico") notFound();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, price_cents, duration_minutes, image_url, position")
    .eq("business_id", business.id)
    .eq("kind", "service")
    .eq("is_active", true)
    .order("position");

  const svcIds = (services ?? []).map((s) => s.id);
  const { data: slots } = svcIds.length
    ? await supabase
        .from("service_slots")
        .select("id, service_id, start_at, duration_minutes, capacity, booked_count, staff_name")
        .in("service_id", svcIds)
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
  const heroColor = meta.hero_color ?? "#0B7FA8";

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
          <Link href="/app" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/app/buscar" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="-mt-12 px-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-md">
          <div className="flex items-end gap-3">
            <span className="relative -mt-12 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-card bg-secondary shadow-sm">
              {business.logo_url ? (
                <Image src={business.logo_url} alt={business.name} fill className="object-cover" sizes="80px" unoptimized />
              ) : (
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-xl font-bold tracking-tight">{business.name}</h1>
              <p className="truncate text-xs text-muted-foreground">Serviço · {business.district}</p>
            </div>
          </div>
          {business.description && <p className="mt-3 text-sm text-muted-foreground">{business.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Star className="h-3 w-3 fill-[color:var(--sun)] text-[color:var(--sun)]" />
              {scoreRow?.avg_stars ? Number(scoreRow.avg_stars).toFixed(1) : "Novo"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {business.district}
            </span>
          </div>
        </div>
      </section>

      {(services?.length ?? 0) > 0 ? (
        <ServiceBookingFlow
          businessId={business.id}
          services={(services ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price_cents: s.price_cents,
            duration_minutes: s.duration_minutes,
            image_url: s.image_url,
            slots: (slots ?? [])
              .filter((sl) => sl.service_id === s.id)
              .map((sl) => ({
                id: sl.id,
                start_at: sl.start_at,
                duration_minutes: sl.duration_minutes,
                spots_left: Math.max(0, sl.capacity - sl.booked_count),
                staff_name: sl.staff_name,
              })),
          }))}
        />
      ) : (
        <div className="px-4 py-5">
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado ainda.
          </p>
        </div>
      )}
    </div>
  );
}
