"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser-client";

export function RealtimeOrdersListener({ businessIds }: { businessIds: string[] }) {
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  function beep() {
    if (!soundOn) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = ctxRef.current ?? new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const playTone = (freq: number, when: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
        gain.gain.setValueAtTime(0, ctx.currentTime + when);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + when + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + dur);
      };
      playTone(880, 0, 0.22);
      playTone(1175, 0.18, 0.22);
      playTone(1568, 0.36, 0.32);
    } catch {}
  }

  useEffect(() => {
    if (!businessIds.length) return;
    const supabase = getBrowserClient();
    const channel = supabase
      .channel("merchant-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `business_id=in.(${businessIds.join(",")})`,
        },
        () => {
          beep();
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `business_id=in.(${businessIds.join(",")})`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessIds.join(",")]);

  return (
    <button
      type="button"
      onClick={() => {
        setSoundOn((v) => !v);
        if (!soundOn) beep();
      }}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        soundOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
      aria-label={soundOn ? "Desligar som" : "Ligar som"}
    >
      {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      {soundOn ? "Som ligado" : "Som desligado"}
    </button>
  );
}
