"use client";

import { useTransition } from "react";
import { Bike, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markDelivered, markPickedUp } from "@/app/actions/driver";

export function DeliveryStepButtons({ orderId, status }: { orderId: string; status: string }) {
  const [pending, start] = useTransition();

  if (status === "in_transit") {
    return (
      <form
        action={(fd) => start(() => markDelivered(fd))}
        className="mt-3 flex flex-wrap gap-2"
      >
        <input type="hidden" name="order_id" value={orderId} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
          Marcar como entregue
        </Button>
      </form>
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
