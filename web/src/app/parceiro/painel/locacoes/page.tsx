import { redirect } from "next/navigation";
import { Bike, CalendarCheck } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile"
import { getMerchantScope } from "@/lib/merchant-scope";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  active: "Em uso",
  returned: "Devolvido",
  cancelled: "Cancelada",
  refunded: "Estornada",
  late: "Atrasado",
};

const STATUS_TONE: Record<string, string> = {
  requested: "bg-[color:var(--sun)]/15 text-[color:var(--sun)]",
  confirmed: "bg-primary/15 text-primary",
  active: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
  returned: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-destructive/15 text-destructive",
  late: "bg-destructive/15 text-destructive",
};

export default async function PainelLocacoes() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const scope = await getMerchantScope(supabase, user.id, profile);
  const isAdmin = scope.showAll;

  let bizQuery = supabase.from("businesses").select("id, name").eq("type", "locadora");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;

  const bizIds = (businesses ?? []).map((b) => b.id);
  const { data: bookings } = bizIds.length
    ? await supabase
        .from("rental_bookings")
        .select(
          "id, code, status, payment_status, customer_name, customer_whatsapp, customer_document, pickup_at, return_at, total_days, total_cents, services(name)",
        )
        .in("business_id", bizIds)
        .order("pickup_at", { ascending: true })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Aluguel
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Locações</h1>
      </header>

      {!bookings?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Bike className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Sem locações ainda</h2>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => {
            const svc = b.services as { name?: string } | null;
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
                      {b.customer_document ? ` · CNH ${b.customer_document}` : ""}
                    </p>
                    <p className="mt-1 text-xs">
                      <strong>{svc?.name ?? "—"}</strong>
                      {" · "}
                      <CalendarCheck className="mr-1 inline h-3 w-3" />
                      {new Date(b.pickup_at).toLocaleString("pt-BR")} →{" "}
                      {new Date(b.return_at).toLocaleString("pt-BR")}
                      {" "}({b.total_days} dia{b.total_days === 1 ? "" : "s"})
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
