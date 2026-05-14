"use client";

import { useActionState, useState, useTransition } from "react";
import { Bike, Check, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markDelivered, markPickedUp, type DeliverResult } from "@/app/actions/driver";

const initial: DeliverResult = { ok: false };

export function DeliveryStepButtons({ orderId, status }: { orderId: string; status: string }) {
  const [pending, start] = useTransition();
  const [showCode, setShowCode] = useState(false);
  const [state, action, saving] = useActionState(markDelivered, initial);

  if (state.ok && showCode) {
    setShowCode(false);
    toast.success("Pedido entregue!");
  }

  if (status === "in_transit") {
    if (showCode) {
      return (
        <form action={action} className="mt-3 space-y-2">
          <input type="hidden" name="order_id" value={orderId} />
          <label className="block text-xs font-semibold">
            Digite o código de 4 dígitos que o cliente vai te passar
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              name="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              required
              placeholder="0000"
              className="h-11 w-32 text-center text-lg font-bold tracking-[0.4em]"
            />
            <Button type="submit" disabled={saving} className="h-11">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirmar entrega
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCode(false)}
              disabled={saving}
              className="h-11"
            >
              Cancelar
            </Button>
          </div>
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </form>
      );
    }
    return (
      <div className="mt-3">
        <Button onClick={() => setShowCode(true)} size="sm" className="w-full sm:w-auto">
          <KeyRound className="mr-2 h-3 w-3" />
          Confirmar entrega com código
        </Button>
      </div>
    );
  }

  if (status === "ready" || status === "preparing" || status === "confirmed") {
    return (
      <form
        action={(fd) => start(() => markPickedUp(fd))}
        className="mt-3 flex flex-wrap gap-2"
      >
        <input type="hidden" name="order_id" value={orderId} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Bike className="mr-1 h-3 w-3" />}
          Coletei · saí pra entrega
        </Button>
      </form>
    );
  }

  return null;
}
