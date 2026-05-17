import { redirect } from "next/navigation";
import { CalendarDays, Trash2, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile"
import { getMerchantScope } from "@/lib/merchant-scope";
import { Button } from "@/components/ui/button";
import { CreateSessionForm } from "./create-form";
import { deleteTourSession, toggleSessionActive } from "@/app/actions/tours";

export const dynamic = "force-dynamic";

function formatBrDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PainelAgenda() {
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

  const bizIds = (businesses ?? []).map((b) => b.id);

  const { data: tours } = bizIds.length
    ? await supabase
        .from("services")
        .select("id, name, business_id, capacity")
        .in("business_id", bizIds)
        .eq("kind", "tour")
        .order("name")
    : { data: [] };

  const { data: sessions } = bizIds.length
    ? await supabase
        .from("tour_sessions")
        .select(
          "id, service_id, business_id, start_at, capacity, sold_pax, is_active, meeting_point, notes, services(name)",
        )
        .in("business_id", bizIds)
        .gte("start_at", new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString())
        .order("start_at", { ascending: true })
    : { data: [] };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Agenda
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Sessões dos passeios
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cada sessão é uma saída marcada (data + hora + vagas). Os clientes só conseguem
          reservar sessões ativas com vagas restantes.
        </p>
      </header>

      {!tours?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Cadastre um passeio em <strong>Passeios</strong> antes de criar a agenda.
        </div>
      ) : (
        <CreateSessionForm tours={tours} />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Próximas sessões ({sessions?.length ?? 0})
        </h2>
        {!sessions?.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem sessões nos próximos dias. Crie acima.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const tour = s.services as { name?: string } | null;
              const spots = Math.max(0, s.capacity - s.sold_pax);
              return (
                <li
                  key={s.id}
                  className={`flex flex-wrap items-start gap-3 rounded-2xl border border-border bg-card p-4 ${
                    !s.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{tour?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatBrDateTime(s.start_at)}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {s.sold_pax} / {s.capacity} pax · {spots} vaga{spots === 1 ? "" : "s"}
                    </p>
                    {s.meeting_point && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Ponto de encontro: {s.meeting_point}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={toggleSessionActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="is_active" value={s.is_active ? "false" : "true"} />
                      <Button type="submit" size="sm" variant="outline" className="h-8">
                        {s.is_active ? "Pausar" : "Ativar"}
                      </Button>
                    </form>
                    <form action={deleteTourSession}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        aria-label="Excluir"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
