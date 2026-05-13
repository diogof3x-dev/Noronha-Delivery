import Link from "next/link";
import {
  ArrowRight,
  Bike,
  ChevronRight,
  Hotel,
  Leaf,
  Pill,
  ShoppingBasket,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { iconFor, GROUP_META, GROUP_ORDER } from "@/lib/category-icon";
import { BusinessCard } from "@/components/app/business-card";

const shortcuts = [
  { href: "/comida", label: "Comida", Icon: Utensils },
  { href: "/categoria/mercado", label: "Mercado", Icon: ShoppingBasket },
  { href: "/categoria/farmacia", label: "Farmácia", Icon: Pill },
  { href: "/categoria/passeios", label: "Passeios", Icon: Waves },
  { href: "/categoria/transfer", label: "Transfer", Icon: Bike },
  { href: "/categoria/delivery-pousada", label: "Pousada", Icon: Hotel },
];

type BusinessMeta = { cuisine?: string; hero_color?: string };

export default async function AppHome() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user) : null;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, label, group_id, icon, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const { data: featured } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, district, logo_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, metadata",
    )
    .eq("type", "restaurante")
    .eq("is_active", true)
    .order("name")
    .limit(4);

  const featuredIds = (featured ?? []).map((b) => b.id);
  const { data: scores } = featuredIds.length
    ? await supabase.from("business_scores").select("business_id, avg_stars, total_reviews").in("business_id", featuredIds)
    : { data: [] };
  const scoreMap = new Map<string, { avg: number | null; total: number | null }>();
  for (const s of scores ?? []) {
    if (s.business_id) {
      scoreMap.set(s.business_id, { avg: s.avg_stars, total: s.total_reviews });
    }
  }

  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const greeting = !user
    ? "Bem-vindo a Noronha"
    : profile?.is_resident
      ? `Bom dia, ${firstName || "morador"}`
      : `Bem-vindo a Noronha${firstName ? `, ${firstName}` : ""}`;
  const subline = !user
    ? "Tudo o que a ilha oferece, num lugar só. Sem precisar criar conta pra olhar."
    : profile?.is_resident
      ? "O que você precisa hoje?"
      : "Tudo o que a ilha oferece, num lugar só.";

  const byGroup = (categories ?? []).reduce<
    Record<string, NonNullable<typeof categories>>
  >((acc, c) => {
    (acc[c.group_id] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </section>

      <section>
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shortcuts.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex w-20 flex-col items-center gap-1.5 rounded-2xl bg-card p-3 text-center transition-colors hover:bg-secondary/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium leading-tight">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl bg-ocean-grad p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Mar e clima agora
            </p>
            <p className="mt-1 text-lg font-semibold">Em breve aqui</p>
            <p className="mt-1 text-xs text-white/85">
              Vento, ondas, maré e &ldquo;que praia agora?&rdquo;.
            </p>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[color:var(--sun)]">
            <Sparkles className="h-6 w-6" />
          </span>
        </div>
      </section>

      {(featured ?? []).length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Restaurantes pra você</h2>
              <p className="text-xs text-muted-foreground">
                Cozinhas que entregam onde você estiver na ilha
              </p>
            </div>
            <Link
              href="/comida"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ul className="space-y-3">
            {(featured ?? []).map((b) => {
              const meta = (b.metadata as BusinessMeta | null) ?? {};
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

      <section className="rounded-2xl border border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/10 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--turtle)] text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">100% elétrico</p>
            <p className="text-xs text-muted-foreground">
              Cada pedido aqui é entrega silenciosa e sem combustão.
            </p>
          </div>
        </div>
      </section>

      {GROUP_ORDER.filter((g) => byGroup[g]?.length).map((groupId) => {
        const meta = GROUP_META[groupId];
        const items = byGroup[groupId] ?? [];
        return (
          <section key={groupId} className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight">{meta.label}</h2>
                <p className="text-xs text-muted-foreground">{meta.tagline}</p>
              </div>
              <Link
                href={`/buscar?grupo=${groupId}`}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
              >
                Ver tudo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex min-w-max gap-3">
                {items.map((cat) => {
                  const Icon = iconFor(cat.icon);
                  return (
                    <li key={cat.id}>
                      <Link
                        href={`/categoria/${cat.id}`}
                        className="flex w-28 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:bg-secondary/30"
                      >
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-primary"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="line-clamp-2 text-[11px] font-medium leading-tight">
                          {cat.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
