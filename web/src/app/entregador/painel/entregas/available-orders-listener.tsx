"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase/browser-client";

/**
 * Realtime: refresh quando aparecer nova corrida disponível (driver_id=null)
 * ou quando uma corrida atual mudar status (lojista aceitou/cancelou, etc).
 */
export function AvailableOrdersListener() {
  const router = useRouter();
  const lastBeepRef = useRef(0);

  function beep() {
    const now = Date.now();
    if (now - lastBeepRef.current < 5000) return; // throttle 5s
    lastBeepRef.current = now;
    try {
      const Ctx =
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1320;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {}
    try {
      navigator.vibrate?.([80, 40, 80]);
    } catch {}
  }

  useEffect(() => {
    const supabase = getBrowserClient();

    const channel = supabase
      .channel("driver-available-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const row = payload.new as {
            driver_id?: string | null;
            status?: string;
            code?: string;
          };
          if (!row.driver_id && row.status && ["confirmed", "preparing", "ready"].includes(row.status)) {
            beep();
            toast(`🛵 Corrida nova disponível #${row.code ?? ""}`);
            router.refresh();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const row = payload.new as { driver_id?: string | null; status?: string };
          // alguém aceitou (driver_id mudou de null pra um id), ou status mudou
          router.refresh();
          void row;
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
