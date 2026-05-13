import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Store } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelLoja() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase
    .from("businesses")
    .select(
      "id, name, slug, type, district, description, delivery_fee_cents, min_order_cents, avg_prep_minutes, is_active, is_verified, is_eco_certified",
    );
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery.order("name");

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {isAdmin ? "Todas as lojas" : "Minha loja"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {isAdmin ? `${(businesses ?? []).length} lojas na plataforma` : "Sua loja"}
        </h1>
      </header>

      {!businesses?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Store className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhuma loja cadastrada</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Sua conta está aprovada, mas a loja em si ainda não foi criada. Fale com o
            suporte pelo WhatsApp pra liberarmos o cadastro completo.
          </p>
          <a
            href="https://wa.me/5581988880000"
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            Falar com suporte
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {businesses.map((b) => (
            <li key={b.id}>
              <Link
                href={`/restaurante/${b.slug ?? b.id}`}
                target="_blank"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Store className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {b.name}
                    {b.is_eco_certified && (
                      <span className="ml-2 inline-block rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                        Eco
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.type} · {b.district} · {b.avg_prep_minutes ?? "—"}min ·{" "}
                    {b.delivery_fee_cents != null ? formatCents(b.delivery_fee_cents) : "frete a calcular"}
                  </p>
                </div>
                <span className={
                  "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                  (b.is_active
                    ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                    : "bg-muted text-muted-foreground")
                }>
                  {b.is_active ? "Ativa" : "Pausada"}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Em breve: editar loja (nome, descrição, fotos, horários, política de cancelamento),
        gerenciar bairros de entrega, configurar PIX, ativar/desativar.
      </div>
    </div>
  );
}
