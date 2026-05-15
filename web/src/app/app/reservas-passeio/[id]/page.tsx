import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Sailboat, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { PixPanel } from "@/app/app/pedidos/[id]/pix-panel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Solicitada · aguardando pagamento",
  confirmed: "Confirmada! Te esperamos.",
  completed: "Passeio concluído",
  cancelled: "Cancelada",
  refunded: "Estornada",
  no_show: "Não compareceu",
};

type Meta = {
  pix_qr?: string | null;
  pix_copy?: string | null;
  pix_expires?: string | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function ReservaPasseio({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/app/reservas-passeio/${id}`);

  const { data: booking } = await supabase
    .from("tour_bookings")
    .select(
      "id, code, status, payment_status, payment_method, delivery_code, customer_name, customer_whatsapp, pax_count, unit_price_cents, total_cents, metadata, businesses(name, whatsapp, district), services(name, image_url, duration_minutes), tour_sessions(start_at, meeting_point, notes)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const meta = (booking.metadata as Meta | null) ?? {};
  const tour = booking.services as { name?: string; image_url?: string; duration_minutes?: number } | null;
  const session = booking.tour_sessions as { start_at?: string; meeting_point?: string; notes?: string } | null;
  const business = booking.businesses as { name?: string; whatsapp?: string; district?: string } | null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app/pedidos"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Reserva</p>
          <h1 className="text-base font-bold tracking-tight">#{booking.code}</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <Sailboat className="h-4 w-4 text-primary" />
          {STATUS_LABEL[booking.status] ?? booking.status}
        </p>
        {booking.payment_status === "pending" && booking.payment_method === "pix" && (
          <p className="mt-1 text-xs text-muted-foreground">
            Aguardando pagamento PIX pra confirmar a reserva.
          </p>
        )}
      </section>

      {booking.payment_method === "pix" && booking.payment_status !== "paid" && meta.pix_copy && (
        <PixPanel
          qrCodeBase64={meta.pix_qr ?? null}
          copyPaste={meta.pix_copy}
          expiresAt={meta.pix_expires ?? null}
          totalCents={booking.total_cents}
        />
      )}

      {booking.delivery_code && booking.payment_status === "paid" && (
        <section className="rounded-2xl border-2 border-[color:var(--turtle)]/60 bg-[color:var(--turtle)]/5 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
            Código do passageiro
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em]">
            {booking.delivery_code}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Mostre esse código pra operadora no embarque pra confirmar sua presença.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Operadora
        </h2>
        <p className="mt-1 text-base font-bold tracking-tight">{business?.name ?? "—"}</p>
        {business?.district && <p className="mt-1 text-xs text-muted-foreground">{business.district}</p>}
        {business?.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Falar com a operadora ↗
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Passeio
        </h2>
        <p className="text-base font-bold">{tour?.name ?? "—"}</p>
        <p className="mt-1 text-xs">
          {session?.start_at ? new Date(session.start_at).toLocaleString("pt-BR") : "—"}
          {tour?.duration_minutes ? ` · ${tour.duration_minutes} min` : ""}
        </p>
        {session?.meeting_point && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="font-medium">Ponto de encontro:</span> {session.meeting_point}
          </p>
        )}
        {session?.notes && (
          <p className="mt-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs">{session.notes}</p>
        )}
        <p className="mt-2 inline-flex items-center gap-1 text-xs">
          <Users className="h-3 w-3" /> {booking.pax_count} pax
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Valores
        </h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {formatCents(booking.unit_price_cents)} × {booking.pax_count} pax
            </span>
            <span>{formatCents(booking.unit_price_cents * booking.pax_count)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
            <span>Total</span>
            <span>{formatCents(booking.total_cents)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
