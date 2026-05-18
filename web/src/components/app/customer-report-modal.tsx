"use client";

import { useState, useTransition } from "react";
import { AlertOctagon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { reportCustomerProblem } from "@/app/actions/customer-report";

const REASONS: Array<{ value: string; label: string; urgent?: boolean }> = [
  { value: "not_delivered", label: "🚨 Não recebi o pedido", urgent: true },
  { value: "missing_item", label: "Faltou item da sacola" },
  { value: "wrong_item", label: "Item errado / trocado" },
  { value: "cold_or_bad", label: "Chegou frio ou em mau estado" },
  { value: "long_delay", label: "Demorou muito" },
  { value: "rude_driver", label: "Motoboy mal-educado" },
  { value: "wrong_address", label: "Endereço errado" },
  { value: "other", label: "Outro motivo" },
];

export function CustomerReportButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive"
      >
        <AlertOctagon className="h-3.5 w-3.5" />
        Reportar problema
      </button>
      {open && (
        <CustomerReportModal orderId={orderId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function CustomerReportModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();

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
          <h2 className="text-base font-bold">Reportar problema</h2>
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
          Conte o que aconteceu. A gente investiga e responde em até 24h.
        </p>

        <form
          action={(fd) => {
            if (!reason) {
              toast.error("Escolha um motivo");
              return;
            }
            start(async () => {
              const res = await reportCustomerProblem(fd);
              if (res.ok) {
                toast.success("Problema registrado. F3X foi notificada.");
                onClose();
              } else {
                toast.error(res.error);
              }
            });
          }}
          className="space-y-3"
        >
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="reason" value={reason} />

          <div className="space-y-1.5">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${
                  reason === r.value
                    ? r.urgent
                      ? "border-destructive bg-destructive/5"
                      : "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="reason_radio"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="h-3.5 w-3.5"
                />
                <span className={r.urgent ? "font-bold text-destructive" : ""}>
                  {r.label}
                </span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Detalhes
            </label>
            <Textarea
              name="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Descreva o que aconteceu..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !reason}>
              {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Enviar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
