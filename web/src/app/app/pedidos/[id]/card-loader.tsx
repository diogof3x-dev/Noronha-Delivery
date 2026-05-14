"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CardPaymentPanel } from "./card-payment";

export function CardLoader({ orderId }: { orderId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${orderId}/card-secret`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setError(d.error ?? "Falha ao carregar pagamento");
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!clientSecret) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparando pagamento seguro...
      </div>
    );
  }
  return <CardPaymentPanel orderId={orderId} clientSecret={clientSecret} />;
}
