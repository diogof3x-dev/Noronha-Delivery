import { Ticket, Trash2 } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { toggleCoupon, deleteCoupon } from "@/app/actions/coupons-admin";
import { CreateCouponForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function SuperAdminCupons() {
  const supabase = await getServerClient();

  const [{ data: coupons }, { data: businesses }] = await Promise.all([
    supabase
      .from("coupons")
      .select(
        "id, code, kind, value_int, min_subtotal_cents, max_discount_cents, business_id, starts_at, ends_at, max_uses, used_count, is_active, notes, created_at, businesses(name)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("businesses").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Cupons</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cupons aparecem pro cliente no checkout. Use percentual com teto pra promoções
          gerais, valor fixo pra recompensas específicas.
        </p>
      </header>

      <CreateCouponForm businesses={businesses ?? []} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Cupons cadastrados ({(coupons ?? []).length})
        </h2>
        {!coupons?.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Ticket className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              Nenhum cupom criado ainda.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {coupons.map((c) => {
              const business = c.businesses as { name?: string } | null;
              const valueLabel =
                c.kind === "percent" ? `${(c.value_int / 100).toFixed(2)}%` : formatCents(c.value_int);
              return (
                <li
                  key={c.id}
                  className={`flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 ${
                    !c.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-mono">
                        {c.code}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {valueLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {business?.name ? `Loja: ${business.name}` : "Plataforma"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.min_subtotal_cents > 0 && `Mín ${formatCents(c.min_subtotal_cents)} · `}
                      {c.max_discount_cents
                        ? `Teto ${formatCents(c.max_discount_cents)} · `
                        : ""}
                      {c.starts_at
                        ? new Date(c.starts_at).toLocaleDateString("pt-BR")
                        : "Sem início"}
                      {" → "}
                      {c.ends_at ? new Date(c.ends_at).toLocaleDateString("pt-BR") : "Sem fim"}
                      {" · "}
                      Usado {c.used_count}
                      {c.max_uses ? `/${c.max_uses}` : ""}
                    </p>
                    {c.notes && <p className="mt-1 text-xs">{c.notes}</p>}
                  </div>
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="is_active" value={c.is_active ? "false" : "true"} />
                    <Button variant="outline" size="sm" type="submit" className="h-8">
                      {c.is_active ? "Pausar" : "Ativar"}
                    </Button>
                  </form>
                  <form action={deleteCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      aria-label="Excluir"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
