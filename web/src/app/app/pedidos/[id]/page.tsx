import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";
import { OrderStatusLive } from "./order-status-live";
import { PixPanel } from "./pix-panel";
import { CardLoader } from "./card-loader";
import { RatingForm } from "./rating-form";
import { RegeneratePixButton } from "./regenerate-pix-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado pelo estabelecimento",
  preparing: "Em preparo",
  ready: "Pronto pra coleta",
  in_transit: "A caminho",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

type OrderMetadata = {
  pix_qr?: string | null;
  pix_copy?: string | null;
  pix_expires?: string | null;
  take_rate_bps?: number;
};

type Props = { params: Promise<{ id: string }> };

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/app/pedidos/${id}`);

  // libera pra customer, driver, business owner ou admin verem o pedido
  // (RLS já restringe; a consulta retorna nada se o user não tiver permissão)
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, code, status, subtotal_cents, delivery_fee_cents, total_cents, platform_fee_cents, service_fee_cents, coupon_discount_cents, coupon_code, cpf_nota, payment_method, payment_status, destination_kind, destination_label, destination_notes, destination_geo, created_at, metadata, business_id, driver_id, customer_id, delivery_code, businesses(name, slug)",
    )
    .eq("id", id)
    .maybeSingle();

  const isOwnCustomer = order?.customer_id === user.id;

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, name_snapshot, quantity, unit_price_cents, total_cents")
    .eq("order_id", id)
    .order("created_at");

  const meta = (order.metadata as OrderMetadata | null) ?? {};
  const business = order.businesses as { name?: string; slug?: string } | null;

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
            Pedido
          </p>
          <h1 className="text-base font-bold tracking-tight">#{order.code}</h1>
        </div>
      </div>

      <OrderStatusLive
        orderId={order.id}
        initialStatus={order.status}
        initialPaymentStatus={order.payment_status}
        statusLabel={STATUS_LABEL}
      />

      {isOwnCustomer && order.payment_method === "pix" && order.payment_status !== "paid" && meta.pix_copy && (
        <PixPanel
          qrCodeBase64={meta.pix_qr ?? null}
          copyPaste={meta.pix_copy}
          expiresAt={meta.pix_expires ?? null}
          totalCents={order.total_cents}
        />
      )}

      {isOwnCustomer &&
        order.payment_method === "pix" &&
        order.payment_status !== "paid" &&
        !meta.pix_copy &&
        !["cancelled", "refunded"].includes(order.status) && (
          <RegeneratePixButton orderId={order.id} />
        )}

      {isOwnCustomer && order.payment_method === "card" && order.payment_status !== "paid" && (
        <CardLoader orderId={order.id} />
      )}

      {isOwnCustomer && ["delivered", "completed"].includes(order.status) && (
        <RatingForm orderId={order.id} hasDriver={!!order.driver_id} />
      )}

      {isOwnCustomer &&
        order.delivery_code &&
        ["confirmed", "preparing", "ready", "in_transit"].includes(order.status) &&
        order.payment_status === "paid" && (
          <section className="rounded-2xl border-2 border-[color:var(--turtle)]/60 bg-[color:var(--turtle)]/5 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
              Código de entrega
            </p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em]">
              {order.delivery_code}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Passe esse código pro entregador <strong>só na entrega</strong>. É a sua
              confirmação de que recebeu o pedido. Nunca compartilhe antes.
            </p>
          </section>
        )}

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estabelecimento
        </h2>
        <p className="mt-1 text-base font-bold tracking-tight">{business?.name ?? "—"}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Itens
        </h2>
        <ul className="space-y-1.5">
          {(items ?? []).map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-3">
              <span className="flex-1 truncate">
                {i.quantity}× {i.name_snapshot}
              </span>
              <span className="shrink-0 font-medium">{formatCents(i.total_cents)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCents(order.subtotal_cents)}</span>
          </div>
          {order.coupon_discount_cents > 0 && (
            <div className="flex justify-between text-[color:var(--turtle)]">
              <span>Cupom {order.coupon_code}</span>
              <span>-{formatCents(order.coupon_discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrega</span>
            <span>{order.delivery_fee_cents === 0 ? "Grátis" : formatCents(order.delivery_fee_cents)}</span>
          </div>
          {order.service_fee_cents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de serviço</span>
              <span>{formatCents(order.service_fee_cents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
            <span>Total</span>
            <span>{formatCents(order.total_cents)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Entrega
        </h2>
        <p className="mt-1 capitalize">{order.destination_kind ?? "—"}</p>
        {order.destination_label && (
          <p className="text-xs text-muted-foreground">{order.destination_label}</p>
        )}
        {order.destination_label && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${order.destination_label}, Fernando de Noronha`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Abrir no Google Maps ↗
          </a>
        )}
        {order.destination_notes && (
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Obs:</strong> {order.destination_notes}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pagamento
        </h2>
        <p className="mt-1 capitalize">
          {order.payment_method === "pix" && "PIX"}
          {order.payment_method === "card" && "Cartão"}
          {order.payment_method === "cash" && "Dinheiro na entrega"}
          {order.payment_method === "wallet" && "Carteira"}
          {" · "}
          <span className="text-muted-foreground">
            {order.payment_status === "paid" ? "pago" : order.payment_status}
          </span>
        </p>
      </section>
    </div>
  );
}
