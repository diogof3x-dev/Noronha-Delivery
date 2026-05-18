import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Megaphone, Tag, TrendingUp } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { CouponForm } from "./coupon-form";
import { BannerForm } from "./banner-form";
import { BoostForm } from "./boost-form";
import { deleteCoupon, toggleCoupon, pauseBoost } from "@/app/actions/promotions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const BOOST_LABEL: Record<string, string> = {
  home_feature: "Destaque na home",
  category_top: "Topo da categoria",
  banner: "Banner na vitrine",
};

export default async function PainelPromocoes() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, type, banner_text, banner_cta_label, banner_cta_url, banner_color",
    )
    .eq("owner_id", user.id);

  if (!businesses?.length) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Cadastre uma loja em{" "}
        <Link href="/parceiro/painel/loja" className="text-primary underline">
          Minha loja
        </Link>{" "}
        primeiro.
      </div>
    );
  }

  const business = businesses[0];

  const [{ data: coupons }, { data: boosts }] = await Promise.all([
    supabase
      .from("business_coupons")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_boosts")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Promoções
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {business.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          Cupons, boost de destaque na vitrine e banner customizável da loja.
        </p>
      </header>

      {/* ============ BANNER ============ */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Megaphone className="h-4 w-4 text-[color:var(--sun)]" />
          Banner promocional
        </h2>
        <p className="text-xs text-muted-foreground">
          Aparece no topo da sua vitrine pública. Use pra anunciar happy hour, frete
          grátis, prato do dia, etc.
        </p>
        <BannerForm
          businessId={business.id}
          initial={{
            text: business.banner_text ?? "",
            ctaLabel: business.banner_cta_label ?? "",
            ctaUrl: business.banner_cta_url ?? "",
            color: business.banner_color ?? "#0B7FA8",
          }}
        />
      </section>

      {/* ============ CUPONS ============ */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Tag className="h-4 w-4" />
          Cupons da loja
        </h2>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold">Criar novo</h3>
          <CouponForm businessId={business.id} />
        </div>

        {!coupons?.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum cupom criado. Use cupons pra atrair clientes novos.
          </p>
        ) : (
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li
                key={c.id}
                className={`rounded-2xl border p-4 ${
                  c.is_active ? "border-border bg-card" : "border-border bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-lg font-bold tracking-wider">
                        {c.code}
                      </span>
                      <span className="rounded-full bg-[color:var(--sun)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--sun)]">
                        {c.discount_kind === "percent"
                          ? `${c.discount_value}% OFF`
                          : `R$ ${(c.discount_value / 100).toFixed(2)} OFF`}
                      </span>
                      {c.first_order_only && (
                        <span className="text-[10px] text-muted-foreground">· 1ª compra</span>
                      )}
                    </p>
                    {c.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Usado {c.uses_count}× {c.max_uses ? `de ${c.max_uses}` : ""}
                      {c.min_subtotal_cents
                        ? ` · pedido mín. ${formatCents(c.min_subtotal_cents)}`
                        : ""}
                      {c.ends_at
                        ? ` · expira ${new Date(c.ends_at).toLocaleDateString("pt-BR")}`
                        : " · sem validade"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={toggleCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="business_id" value={business.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={c.is_active ? "false" : "true"}
                      />
                      <Button size="sm" variant="outline" type="submit">
                        {c.is_active ? "Pausar" : "Ativar"}
                      </Button>
                    </form>
                    <form action={deleteCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="business_id" value={business.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Excluir
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ============ BOOST ============ */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Boost de destaque (em breve cobrado)
        </h2>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold">Comprar boost</h3>
          <BoostForm businessId={business.id} />
          <p className="mt-3 text-[10px] text-muted-foreground">
            ⚠️ Em modo de teste — boost é gravado mas não cobra ainda. Cobrança será
            integrada na próxima sprint.
          </p>
        </div>

        {(boosts?.length ?? 0) > 0 && (
          <ul className="space-y-2">
            {boosts!.map((b) => (
              <li
                key={b.id}
                className={`rounded-2xl border p-3 text-sm ${
                  b.status === "active" ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {BOOST_LABEL[b.kind]}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.status === "active"
                            ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.status}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Até {new Date(b.ends_at).toLocaleDateString("pt-BR")}
                      {b.daily_budget_cents
                        ? ` · ${formatCents(b.daily_budget_cents)}/dia`
                        : ""}
                    </p>
                  </div>
                  {b.status === "active" && (
                    <form action={pauseBoost}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="business_id" value={business.id} />
                      <input type="hidden" name="status" value="paused" />
                      <Button size="sm" variant="outline" type="submit">
                        Pausar
                      </Button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
