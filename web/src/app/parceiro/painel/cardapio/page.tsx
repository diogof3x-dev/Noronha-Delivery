import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UtensilsCrossed } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardapioItemRow } from "./item-row";

export const dynamic = "force-dynamic";

export default async function PainelCardapio() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let businessQuery = supabase.from("businesses").select("id, name");
  if (!isAdmin) businessQuery = businessQuery.eq("owner_id", user.id);
  const { data: businesses } = await businessQuery;

  type ServiceRow = {
    id: string;
    business_id: string;
    name: string;
    description: string | null;
    price_cents: number;
    kind: string;
    is_active: boolean;
    position: number;
    image_url: string | null;
  };

  const ids = (businesses ?? []).map((b) => b.id);
  const services: ServiceRow[] = ids.length
    ? (
        await supabase
          .from("services")
          .select(
            "id, business_id, name, description, price_cents, kind, is_active, position, image_url",
          )
          .in("business_id", ids)
          .order("business_id")
          .order("position", { ascending: true })
      ).data ?? []
    : [];

  const byBusiness: Record<string, ServiceRow[]> = {};
  for (const s of services) {
    (byBusiness[s.business_id] ??= []).push(s);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Cardápio
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {isAdmin ? "Catálogo da plataforma" : "Seu catálogo"}
          </h1>
        </div>
        <Link
          href="/parceiro/painel/cardapio/novo"
          className={cn(buttonVariants(), "h-10 px-4")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar itens
        </Link>
      </header>

      {!businesses?.length ? (
        <EmptyState message="Nenhuma loja vinculada ainda. Quando você for credenciado e tiver loja criada, o cardápio aparece aqui." />
      ) : (businesses ?? []).map((b) => {
        const items = byBusiness[b.id] ?? [];
        return (
          <section key={b.id} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {b.name} · {items.length} itens
            </h2>
            {items.length === 0 ? (
              <EmptyState message="Cardápio vazio. Use o botão acima pra subir itens (manual, em lote ou importando)." />
            ) : (
              <ul className="space-y-2">
                {items.map((s) => (
                  <CardapioItemRow
                    key={s.id}
                    id={s.id}
                    name={s.name}
                    description={s.description}
                    priceCents={s.price_cents}
                    imageUrl={s.image_url}
                    isActive={s.is_active}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Em breve: upload de fotos direto, drag-to-reorder, seções e controle de estoque.
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <UtensilsCrossed className="h-5 w-5" />
      </span>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
