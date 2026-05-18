"use client";

import { useEffect, useState } from "react";
import { Clock, Timer } from "lucide-react";

type Props = {
  placedAt: string;
  prepMinutes: number; // tempo médio de preparo da loja
  routeKm: number | null; // distância loja→destino em km
  status: string;
  /** Quando entregue, mostra "Entregue em X min". */
  deliveredAt: string | null;
  inTransitAt: string | null;
};

const SPEED_KMH = 25;

export function OrderETA({ placedAt, prepMinutes, routeKm, status, deliveredAt, inTransitAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (status === "cancelled" || status === "refunded") return null;

  // se já foi entregue, mostra tempo total
  if (deliveredAt) {
    const totalMin = Math.round(
      (new Date(deliveredAt).getTime() - new Date(placedAt).getTime()) / 60000,
    );
    return (
      <section className="rounded-2xl border-2 border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
          Entregue
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          em {totalMin} minutos
        </p>
        <p className="text-[11px] text-muted-foreground">
          do pedido até a porta — obrigado por escolher Noronha Delivery 🌊
        </p>
      </section>
    );
  }

  const placedMs = new Date(placedAt).getTime();
  const travelMin = routeKm != null ? Math.max(2, Math.round((routeKm / SPEED_KMH) * 60)) : 8;
  const totalEstimateMin = Math.max(15, prepMinutes + travelMin);
  const etaMs = placedMs + totalEstimateMin * 60_000;
  const minutesUntil = Math.round((etaMs - now) / 60_000);
  const elapsedMin = Math.round((now - placedMs) / 60_000);

  // se já saiu pra entrega, faz contagem regressiva mais precisa
  let displayMinutes = minutesUntil;
  if (inTransitAt && status === "in_transit") {
    const tMs = new Date(inTransitAt).getTime();
    const transitElapsed = (now - tMs) / 60_000;
    displayMinutes = Math.max(1, Math.round(travelMin - transitElapsed));
  }

  const late = displayMinutes < 0;
  const lateBy = Math.abs(displayMinutes);

  return (
    <section
      className={`rounded-2xl border-2 p-4 text-center ${
        late
          ? "border-destructive/40 bg-destructive/5"
          : status === "in_transit"
            ? "border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5"
            : "border-primary/30 bg-primary/5"
      }`}
    >
      <p className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-[0.18em]">
        {late ? <Timer className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {late ? "Atrasou um pouco" : status === "in_transit" ? "Chegando" : "Previsão de entrega"}
      </p>
      <p
        className={`mt-1 text-3xl font-bold leading-none ${
          late ? "text-destructive" : "text-foreground"
        }`}
      >
        {late ? `${lateBy} min` : `~${displayMinutes} min`}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {late
          ? "Pedimos desculpa pelo atraso. Entrega já está em curso."
          : status === "in_transit"
            ? "Motoboy a caminho do seu endereço"
            : `Estimativa: ${prepMinutes}min preparo + ${travelMin}min deslocamento`}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Pedido feito há {elapsedMin}min
      </p>
    </section>
  );
}
