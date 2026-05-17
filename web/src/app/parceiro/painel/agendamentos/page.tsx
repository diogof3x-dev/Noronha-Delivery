import { redirect } from "next/navigation";
import { CalendarCheck, Sparkles } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  requested: "Solicitado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
  no_show: "Não compareceu",
};

const STATUS_TONE: Record<string, string> = {
  requested: "bg-[color:var(--sun)]/15 text-[color:var(--sun)]",
  confirmed: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
  completed: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-destructive/15 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

export default async function PainelAgendamentos() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase.from("businesses").select("id, name").eq("type", "servico");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;

  const bizIds = (businesses ?? []).map((b) => b.id);
  const { data: bookings } = bizIds.length
    ? await supabase
        .from("service_bookings")
        .select(
          "id, code, status, payment_status, customer_name, customer_whatsapp, total_cents, services(name), service_slots(start_at, staff_name)",
        )
        .in("business_id", bizIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Serviços
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Agendamentos</h1>
      </header>

      {!bookings?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Sem agendamentos ainda</h2>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => {
            const svc = b.services as { name?: string } | null;
            const slot = b.service_slots as { start_at?: string; staff_name?: string } | null;
            return (
              <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      #{b.code}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[b.status]}`}>
                        {STATUS[b.status]}
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
                      <strong>{svc?.name ?? "—"}</strong>
                      <CalendarCheck className="ml-2 mr-1 inline h-3 w-3" />
                      {slot?.start_at && new Date(slot.start_at).toLocaleString("pt-BR")}
                      {slot?.staff_name ? ` · ${slot.staff_name}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{formatCents(b.total_cents)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
