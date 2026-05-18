"use client";

import { useState, useTransition } from "react";
import { Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCents } from "@/lib/format";
import { requestDriverWithdrawal } from "@/app/actions/withdrawals";

export function DriverWithdrawalForm({
  balanceCents,
  hasPendingRequest,
}: {
  balanceCents: number;
  hasPendingRequest: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const balanceR$ = balanceCents / 100;

  if (hasPendingRequest) {
    return (
      <div className="rounded-xl border border-[color:var(--sun)]/30 bg-[color:var(--sun)]/5 p-3 text-sm">
        Você já tem um saque aguardando aprovação. Quando ele for pago ou rejeitado, você
        pode solicitar outro.
      </div>
    );
  }

  if (balanceCents < 1000) {
    return (
      <p className="text-sm text-muted-foreground">
        Saldo mínimo pra saque: R$ 10,00. Seu saldo: <strong>{formatCents(balanceCents)}</strong>.
      </p>
    );
  }

  return (
    <form
      action={(fd) => {
        const value = Number(amount.replace(",", "."));
        if (!Number.isFinite(value) || value <= 0) {
          toast.error("Valor inválido");
          return;
        }
        const cents = Math.round(value * 100);
        if (cents < 1000) {
          toast.error("Valor mínimo R$ 10,00");
          return;
        }
        if (cents > balanceCents) {
          toast.error("Acima do saldo disponível");
          return;
        }
        fd.set("amount_cents", String(cents));
        start(async () => {
          const res = await requestDriverWithdrawal(fd);
          if (res.ok) {
            toast.success("Saque solicitado! O time da F3X aprova em até 1 dia útil.");
            setAmount("");
          } else {
            toast.error(res.error);
          }
        });
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-xs">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Valor (R$)
          </span>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9,.]/g, ""))}
            placeholder={balanceR$.toFixed(2)}
            className="w-32"
          />
        </label>
        <button
          type="button"
          onClick={() => setAmount(balanceR$.toFixed(2).replace(".", ","))}
          className="h-9 rounded-full border border-border px-3 text-[11px] font-semibold hover:bg-muted"
        >
          Sacar tudo
        </button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Banknote className="mr-2 h-3.5 w-3.5" />
          )}
          Solicitar saque
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Saldo disponível: <strong>{formatCents(balanceCents)}</strong>. Mínimo R$ 10,00. Sem taxa.
      </p>
    </form>
  );
}
