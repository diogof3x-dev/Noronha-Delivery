import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { PixPanel } from "@/app/app/pedidos/[id]/pix-panel";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  requested: "Solicitado · aguardando pagamento",
  confirmed: "Confirmado!",
  completed: "Serviço concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
  no_show: "Não compareceu",
};

type Meta = {
  pix_qr?: string | null;
  pix_copy?: string | null;
  pix_expires?: string | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function AgendamentoDetalhe({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/app/agendamentos/${id}`);

  const { data: b } = await supabase
    .from("service_bookings")
    .select(
      "id, code, status, payment_status, payment_method, delivery_code, total_cents, metadata, notes, businesses(name, whatsapp, district, address), services(name, image_url, duration_minutes), service_slots(start_at, staff_name, notes)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();

  const meta = (b.metadata as Meta | null) ?? {};
  const svc = b.services as { name?: string; image_url?: string; duration_minutes?: number } | null;
  const slot = b.service_slots as { start_at?: string; staff_name?: string; notes?: string } | null;
  const biz = b.businesses as { name?: string; whatsapp?: string; address?: string; district?: string } | null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/app/pedidos" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agendamento</p>
          <h1 className="text-base font-bold tracking-tight">#{b.code}</h1>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          {STATUS[b.status] ?? b.status}
        </p>
      </section>

      {b.payment_method === "pix" && b.payment_status !== "paid" && meta.pix_copy && (
        <PixPanel
          qrCodeBase64={meta.pix_qr ?? null}
          copyPaste={meta.pix_copy}
          expiresAt={meta.pix_expires ?? null}
          totalCents={b.total_cents}
        />
      )}

      {b.delivery_code && b.payment_status === "paid" && (
        <section className="rounded-2xl border-2 border-[color:var(--turtle)]/60 bg-[color:var(--turtle)]/5 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
            Código de chegada
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em]">{b.delivery_code}</p>
          <p className="mt-2 text-xs text-muted-foreground">Mostre esse código ao chegar</p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Local</h2>
        <p className="mt-1 text-base font-bold tracking-tight">{biz?.name ?? "—"}</p>
        {biz?.address && <p className="mt-1 text-xs text-muted-foreground">{biz.address}</p>}
        {biz?.whatsapp && (
          <a
            href={`https://wa.me/${biz.whatsapp.replace(/\D/g, "")}`}
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
          <CalendarDays className="h-3.5 w-3.5" /> Serviço
        </h2>
        <p className="text-base font-bold">{svc?.name ?? "—"}</p>
        <p className="mt-1 text-xs">
          {slot?.start_at ? new Date(slot.start_at).toLocaleString("pt-BR") : "—"}
          {svc?.duration_minutes ? ` · ${svc.duration_minutes} min` : ""}
        </p>
        {slot?.staff_name && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-primary" /> Atendente: {slot.staff_name}
          </p>
        )}
        {slot?.notes && <p className="mt-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs">{slot.notes}</p>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valores</h2>
        <div className="flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatCents(b.total_cents)}</span>
        </div>
      </section>
    </div>
  );
}
