import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UtensilsCrossed } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardapioCatalog, type CatalogService } from "./catalog-view";

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

  const ids = (businesses ?? []).map((b) => b.id);
  const services: CatalogService[] = ids.length
    ? ((
        await supabase
          .from("services")
          .select(
            "id, business_id, name, description, price_cents, original_price_cents, kind, is_active, position, image_url, section, is_featured, serves_people",
          )
          .in("business_id", ids)
          .order("business_id")
          .order("section", { ascending: true, nullsFirst: false })
          .order("position", { ascending: true })
      ).data as CatalogService[] | null) ?? []
    : [];

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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            Nenhuma loja vinculada ainda. Crie uma em <strong>Minha loja</strong>.
          </p>
        </div>
      ) : (
        <CardapioCatalog businesses={businesses} services={services} />
      )}
    </div>
  );
}
