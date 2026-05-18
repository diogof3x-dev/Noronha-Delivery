"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cancelOrderAsCustomer } from "@/app/actions/customer-cancel";

const REASONS = [
  "Mudei de ideia",
  "Pedi item errado",
  "Vai demorar demais",
  "Quero ir buscar pessoalmente",
  "Outro motivo",
];

export function CancelOrderButton({
  orderId,
  isPaid,
}: {
  orderId: string;
  isPaid: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancelar pedido
      </button>
      {open && (
        <CancelOrderModal
          orderId={orderId}
          isPaid={isPaid}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CancelOrderModal({
  orderId,
  isPaid,
  onClose,
}: {
  orderId: string;
  isPaid: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Cancelar pedido</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {isPaid ? (
            <>
              ✅ Como você já pagou, o reembolso será automático no mesmo
              método (PIX ou cartão). Pode levar até 5 dias úteis pra cair
              dependendo do banco.
            </>
          ) : (
            <>
              Pedido ainda não foi pago — basta confirmar o cancelamento.
            </>
          )}
        </p>

        <form
          action={(fd) => {
            const finalReason = details.trim() || reason;
            if (!finalReason || finalReason.length < 3) {
              toast.error("Conta rapidinho o motivo");
              return;
            }
            fd.set("reason", finalReason);
            start(async () => {
              const res = await cancelOrderAsCustomer(fd);
              if (res.ok) {
                toast.success(
                  res.refunded
                    ? "Pedido cancelado. Reembolso a caminho."
                    : "Pedido cancelado.",
                );
                onClose();
                router.refresh();
              } else {
                toast.error(res.error);
              }
            });
          }}
          className="space-y-3"
        >
          <input type="hidden" name="order_id" value={orderId} />

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Motivo
            </p>
            {REASONS.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${
                  reason === r
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="reason_choice"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="h-3.5 w-3.5"
                />
                {r}
              </label>
            ))}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Detalhe (opcional)
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="Conte um pouco mais — ajuda a gente a melhorar"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Voltar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || !reason}
            >
              {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
