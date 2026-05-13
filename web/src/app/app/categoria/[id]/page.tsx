import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { BusinessCard } from "@/components/app/business-card";
import { iconFor } from "@/lib/category-icon";

type BusinessMeta = { cuisine?: string; hero_color?: string };

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: id.replace(/-/g, " ") };
}

export default async function CategoriaPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, label, group_id, icon")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, district, logo_url, is_eco_certified, avg_prep_minutes, delivery_fee_cents, metadata",
    )
    .eq("category_id", id)
    .eq("is_active", true)
    .order("name");

  const Icon = iconFor(category.icon);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-bold tracking-tight">{category.label}</h1>
        </div>
      </div>

      {(businesses ?? []).length > 0 ? (
        <ul className="space-y-3">
          {businesses!.map((b) => {
            const meta = (b.metadata as BusinessMeta | null) ?? {};
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
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-4 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Construction className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h2 className="font-semibold">Em breve nesta categoria</h2>
            <p className="text-sm text-muted-foreground">
              Estamos cadastrando parceiros de {category.label.toLowerCase()} em Fernando de
              Noronha. Quer ser o primeiro?
            </p>
          </div>
          <Link
            href="/sou-comercio"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Cadastrar meu negócio
          </Link>
        </div>
      )}
    </div>
  );
}
