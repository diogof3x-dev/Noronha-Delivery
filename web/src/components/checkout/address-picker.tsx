"use client";

import { useState } from "react";
import { Loader2, MapPin, NavigationOff, Navigation } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Geo = { lat: number; lng: number; accuracy?: number };

const KIND_OPTIONS = [
  { value: "pousada", label: "Minha pousada" },
  { value: "praia", label: "Praia onde estou" },
  { value: "barco", label: "Barco / marina" },
  { value: "outro", label: "Outro endereço" },
];

export function AddressPicker({
  kind,
  setKind,
  label,
  setLabel,
  geo,
  setGeo,
}: {
  kind: string;
  setKind: (k: string) => void;
  label: string;
  setLabel: (s: string) => void;
  geo: Geo | null;
  setGeo: (g: Geo | null) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Seu navegador não suporta GPS");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      (err) => {
        setError(err.message || "Permissão de localização negada");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Onde entregar</h2>
      </header>

      <div className="grid gap-1.5">
        <Label htmlFor="dest-kind">Tipo de local</Label>
        <Select value={kind} onValueChange={(v) => setKind(v ?? "pousada")}>
          <SelectTrigger id="dest-kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="dest-label">Detalhes</Label>
        <Input
          id="dest-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: Pousada do Vale, Q5 · Ou: Praia do Sancho, barraca azul"
          maxLength={300}
        />
      </div>

      <div className="rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Localização GPS
            </p>
            {geo ? (
              <p className="mt-1 text-xs">
                {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                {geo.accuracy ? ` · ±${Math.round(geo.accuracy)}m` : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Compartilhe pra o entregador chegar exato.
              </p>
            )}
          </div>
          {geo ? (
            <button
              type="button"
              onClick={() => setGeo(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs"
            >
              <NavigationOff className="h-3.5 w-3.5" /> Remover
            </button>
          ) : (
            <button
              type="button"
              onClick={getLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {locating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5" />
              )}
              Usar GPS
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </section>
  );
}
