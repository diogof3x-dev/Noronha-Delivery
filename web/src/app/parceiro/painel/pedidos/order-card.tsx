"use client";

import { useTransition } from "react";
import { Loader2, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { moveOrderStatus } from "@/app/actions/order-merchant";
import { ChatOpenerButton } from "@/components/chat/order-chat";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Recebido",
  preparing: "Em preparo",
  ready: "Pronto pra retirada",
  in_transit: "Saiu pra entrega",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
};

const NEXT_FOR: Record<string, { label: string; to: string }[]> = {
  pending: [
    { label: "Aceitar pedido", to: "confirmed" },
    { label: "Recusar", to: "cancelled" },
  ],
  confirmed: [{ label: "Iniciar preparo", to: "preparing" }],
  preparing: [{ label: "Pronto pra retirada", to: "ready" }],
  ready: [{ label: "Saiu pra entrega", to: "in_transit" }],
  in_transit: [{ label: "Marcar como entregue", to: "delivered" }],
};

export type MerchantOrder = {
  id: string;
  code: string;
  status: string;
  total_cents: number;
  created_at: string;
  destination_kind: string | null;
  destination_label: string | null;
  destination_notes?: string | null;
  payment_method: string;
  payment_status: string;
  delivery_code?: string | null;
  business_name?: string;
  customer_name?: string | null;
  customer_whatsapp?: string | null;
  items: { name_snapshot: string; quantity: number }[];
};

function waLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function mapsLink(label: string | null | undefined): string | null {
  if (!label) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${label}, Fernando de Noronha`)}`;
}

export function OrderCard({
  order,
  showBusiness,
  currentUserId,
}: {
  order: MerchantOrder;
  showBusiness?: boolean;
  currentUserId?: string;
}) {
  const [pending, start] = useTransition();
  const actions = NEXT_FOR[order.status] ?? [];
  const isActive =
    ["pending", "confirmed", "preparing", "ready", "in_transit"].includes(order.status);

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            #{order.code}
            {showBusiness && order.business_name && (
              <span className="ml-2 text-xs text-muted-foreground">· {order.business_name}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {STATUS_LABEL[order.status] ?? order.status} ·{" "}
            {new Date(order.created_at).toLocaleString("pt-BR")} ·{" "}
            <span className="capitalize">
              {order.payment_method === "pix" ? "PIX" : order.payment_method}
            </span>
            {order.payment_status === "paid" && (
              <span className="ml-1 text-[color:var(--turtle)]">· pago</span>
            )}
          </p>
        </div>
        <span className="text-base font-bold">{formatCents(order.total_cents)}</span>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {order.items.map((it, idx) => (
          <li key={idx}>
            {it.quantity}× {it.name_snapshot}
          </li>
        ))}
      </ul>

      {(order.customer_name || order.customer_whatsapp) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium">Cliente:</span>
          <span>{order.customer_name ?? "—"}</span>
          {waLink(order.customer_whatsapp) && (
            <a
              href={waLink(order.customer_whatsapp)!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--turtle)] hover:bg-[color:var(--turtle)]/10"
            >
              <MessageCircle className="h-3 w-3" />
              WhatsApp
            </a>
          )}
        </div>
      )}

      {order.destination_kind && (
        <div className="mt-2 text-xs">
          <strong className="capitalize">{order.destination_kind}:</strong>{" "}
          {mapsLink(order.destination_label) ? (
            <a
              href={mapsLink(order.destination_label)!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {order.destination_label} <MapPin className="h-3 w-3" />
            </a>
          ) : (
            order.destination_label ?? "—"
          )}
          {order.destination_notes && (
            <p className="mt-0.5 text-muted-foreground">{order.destination_notes}</p>
          )}
        </div>
      )}

      {order.delivery_code && order.payment_status === "paid" && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-secondary/30 px-2 py-1 font-mono text-[11px]">
          Código entrega: <span className="font-bold tracking-widest">{order.delivery_code}</span>
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => (
            <form
              key={a.to}
              action={(fd) => start(() => moveOrderStatus(fd))}
              className="inline-block"
              onSubmit={(e) => {
                if (a.to === "cancelled") {
                  if (!confirm("Recusar este pedido? O cliente será notificado e estornado se já tiver pago.")) {
                    e.preventDefault();
                  }
                }
              }}
            >
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="next" value={a.to} />
              <Button
                type="submit"
                size="sm"
                variant={a.to === "cancelled" ? "outline" : "default"}
                disabled={pending}
              >
                {pending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                {a.label}
              </Button>
            </form>
          ))}
        </div>
      )}

      {isActive && currentUserId && (
        <div className="mt-3 flex justify-center border-t border-border pt-3">
          <ChatOpenerButton
            orderId={order.id}
            currentUserId={currentUserId}
            customerName={order.customer_name ?? null}
            label="Chat com cliente / motoboy"
          />
        </div>
      )}
    </li>
  );
}
