"use client";

import { useEffect, useState } from "react";
import { Bike, ExternalLink, MapPin } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser-client";

type Position = {
  lat: number;
  lng: number;
  recorded_at: string;
};

type Props = {
  orderId: string;
  destinationLabel: string | null;
};

export function DriverPositionLive({ orderId, destinationLabel }: Props) {
  const [pos, setPos] = useState<Position | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();

    // initial fetch
    supabase
      .from("driver_live_positions")
      .select("lat, lng, recorded_at")
      .eq("order_id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPos({ lat: data.lat, lng: data.lng, recorded_at: data.recorded_at });
      });

    // realtime
    const channel = supabase
      .channel(`driver-pos:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_live_positions",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setPos(null);
            return;
          }
          const r = payload.new as {
            lat?: number;
            lng?: number;
            recorded_at?: string;
          };
          if (r.lat != null && r.lng != null && r.recorded_at) {
            setPos({ lat: r.lat, lng: r.lng, recorded_at: r.recorded_at });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // marca stale após 60s
  useEffect(() => {
    if (!pos) return;
    const id = setInterval(() => {
      const age = Date.now() - new Date(pos.recorded_at).getTime();
      setStale(age > 60000);
    }, 5000);
    return () => clearInterval(id);
  }, [pos]);

  if (!pos) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Bike className="h-3.5 w-3.5" />
          Quando o motoboy começar a andar, você vê a localização dele aqui em tempo real.
        </p>
      </section>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`;
  const dirUrl = destinationLabel
    ? `https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${encodeURIComponent(
        `${destinationLabel}, Fernando de Noronha`,
      )}&travelmode=driving`
    : mapsUrl;
  const lastSec = Math.round((Date.now() - new Date(pos.recorded_at).getTime()) / 1000);

  return (
    <section
      className={`rounded-2xl border-2 p-4 ${
        stale
          ? "border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5"
          : "border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
          <Bike className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold">
            {stale ? "Motoboy parado" : "Motoboy em rota"}
            {!stale && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--turtle)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--turtle)]" />
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">
            atualizado há {lastSec < 60 ? `${lastSec}s` : `${Math.round(lastSec / 60)}min`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={dirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
            >
              <MapPin className="h-3 w-3" />
              Ver rota até você
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold hover:bg-muted"
            >
              Onde ele tá agora ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
