"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { moveOrderStatus } from "@/app/actions/order-merchant";

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
  payment_method: string;
  payment_status: string;
  business_name?: string;
  items: { name_snapshot: string; quantity: number }[];
};

export function OrderCard({ order, showBusiness }: { order: MerchantOrder; showBusiness?: boolean }) {
  const [pending, start] = useTransition();
  const actions = NEXT_FOR[order.status] ?? [];

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

      {order.destination_kind && (
        <p className="mt-2 text-xs">
          <strong className="capitalize">{order.destination_kind}:</strong>{" "}
          {order.destination_label ?? "—"}
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => (
            <form
              key={a.to}
              action={(fd) => start(() => moveOrderStatus(fd))}
              className="inline-block"
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
    </li>
  );
}
