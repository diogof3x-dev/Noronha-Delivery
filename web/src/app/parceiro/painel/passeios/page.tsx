import Image from "next/image";
import { redirect } from "next/navigation";
import { Sailboat } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile"
import { getMerchantScope } from "@/lib/merchant-scope";
import { formatCents } from "@/lib/format";
import { CreateTourForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function PainelPasseios() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const scope = await getMerchantScope(supabase, user.id, profile);
  const isAdmin = scope.showAll;

  let bizQuery = supabase
    .from("businesses")
    .select("id, name")
    .eq("type", "operador_passeio");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery.order("name");

  type Tour = {
    id: string;
    business_id: string;
    name: string;
    description: string | null;
    price_cents: number;
    duration_minutes: number | null;
    capacity: number | null;
    image_url: string | null;
    is_active: boolean;
  };

  const bizIds = (businesses ?? []).map((b) => b.id);
  const tours: Tour[] = bizIds.length
    ? ((
        await supabase
          .from("services")
          .select(
            "id, business_id, name, description, price_cents, duration_minutes, capacity, image_url, is_active",
          )
          .in("business_id", bizIds)
          .eq("kind", "tour")
          .order("business_id")
          .order("position")
      ).data as Tour[] | null) ?? []
    : [];

  const byBusiness: Record<string, Tour[]> = {};
  for (const t of tours) (byBusiness[t.business_id] ??= []).push(t);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Operação de passeios
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {isAdmin ? "Passeios da plataforma" : "Seus passeios"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cadastre cada tipo de passeio (Ilha Tour, Mergulho, Trilha) com preço por pessoa,
          duração e capacidade padrão. Os horários você cria em <strong>Agenda</strong>.
        </p>
      </header>

      {!businesses?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">Nenhuma operação cadastrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie sua operação em <strong>Minha loja</strong> com tipo{" "}
            <em>Operador de passeio</em>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((b) => {
            const list = byBusiness[b.id] ?? [];
            return (
              <section key={b.id} className="space-y-3">
                <header>
                  <h2 className="text-base font-semibold">{b.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {list.length} passeio{list.length === 1 ? "" : "s"}
                  </p>
                </header>

                {list.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <Sailboat className="h-5 w-5" />
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Sem passeios cadastrados ainda.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {list.map((t) => (
                      <li
                        key={t.id}
                        className={`flex flex-wrap items-start gap-3 rounded-2xl border border-border bg-card p-3 ${
                          !t.is_active ? "opacity-60" : ""
                        }`}
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                          {t.image_url ? (
                            <Image src={t.image_url} alt={t.name} fill className="object-cover" sizes="80px" unoptimized />
                          ) : (
                            <Sailboat className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {t.description ?? "—"}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {t.duration_minutes ? `${t.duration_minutes} min` : "Duração não informada"}
                            {t.capacity ? ` · Até ${t.capacity} pax` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold">
                          {formatCents(t.price_cents)}
                          <span className="text-[10px] font-normal text-muted-foreground"> /pessoa</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <CreateTourForm businessId={b.id} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
