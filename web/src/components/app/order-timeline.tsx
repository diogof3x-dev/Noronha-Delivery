import { Check, ChefHat, CircleCheck, Package, Sparkles, Truck, XCircle } from "lucide-react";

type Event = {
  key: string;
  label: string;
  at: string | null;
  icon: React.ComponentType<{ className?: string }>;
};

type Props = {
  placedAt: string | null;
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderTimeline(props: Props) {
  if (props.cancelledAt) {
    const events: Event[] = [
      { key: "placed", label: "Pedido criado", at: props.placedAt, icon: Sparkles },
      { key: "cancelled", label: "Cancelado", at: props.cancelledAt, icon: XCircle },
    ];
    return (
      <Timeline events={events} highlightLast cancelled cancelReason={props.cancellationReason} />
    );
  }

  const events: Event[] = [
    { key: "placed", label: "Pedido criado", at: props.placedAt, icon: Sparkles },
    { key: "confirmed", label: "Lojista aceitou", at: props.confirmedAt, icon: CircleCheck },
    { key: "preparing", label: "Em preparo", at: props.preparingAt, icon: ChefHat },
    { key: "ready", label: "Pronto pra coleta", at: props.readyAt, icon: Package },
    { key: "in_transit", label: "Saiu pra entrega", at: props.inTransitAt, icon: Truck },
    { key: "delivered", label: "Entregue", at: props.deliveredAt, icon: Check },
  ];

  return <Timeline events={events} />;
}

function Timeline({
  events,
  highlightLast,
  cancelled,
  cancelReason,
}: {
  events: Event[];
  highlightLast?: boolean;
  cancelled?: boolean;
  cancelReason?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Timeline do pedido
      </h2>
      <ol className="space-y-3">
        {events.map((e, i) => {
          const Icon = e.icon;
          const done = !!e.at;
          const isLastDone = done && (i === events.length - 1 || !events[i + 1]?.at);
          const isPending = !done;
          const isCancelledStep = cancelled && i === events.length - 1;
          return (
            <li
              key={e.key}
              className="grid grid-cols-[24px,1fr,auto] items-center gap-3"
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    isCancelledStep
                      ? "bg-destructive text-white"
                      : done
                        ? "bg-[color:var(--turtle)] text-white"
                        : "border-2 border-dashed border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                {i < events.length - 1 && (
                  <span
                    className={`absolute top-7 h-3 w-px ${
                      done ? "bg-[color:var(--turtle)]" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-sm ${
                  isPending
                    ? "text-muted-foreground"
                    : isLastDone && (highlightLast ?? true)
                      ? "font-bold"
                      : "font-medium"
                }`}
              >
                {e.label}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {fmt(e.at)}
              </span>
            </li>
          );
        })}
      </ol>
      {cancelReason && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <strong>Motivo:</strong> {cancelReason}
        </p>
      )}
    </section>
  );
}
