import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart, Utensils } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { BusinessCard } from "@/components/app/business-card";

export const dynamic = "force-dynamic";

const VITRINE_SEGMENT: Record<string, string> = {
  restaurante: "restaurante",
  mercado: "restaurante",
  farmacia: "restaurante",
  conveniencia: "restaurante",
  loja: "restaurante",
  pousada: "pousada",
  residencia: "casa",
  operador_passeio: "passeio",
  locadora: "aluguel",
  servico: "servico",
};

export default async function FavoritosPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/favoritos");

  const { data: favs } = await supabase
    .from("customer_favorites")
    .select("id, kind, business_id, service_id, created_at")
    .order("created_at", { ascending: false });

  const businessIds = (favs ?? [])
    .filter((f) => f.kind === "business")
    .map((f) => f.business_id);
  const serviceIds = (favs ?? [])
    .filter((f) => f.kind === "service")
    .map((f) => f.service_id)
    .filter((x): x is string => !!x);

  const [{ data: businesses }, { data: services }, { data: scores }] =
    await Promise.all([
      businessIds.length
        ? supabase
            .from("businesses")
            .select(
              "id, slug, name, district, type, logo_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, metadata",
            )
            .in("id", businessIds)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      serviceIds.length
        ? supabase
            .from("services")
            .select(
              "id, name, description, price_cents, image_url, business_id, businesses(slug, name, type)",
            )
            .in("id", serviceIds)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      businessIds.length
        ? supabase
            .from("business_scores")
            .select("business_id, avg_stars, total_reviews")
            .in("business_id", businessIds)
        : Promise.resolve({ data: [] }),
    ]);

  const scoreMap = new Map(
    (scores ?? []).map((s) => [
      s.business_id,
      { avg: s.avg_stars, total: s.total_reviews },
    ]),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Seus favoritos
          </p>
          <h1 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <Heart className="h-4 w-4 fill-destructive text-destructive" />
            Lugares que você ama
          </h1>
        </div>
      </div>

      {(businesses?.length ?? 0) === 0 && (services?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Heart className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Nada favoritado ainda</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Tocando no <Heart className="inline h-3 w-3" /> em qualquer loja ou prato, ele
            entra aqui pra você abrir num clique.
          </p>
          <Link
            href="/app/comida"
            className="mt-2 inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            Explorar restaurantes
          </Link>
        </div>
      ) : (
        <>
          {(businesses?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Lojas
              </h2>
              <ul className="space-y-3">
                {(businesses ?? []).map((b) => {
                  const meta = (b.metadata as { cuisine?: string; hero_color?: string } | null) ?? {};
                  const score = scoreMap.get(b.id);
                  return (
                    <li key={b.id}>
                      <BusinessCard
                        slug={b.slug ?? b.id}
                        name={b.name}
                        district={b.district}
                        cuisine={meta.cuisine}
                        heroColor={meta.hero_color}
                        logoUrl={b.logo_url}
                        isEco={b.is_eco_certified}
                        prepMinutes={b.avg_prep_minutes}
                        feeCents={b.delivery_fee_cents}
                        avgStars={score?.avg ?? null}
                        totalReviews={score?.total ?? null}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(services?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Pratos / produtos
              </h2>
              <ul className="space-y-2">
                {(services ?? []).map((s) => {
                  const biz = s.businesses as { slug?: string; name?: string; type?: string } | null;
                  const seg = VITRINE_SEGMENT[biz?.type ?? "restaurante"] ?? "restaurante";
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/app/${seg}/${biz?.slug ?? ""}#${s.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                          <Utensils className="h-5 w-5 text-muted-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {biz?.name ?? "—"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold">
                          R$ {(s.price_cents / 100).toFixed(2)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
