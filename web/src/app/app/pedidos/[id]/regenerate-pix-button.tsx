"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { regenerateOrderPayment } from "@/app/actions/order-payment";

export function RegeneratePixButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const [autoTried, setAutoTried] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const triedOnce = useRef(false);
  const router = useRouter();

  // tenta gerar automaticamente uma vez quando a página carrega
  useEffect(() => {
    if (triedOnce.current) return;
    triedOnce.current = true;

    const fd = new FormData();
    fd.append("order_id", orderId);
    start(async () => {
      const res = await regenerateOrderPayment(fd);
      setAutoTried(true);
      if (res.ok) {
        router.refresh();
      } else {
        setAutoError(res.error);
      }
    });
  }, [orderId, router]);

  if (!autoTried && pending) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm font-semibold">Gerando QR Code PIX...</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Conectando com o Mercado Pago
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--sun)]">
        Pagamento ainda não gerado
      </p>
      <p className="mt-1 text-sm">
        {autoError
          ? autoError
          : "Não conseguimos criar o QR Code do PIX automaticamente. Tenta de novo."}
      </p>
      <form
        action={(fd) =>
          start(async () => {
            const res = await regenerateOrderPayment(fd);
            if (res.ok) {
              toast.success("PIX gerado!");
              router.refresh();
            } else {
              setAutoError(res.error);
              toast.error(res.error);
            }
          })
        }
        className="mt-4"
      >
        <input type="hidden" name="order_id" value={orderId} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-4 w-4" /> Tentar gerar PIX
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
