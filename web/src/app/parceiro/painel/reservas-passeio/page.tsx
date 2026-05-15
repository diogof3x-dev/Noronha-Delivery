import { redirect } from "next/navigation";
import { CalendarCheck, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  refunded: "Estornada",
  no_show: "No-show",
  completed: "Concluída",
};

const STATUS_TONE: Record<string, string> = {
  requested: "bg-[color:var(--sun)]/15 text-[color:var(--sun)]",
  confirmed: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
  completed: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-destructive/15 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

export default async function PainelReservasPasseio() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase
    .from("businesses")
    .select("id, name")
    .eq("type", "operador_passeio");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;

  const bizIds = (businesses ?? []).map((b) => b.id);
  const { data: bookings } = bizIds.length
    ? await supabase
        .from("tour_bookings")
        .select(
          "id, code, status, payment_status, customer_name, customer_whatsapp, pax_count, total_cents, created_at, services(name), tour_sessions(start_at, meeting_point)",
        )
        .in("business_id", bizIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Passeios
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
      </header>

      {!bookings?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhuma reserva ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Cadastre passeios + sessões na <strong>Agenda</strong> e libere o público.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => {
            const tour = b.services as { name?: string } | null;
            const session = b.tour_sessions as { start_at?: string; meeting_point?: string } | null;
            return (
              <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      #{b.code}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[b.status]}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                      {b.payment_status === "paid" && (
                        <span className="text-[10px] text-[color:var(--turtle)]">PAGO</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.customer_name}
                      {b.customer_whatsapp ? ` · ${b.customer_whatsapp}` : ""}
                    </p>
                    <p className="mt-1 text-xs">
                      <strong>{tour?.name ?? "—"}</strong>
                      {session?.start_at &&
                        ` · ${new Date(session.start_at).toLocaleString("pt-BR")}`}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" /> {b.pax_count} pax
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">
                    {formatCents(b.total_cents)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
