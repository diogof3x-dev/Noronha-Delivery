import { redirect } from "next/navigation";
import Image from "next/image";
import { BedDouble, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";
import { CreateRoomForm } from "./create-form";
import { RoomActions } from "./room-actions";

export const dynamic = "force-dynamic";

export default async function PainelQuartos() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase
    .from("businesses")
    .select("id, name, type")
    .in("type", ["pousada", "residencia"]);
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery.order("name");

  type Room = {
    id: string;
    business_id: string;
    name: string;
    description: string | null;
    capacity: number;
    price_per_night_cents: number;
    bed_layout: string | null;
    amenities: string[];
    photos: string[];
    is_active: boolean;
  };

  const bizIds = (businesses ?? []).map((b) => b.id);
  const rooms: Room[] = bizIds.length
    ? ((
        await supabase
          .from("rooms")
          .select(
            "id, business_id, name, description, capacity, price_per_night_cents, bed_layout, amenities, photos, is_active, position",
          )
          .in("business_id", bizIds)
          .order("business_id")
          .order("position")
      ).data as Room[] | null) ?? []
    : [];

  const byBusiness: Record<string, Room[]> = {};
  for (const r of rooms) {
    (byBusiness[r.business_id] ??= []).push(r);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Hospedagem
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {isAdmin ? "Quartos da plataforma" : "Seus quartos"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cadastre cada categoria de quarto (Standard, Luxo, Suíte) com capacidade, valor
          por noite e fotos. Os hóspedes selecionam datas e a disponibilidade é calculada em
          tempo real.
        </p>
      </header>

      {!businesses?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">Nenhuma pousada vinculada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie sua pousada primeiro em <strong>Minha loja</strong> com tipo
            <em> Pousada / hospedagem</em>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((b) => {
            const list = byBusiness[b.id] ?? [];
            return (
              <section key={b.id} className="space-y-3">
                <header className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{b.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {list.length} quarto{list.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </header>

                {list.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <BedDouble className="h-5 w-5" />
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Nenhum quarto cadastrado nesta pousada ainda.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {list.map((r) => {
                      const photo = r.photos?.[0];
                      return (
                        <li
                          key={r.id}
                          className={`flex flex-wrap items-start gap-3 rounded-2xl border border-border bg-card p-3 ${
                            !r.is_active ? "opacity-60" : ""
                          }`}
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                            {photo ? (
                              <Image
                                src={photo}
                                alt={r.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                                unoptimized
                              />
                            ) : (
                              <BedDouble className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                              {r.name}
                              {!r.is_active && (
                                <span className="ml-2 text-[10px] text-muted-foreground">
                                  (pausado)
                                </span>
                              )}
                            </p>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {r.description ?? "—"}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Users className="h-3 w-3" /> Até {r.capacity}
                              {r.bed_layout ? ` · ${r.bed_layout}` : ""}
                            </p>
                            {r.amenities?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {r.amenities.slice(0, 4).map((a) => (
                                  <span
                                    key={a}
                                    className="rounded-full bg-secondary px-2 py-0.5 text-[10px]"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="text-sm font-bold">
                              {formatCents(r.price_per_night_cents)}
                              <span className="text-[10px] font-normal text-muted-foreground"> /noite</span>
                            </span>
                            <RoomActions
                              id={r.id}
                              defaults={{
                                name: r.name,
                                description: r.description ?? "",
                                capacity: String(r.capacity),
                                price_per_night_brl: (r.price_per_night_cents / 100)
                                  .toFixed(2)
                                  .replace(".", ","),
                                bed_layout: r.bed_layout ?? "",
                                amenities: (r.amenities ?? []).join(", "),
                                photo_url: photo ?? "",
                              }}
                              isActive={r.is_active}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <CreateRoomForm businessId={b.id} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
