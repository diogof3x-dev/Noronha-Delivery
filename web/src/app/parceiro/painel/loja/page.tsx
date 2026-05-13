import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, Store } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";
import { CreateBusinessForm } from "./create-form";
import { EditBusinessForm } from "./edit-form";
import { ToggleOpenButton } from "./toggle-open";

export const dynamic = "force-dynamic";

type OpeningHours = Record<string, { open?: string; close?: string; closed?: boolean }>;

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
      "id, name, slug, type, district, address, description, whatsapp, delivery_fee_cents, min_order_cents, avg_prep_minutes, is_active, is_verified, is_eco_certified, opening_hours",
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
        <CreateBusinessForm defaultName={profile?.full_name ?? undefined} />
      ) : (
        <div className="space-y-5">
          {businesses.map((b) => {
            const hours = (b.opening_hours as OpeningHours | null) ?? {};
            return (
              <section key={b.id} className="space-y-3">
                <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
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
                      {b.type} · {b.district ?? "—"} · {b.avg_prep_minutes ?? "—"}min ·{" "}
                      {b.delivery_fee_cents != null ? formatCents(b.delivery_fee_cents) : "frete a calcular"}
                    </p>
                  </div>
                  <ToggleOpenButton id={b.id} isActive={b.is_active} />
                </header>

                <details className="group rounded-2xl border border-border bg-card">
                  <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold">
                    Editar detalhes da loja
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-border p-4">
                    <EditBusinessForm
                      id={b.id}
                      defaults={{
                        description: b.description,
                        whatsapp: b.whatsapp,
                        district: b.district,
                        address: b.address,
                        delivery_fee_cents: b.delivery_fee_cents,
                        min_order_cents: b.min_order_cents,
                        avg_prep_minutes: b.avg_prep_minutes,
                        opening_hours: hours,
                      }}
                    />
                  </div>
                </details>

                <Link
                  href={`/app/restaurante/${b.slug ?? b.id}`}
                  target="_blank"
                  className="text-xs text-primary hover:underline"
                >
                  Ver loja como cliente ↗
                </Link>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
