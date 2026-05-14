"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hand, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { claimSpecificOrder } from "@/app/actions/driver";

export function AvailableOrderCard({
  orderId,
  code,
  totalCents,
  businessName,
  businessAddress,
  destinationKind,
  destinationLabel,
  statusLabel,
}: {
  orderId: string;
  code: string;
  status: string;
  totalCents: number;
  businessName: string;
  businessAddress: string;
  destinationKind: string | null;
  destinationLabel: string | null;
  statusLabel: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            #{code} · {businessName}
          </p>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="font-medium">Coletar:</span> {businessAddress}
          </p>
          {destinationLabel && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3 text-[color:var(--turtle)]" />
              <span className="font-medium capitalize">{destinationKind ?? "Destino"}:</span>{" "}
              {destinationLabel}
            </p>
          )}
        </div>
        <span className="shrink-0 text-base font-bold">{formatCents(totalCents)}</span>
      </div>
      <form
        action={(fd) =>
          start(async () => {
            const res = await claimSpecificOrder(fd);
            if (res.ok) {
              toast.success(`Corrida #${res.orderCode} aceita`);
              router.refresh();
            } else {
              toast.error(res.error);
            }
          })
        }
        className="mt-3"
      >
        <input type="hidden" name="order_id" value={orderId} />
        <Button type="submit" size="sm" disabled={pending} className="w-full sm:w-auto">
          {pending ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <Hand className="mr-2 h-3 w-3" />
          )}
          Aceitar esta corrida
        </Button>
      </form>
    </li>
  );
}
