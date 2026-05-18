"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { reportOrderProblem } from "@/app/actions/driver-report";

const REASONS = [
  { value: "customer_no_answer", label: "Cliente não responde / não atende" },
  { value: "wrong_address", label: "Endereço errado ou não existe" },
  { value: "store_closed", label: "Loja fechada / sem produto" },
  { value: "vehicle_issue", label: "Problema no veículo" },
  { value: "safety", label: "Problema de segurança / acidente" },
  { value: "other", label: "Outro" },
];

export function ReportProblemModal({
  orderId,
  code,
  onClose,
}: {
  orderId: string;
  code: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
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
          <h2 className="text-base font-bold">Reportar problema · #{code}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          action={(fd) => {
            if (!reason) {
              toast.error("Escolha um motivo");
              return;
            }
            start(async () => {
              const res = await reportOrderProblem(fd);
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
                    ? "border-primary bg-primary/5"
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
                {r.label}
              </label>
            ))}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Detalhe (opcional)
            </label>
            <Textarea
              name="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
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
