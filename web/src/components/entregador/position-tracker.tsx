"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateDriverPosition, clearDriverPosition } from "@/app/actions/driver-position";

type Props = {
  activeOrderId: string | null;
};

/**
 * Em rota ativa, pede permissão de geolocation e envia a posição
 * a cada 20s. Compartilha com cliente/lojista via Realtime.
 * Render mínimo: chip de status, pra ele saber que tá ativo.
 */
export function DriverPositionTracker({ activeOrderId }: Props) {
  const [status, setStatus] = useState<
    "idle" | "asking" | "active" | "denied" | "unavailable"
  >("idle");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    if (!activeOrderId) {
      // sem corrida ativa: limpa
      if (status === "active") {
        void clearDriverPosition();
      }
      setStatus("idle");
      stopWatch();
      return;
    }

    // tem corrida ativa — começa a rastrear
    setStatus("asking");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("active");
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();
        const last = lastSentRef.current;
        // throttle: só envia se mudou >20m OU >20s desde último envio
        const movedFar =
          !last ||
          haversine(last.lat, last.lng, latitude, longitude) > 20 ||
          now - last.ts > 20000;
        if (!movedFar) return;
        lastSentRef.current = { lat: latitude, lng: longitude, ts: now };
        void updateDriverPosition({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ?? undefined,
          order_id: activeOrderId,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      },
    );
    watchIdRef.current = watchId;

    // garante envio a cada 30s mesmo se a posição não mudou (heartbeat)
    intervalRef.current = setInterval(() => {
      if (!lastSentRef.current) return;
      void updateDriverPosition({
        lat: lastSentRef.current.lat,
        lng: lastSentRef.current.lng,
        order_id: activeOrderId,
      });
    }, 30000);

    return () => {
      stopWatch();
      void clearDriverPosition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderId]);

  function stopWatch() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  if (!activeOrderId) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px]">
      {status === "asking" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Pedindo localização...</span>
        </>
      )}
      {status === "active" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--turtle)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--turtle)]" />
          </span>
          <span className="font-semibold text-[color:var(--turtle)]">
            Cliente acompanhando
          </span>
        </>
      )}
      {status === "denied" && (
        <>
          <MapPin className="h-3 w-3 text-destructive" />
          <button
            type="button"
            onClick={() => {
              toast.info(
                "Pra cliente ver onde você tá, libere a localização nas configurações do navegador.",
              );
            }}
            className="text-destructive underline"
          >
            Liberar localização
          </button>
        </>
      )}
      {status === "unavailable" && (
        <span className="text-muted-foreground">Localização indisponível</span>
      )}
    </div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
