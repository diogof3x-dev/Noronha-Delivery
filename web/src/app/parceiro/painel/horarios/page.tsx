import { redirect } from "next/navigation";
import { CalendarDays, Trash2, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { CreateSlotForm } from "./create-form";
import { deleteServiceSlot, toggleSlotActive } from "@/app/actions/service-bookings";

export const dynamic = "force-dynamic";

export default async function PainelHorarios() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase.from("businesses").select("id, name").eq("type", "servico");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery.order("name");

  const bizIds = (businesses ?? []).map((b) => b.id);

  const { data: services } = bizIds.length
    ? await supabase
        .from("services")
        .select("id, name, business_id, duration_minutes")
        .in("business_id", bizIds)
        .eq("kind", "service")
        .order("name")
    : { data: [] };

  const { data: slots } = bizIds.length
    ? await supabase
        .from("service_slots")
        .select(
          "id, service_id, business_id, start_at, duration_minutes, capacity, booked_count, staff_name, is_active, services(name)",
        )
        .in("business_id", bizIds)
        .gte("start_at", new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString())
        .order("start_at", { ascending: true })
    : { data: [] };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Horários
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Agenda de horários</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cada slot é um horário disponível. Pode ter capacidade 1 (1-1) ou mais (grupo).
        </p>
      </header>

      {!services?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Cadastre um serviço em <strong>Serviços</strong> antes de criar horários.
        </div>
      ) : (
        <CreateSlotForm services={services} />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Próximos horários ({slots?.length ?? 0})
        </h2>
        {!slots?.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem horários nos próximos dias.
          </p>
        ) : (
          <ul className="space-y-2">
            {slots.map((s) => {
              const svc = s.services as { name?: string } | null;
              const spots = Math.max(0, s.capacity - s.booked_count);
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
                    <p className="text-sm font-semibold">{svc?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.start_at).toLocaleString("pt-BR")} · {s.duration_minutes} min
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {s.booked_count} / {s.capacity} · {spots} vaga{spots === 1 ? "" : "s"}
                    </p>
                    {s.staff_name && (
                      <p className="mt-1 text-[11px] text-muted-foreground">Atendente: {s.staff_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={toggleSlotActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="is_active" value={s.is_active ? "false" : "true"} />
                      <Button type="submit" size="sm" variant="outline" className="h-8">
                        {s.is_active ? "Pausar" : "Ativar"}
                      </Button>
                    </form>
                    <form action={deleteServiceSlot}>
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
