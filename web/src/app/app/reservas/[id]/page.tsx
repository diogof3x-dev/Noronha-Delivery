import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarCheck, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { PixPanel } from "@/app/app/pedidos/[id]/pix-panel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  hold: "Aguardando confirmação",
  requested: "Aguardando aprovação da pousada",
  confirmed: "Confirmada! Te esperamos.",
  checked_in: "Hospedado",
  checked_out: "Estadia finalizada",
  cancelled: "Reserva cancelada",
  refunded: "Reserva estornada",
};

type BookingMeta = {
  pix_qr?: string | null;
  pix_copy?: string | null;
  pix_expires?: string | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function ReservaDetalhe({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/app/reservas/${id}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, code, status, payment_status, payment_method, customer_name, customer_email, customer_whatsapp, guests, check_in, check_out, nights, nightly_cents, total_cents, platform_fee_cents, metadata, businesses(name, slug, address, district, whatsapp), rooms(name, photos, bed_layout)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const meta = (booking.metadata as BookingMeta | null) ?? {};
  const room = booking.rooms as { name?: string; photos?: string[]; bed_layout?: string } | null;
  const business = booking.businesses as {
    name?: string;
    slug?: string;
    address?: string;
    district?: string;
    whatsapp?: string;
  } | null;

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
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Reserva
          </p>
          <h1 className="text-base font-bold tracking-tight">#{booking.code}</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <CalendarCheck className="h-4 w-4 text-primary" />
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

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pousada
        </h2>
        <p className="mt-1 text-base font-bold tracking-tight">{business?.name ?? "—"}</p>
        {business?.address && <p className="mt-1 text-xs text-muted-foreground">{business.address}</p>}
        {business?.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Falar com a pousada no WhatsApp ↗
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <BedDouble className="h-3.5 w-3.5" /> Quarto
        </h2>
        <p className="text-base font-bold">{room?.name ?? "—"}</p>
        {room?.bed_layout && <p className="text-xs text-muted-foreground">{room.bed_layout}</p>}
        <p className="mt-2 inline-flex items-center gap-1 text-xs">
          <Users className="h-3 w-3" /> {booking.guests} hóspede{booking.guests === 1 ? "" : "s"}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estadia
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Check-in</p>
            <p className="text-sm font-bold">{new Date(booking.check_in).toLocaleDateString("pt-BR")}</p>
            <p className="text-[11px] text-muted-foreground">A partir das 14h</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Check-out</p>
            <p className="text-sm font-bold">{new Date(booking.check_out).toLocaleDateString("pt-BR")}</p>
            <p className="text-[11px] text-muted-foreground">Até 11h</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {booking.nights} noite{booking.nights === 1 ? "" : "s"}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Valores
        </h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {formatCents(booking.nightly_cents)} × {booking.nights} noite{booking.nights === 1 ? "" : "s"}
            </span>
            <span>{formatCents(booking.nightly_cents * booking.nights)}</span>
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
