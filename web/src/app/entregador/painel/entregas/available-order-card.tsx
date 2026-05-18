"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Bike,
  CreditCard,
  Flame,
  Hand,
  Loader2,
  MapPin,
  Package,
  Snowflake,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { claimSpecificOrder } from "@/app/actions/driver";

type Urgency = "fresh" | "warm" | "cold";

export type AvailableOrderCardProps = {
  orderId: string;
  code: string;
  status: string;
  totalCents: number;
  driverEarningsCents: number;
  paymentMethod: string;
  paymentStatus: string;
  businessName: string;
  businessAddress: string;
  businessDistrict: string | null;
  destinationKind: string | null;
  destinationLabel: string | null;
  destinationDistrict: string | null;
  itemsCount: number;
  itemsPreview: string;
  pickupDistanceMeters: number | null;
  routeDistanceMeters: number | null;
  routeEtaMinutes: number | null;
  minutesSincePlaced: number;
  urgency: Urgency;
  statusLabel: string;
};

const URGENCY_STYLE: Record<Urgency, { border: string; bg: string; pill: string; icon: typeof Flame }> = {
  fresh: {
    border: "border-[color:var(--turtle)]/40",
    bg: "bg-[color:var(--turtle)]/5",
    pill: "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]",
    icon: Flame,
  },
  warm: {
    border: "border-[color:var(--sun)]/40",
    bg: "bg-[color:var(--sun)]/5",
    pill: "bg-[color:var(--sun)]/15 text-[color:var(--sun)]",
    icon: Flame,
  },
  cold: {
    border: "border-destructive/40",
    bg: "bg-destructive/5",
    pill: "bg-destructive/15 text-destructive",
    icon: Snowflake,
  },
};

const URGENCY_LABEL: Record<Urgency, string> = {
  fresh: "Quente",
  warm: "Atenção",
  cold: "Frio",
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX já pago",
  card: "Cartão já pago",
  cash: "Dinheiro na entrega — leve troco",
};

export function AvailableOrderCard(props: AvailableOrderCardProps) {
  const [pending, start] = useTransition();
  const [tick, setTick] = useState(0);
  const router = useRouter();

  // re-renderiza a cada minuto pra atualizar "5min atrás"
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const ageMin = props.minutesSincePlaced + Math.floor(tick / 1); // refresh visual
  void ageMin;

  const style = URGENCY_STYLE[props.urgency];
  const UrgIcon = style.icon;

  return (
    <li className={`rounded-2xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            #{props.code} · {props.businessName}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${style.pill}`}>
              <UrgIcon className="h-3 w-3" />
              {URGENCY_LABEL[props.urgency]} · {props.minutesSincePlaced}min
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{props.statusLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Você ganha
          </p>
          <p className="text-2xl font-bold leading-none text-[color:var(--turtle)]">
            {formatCents(props.driverEarningsCents)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Stat
          icon={MapPin}
          label="Coleta"
          value={
            props.pickupDistanceMeters != null
              ? `${(props.pickupDistanceMeters / 1000).toFixed(1)} km`
              : "—"
          }
        />
        <Stat
          icon={Bike}
          label="Rota"
          value={
            props.routeDistanceMeters != null
              ? `${(props.routeDistanceMeters / 1000).toFixed(1)} km`
              : "—"
          }
        />
        <Stat
          icon={Banknote}
          label="ETA"
          value={
            props.routeEtaMinutes != null ? `${props.routeEtaMinutes}min` : "—"
          }
        />
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0 text-primary" />
          <span className="font-medium">De:</span>
          <span className="truncate">
            {props.businessAddress}
            {props.businessDistrict ? ` · ${props.businessDistrict}` : ""}
          </span>
        </p>
        {props.destinationLabel && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 text-[color:var(--turtle)]" />
            <span className="font-medium capitalize">
              {props.destinationKind ?? "Destino"}:
            </span>
            <span className="truncate">
              {props.destinationLabel}
              {props.destinationDistrict ? ` · ${props.destinationDistrict}` : ""}
            </span>
          </p>
        )}
        <p className="flex items-center gap-1.5">
          {props.paymentMethod === "cash" ? (
            <Banknote className="h-3 w-3 shrink-0 text-[color:var(--sun)]" />
          ) : (
            <CreditCard className="h-3 w-3 shrink-0 text-[color:var(--turtle)]" />
          )}
          <span className={props.paymentMethod === "cash" ? "font-bold text-[color:var(--sun)]" : ""}>
            {PAYMENT_LABEL[props.paymentMethod] ?? props.paymentMethod}
            {props.paymentMethod === "cash" &&
              ` · cobrar ${formatCents(props.totalCents)}`}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <Package className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            {props.itemsCount} item{props.itemsCount === 1 ? "" : "s"}
            {props.itemsPreview ? ` · ${props.itemsPreview}` : ""}
          </span>
        </p>
      </div>

      <form
        action={(fd) =>
          start(async () => {
            const res = await claimSpecificOrder(fd);
            if (res.ok) {
              toast.success(`Corrida #${res.orderCode} aceita`);
              try {
                navigator.vibrate?.(50);
              } catch {}
              router.refresh();
            } else {
              toast.error(res.error);
            }
          })
        }
        className="mt-3"
      >
        <input type="hidden" name="order_id" value={props.orderId} />
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 w-full text-base font-bold"
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Hand className="mr-2 h-4 w-4" />
          )}
          Aceitar · ganhe {formatCents(props.driverEarningsCents)}
        </Button>
      </form>
    </li>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-2 text-center">
      <Icon className="mx-auto mb-0.5 h-3 w-3 text-muted-foreground" />
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}
