import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  hold: "Bloqueio",
  requested: "Solicitada",
  confirmed: "Confirmada",
  checked_in: "Check-in",
  checked_out: "Check-out",
  cancelled: "Cancelada",
  refunded: "Estornada",
};

const STATUS_TONE: Record<string, string> = {
  hold: "bg-muted text-muted-foreground",
  requested: "bg-[color:var(--sun)]/15 text-[color:var(--sun)]",
  confirmed: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
  checked_in: "bg-primary/15 text-primary",
  checked_out: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-destructive/15 text-destructive",
};

export default async function PainelReservas() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase.from("businesses").select("id, name, type").in("type", ["pousada", "residencia"]);
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;
  const bizIds = (businesses ?? []).map((b) => b.id);

  const { data: bookings } = bizIds.length
    ? await supabase
        .from("bookings")
        .select(
          "id, code, status, payment_status, customer_name, customer_whatsapp, check_in, check_out, nights, guests, total_cents, room_id, business_id, rooms(name), businesses(name), external_source, created_at",
        )
        .in("business_id", bizIds)
        .order("check_in", { ascending: true })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Hospedagem
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Solicitações de hóspedes via plataforma + bloqueios sincronizados do Booking e
          Airbnb (em breve). Confirme ou recuse com 1 clique.
        </p>
      </header>

      {!bookings?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhuma reserva ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Cadastre seus quartos em <strong>Quartos</strong> e o público de Noronha pode
            reservar pelo app.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => {
            const room = b.rooms as { name?: string } | null;
            const biz = b.businesses as { name?: string } | null;
            const checkIn = new Date(b.check_in).toLocaleDateString("pt-BR");
            const checkOut = new Date(b.check_out).toLocaleDateString("pt-BR");
            return (
              <li key={b.id} className="flex flex-wrap items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    #{b.code}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                    {b.external_source && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase">
                        {b.external_source}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.customer_name}
                    {b.customer_whatsapp ? ` · ${b.customer_whatsapp}` : ""}
                    {isAdmin && biz?.name ? ` · ${biz.name}` : ""}
                  </p>
                  <p className="mt-1 text-xs">
                    {room?.name ?? "—"} · {b.guests} hóspede{b.guests > 1 ? "s" : ""}
                    {" · "}
                    <strong>{checkIn} → {checkOut}</strong> ({b.nights} noite{b.nights > 1 ? "s" : ""})
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0">{formatCents(b.total_cents)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
