"use client";

import { useState } from "react";
import { Bike, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { label: "R$ 2", cents: 200 },
  { label: "R$ 5", cents: 500 },
  { label: "R$ 10", cents: 1000 },
];

export function TipPicker({
  tipCents,
  onChange,
}: {
  tipCents: number;
  onChange: (cents: number) => void;
}) {
  const isCustom = tipCents > 0 && !PRESETS.some((p) => p.cents === tipCents);
  const [customStr, setCustomStr] = useState(
    isCustom ? (tipCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [showCustom, setShowCustom] = useState(isCustom);

  return (
    <section className="space-y-2 rounded-2xl border border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 p-4">
      <header className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-[color:var(--turtle)]" />
        <h2 className="text-sm font-semibold">
          Gorjeta pro motoboy{" "}
          <span className="text-[10px] font-normal text-muted-foreground">
            (opcional)
          </span>
        </h2>
      </header>
      <p className="text-[11px] text-muted-foreground">
        O motoboy recebe a gorjeta inteira, sem qualquer taxa.{" "}
        <Bike className="inline h-3 w-3" /> Eles agradecem demais 🌊
      </p>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            onChange(0);
            setShowCustom(false);
            setCustomStr("");
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            tipCents === 0
              ? "border-foreground/60 bg-background"
              : "border-border bg-card"
          }`}
        >
          Sem gorjeta
        </button>
        {PRESETS.map((p) => {
          const active = !showCustom && tipCents === p.cents;
          return (
            <button
              key={p.cents}
              type="button"
              onClick={() => {
                onChange(p.cents);
                setShowCustom(false);
                setCustomStr("");
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "border-[color:var(--turtle)] bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                  : "border-border bg-card"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            showCustom
              ? "border-[color:var(--turtle)] bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
              : "border-border bg-card"
          }`}
        >
          Outro valor
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">R$</span>
          <Input
            inputMode="decimal"
            value={customStr}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9,.]/g, "");
              setCustomStr(raw);
              const v = Number(raw.replace(",", "."));
              if (Number.isFinite(v) && v >= 0) {
                onChange(Math.round(v * 100));
              }
            }}
            placeholder="0,00"
            className="h-9 w-28"
          />
        </div>
      )}
    </section>
  );
}
