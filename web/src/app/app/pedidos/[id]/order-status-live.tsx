"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser-client";

const STATUS_PROGRESS: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  in_transit: 4,
  delivered: 5,
  completed: 5,
  cancelled: -1,
  refunded: -1,
};

export function OrderStatusLive({
  orderId,
  initialStatus,
  initialPaymentStatus,
  statusLabel,
}: {
  orderId: string;
  initialStatus: string;
  initialPaymentStatus: string;
  statusLabel: Record<string, string>;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);

  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as { status?: string; payment_status?: string };
          if (next.status) setStatus(next.status);
          if (next.payment_status) setPaymentStatus(next.payment_status);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const progress = STATUS_PROGRESS[status] ?? 0;
  const isCancelled = progress === -1;
  const isDone = status === "delivered" || status === "completed";

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {!isDone && !isCancelled && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        <p className="text-sm font-bold">{statusLabel[status] ?? status}</p>
      </div>
      {paymentStatus === "pending" && status === "pending" && (
        <p className="mt-1 text-xs text-muted-foreground">Aguardando pagamento.</p>
      )}
      {paymentStatus === "paid" && status === "pending" && (
        <p className="mt-1 text-xs text-[color:var(--turtle)]">
          Pagamento confirmado. O estabelecimento já foi avisado.
        </p>
      )}

      {!isCancelled && (
        <div className="mt-4 flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full ${
                step <= progress ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {isCancelled && (
        <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Pedido {status === "cancelled" ? "cancelado" : "reembolsado"}.
        </p>
      )}
    </section>
  );
}
