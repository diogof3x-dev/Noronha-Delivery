"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { regenerateOrderPayment } from "@/app/actions/order-payment";

export function RegeneratePixButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-2xl border-2 border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--sun)]">
        Pagamento ainda não gerado
      </p>
      <p className="mt-1 text-sm">
        Não conseguimos criar o QR Code do PIX automaticamente. Clica aí pra gerar agora.
      </p>
      <form
        action={(fd) =>
          start(async () => {
            const res = await regenerateOrderPayment(fd);
            if (res.ok) {
              toast.success("PIX gerado!");
              router.refresh();
            } else {
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
              <QrCode className="mr-2 h-4 w-4" /> Gerar PIX agora
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
