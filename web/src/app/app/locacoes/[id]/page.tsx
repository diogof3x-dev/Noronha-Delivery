import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bike, CalendarDays, MapPin } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { PixPanel } from "@/app/app/pedidos/[id]/pix-panel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  requested: "Solicitada · aguardando pagamento",
  confirmed: "Confirmada! Retire no horário combinado.",
  active: "Em uso",
  returned: "Devolvido",
  cancelled: "Cancelada",
  refunded: "Estornada",
  late: "Devolução atrasada",
};

type Meta = {
  pix_qr?: string | null;
  pix_copy?: string | null;
  pix_expires?: string | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function LocacaoDetalhe({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/app/locacoes/${id}`);

  const { data: b } = await supabase
    .from("rental_bookings")
    .select(
      "id, code, status, payment_status, payment_method, delivery_code, return_code, customer_name, customer_whatsapp, pickup_at, return_at, total_days, daily_cents, subtotal_cents, deposit_cents, total_cents, metadata, pickup_location, notes, businesses(name, whatsapp, district, address), services(name, image_url)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!b) notFound();

  const meta = (b.metadata as Meta | null) ?? {};
  const svc = b.services as { name?: string; image_url?: string } | null;
  const business = b.businesses as { name?: string; whatsapp?: string; address?: string; district?: string } | null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/app/pedidos" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Locação</p>
          <h1 className="text-base font-bold tracking-tight">#{b.code}</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <Bike className="h-4 w-4 text-primary" />
          {STATUS_LABEL[b.status] ?? b.status}
        </p>
        {b.payment_status === "pending" && b.payment_method === "pix" && (
          <p className="mt-1 text-xs text-muted-foreground">Aguardando pagamento PIX pra confirmar.</p>
        )}
      </section>

      {b.payment_method === "pix" && b.payment_status !== "paid" && meta.pix_copy && (
        <PixPanel
          qrCodeBase64={meta.pix_qr ?? null}
          copyPaste={meta.pix_copy}
          expiresAt={meta.pix_expires ?? null}
          totalCents={b.total_cents}
        />
      )}

      {b.payment_status === "paid" && (b.delivery_code || b.return_code) && (
        <section className="space-y-3 rounded-2xl border-2 border-[color:var(--turtle)]/60 bg-[color:var(--turtle)]/5 p-5">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
              Código de retirada
            </p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em]">{b.delivery_code}</p>
            <p className="text-[11px] text-muted-foreground">Mostre ao retirar o equipamento</p>
          </div>
          <div className="border-t border-[color:var(--turtle)]/30 pt-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
              Código de devolução
            </p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em]">{b.return_code}</p>
            <p className="text-[11px] text-muted-foreground">Mostre na devolução pra liberar caução</p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Locadora</h2>
        <p className="mt-1 text-base font-bold tracking-tight">{business?.name ?? "—"}</p>
        {business?.address && <p className="mt-1 text-xs text-muted-foreground">{business.address}</p>}
        {business?.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Falar no WhatsApp ↗
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Equipamento e período
        </h2>
        <p className="text-base font-bold">{svc?.name ?? "—"}</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Retirada</p>
            <p className="text-sm font-bold">{new Date(b.pickup_at).toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Devolução</p>
            <p className="text-sm font-bold">{new Date(b.return_at).toLocaleString("pt-BR")}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {b.total_days} dia{b.total_days === 1 ? "" : "s"}
        </p>
        {b.pickup_location && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-primary" /> {b.pickup_location}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valores</h2>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {formatCents(b.daily_cents)} × {b.total_days} dia{b.total_days === 1 ? "" : "s"}
            </span>
            <span>{formatCents(b.subtotal_cents)}</span>
          </div>
          {b.deposit_cents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Caução (devolvida)</span>
              <span>{formatCents(b.deposit_cents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
            <span>Total</span>
            <span>{formatCents(b.total_cents)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
