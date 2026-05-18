"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Loader2,
  MapPin,
  Navigation,
  NavigationOff,
  Sailboat,
  Settings,
  TreePalm,
  Wind,
} from "lucide-react";
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

export type SavedAddress = {
  id: string;
  label: string;
  kind: "pousada" | "praia" | "barco" | "casa" | "outro";
  address: string;
  notes: string | null;
  geo: { lat: number; lng: number } | null;
  is_default: boolean;
};

const KIND_OPTIONS = [
  { value: "pousada", label: "Minha pousada" },
  { value: "praia", label: "Praia onde estou" },
  { value: "barco", label: "Barco / marina" },
  { value: "outro", label: "Outro endereço" },
];

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pousada: Wind,
  praia: TreePalm,
  barco: Sailboat,
  casa: Home,
  outro: MapPin,
};

export function AddressPicker({
  kind,
  setKind,
  label,
  setLabel,
  geo,
  setGeo,
  savedAddresses,
}: {
  kind: string;
  setKind: (k: string) => void;
  label: string;
  setLabel: (s: string) => void;
  geo: Geo | null;
  setGeo: (g: Geo | null) => void;
  savedAddresses?: SavedAddress[];
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  // pré-seleciona o default no mount
  useEffect(() => {
    if (!savedAddresses?.length) {
      setShowCustom(true);
      return;
    }
    if (selectedSavedId) return;
    const fav = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0]!;
    if (fav) {
      pickSaved(fav);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickSaved(addr: SavedAddress) {
    setSelectedSavedId(addr.id);
    setShowCustom(false);
    setKind(addr.kind);
    setLabel(addr.address + (addr.notes ? ` · ${addr.notes}` : ""));
    if (addr.geo && Number.isFinite(addr.geo.lat) && Number.isFinite(addr.geo.lng)) {
      setGeo({ lat: addr.geo.lat, lng: addr.geo.lng });
    } else {
      setGeo(null);
    }
  }

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
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Onde entregar</h2>
        </div>
        <Link
          href="/app/perfil/enderecos"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <Settings className="h-3 w-3" />
          Gerenciar
        </Link>
      </header>

      {savedAddresses && savedAddresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Salvos
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {savedAddresses.map((a) => {
              const Icon = KIND_ICON[a.kind] ?? MapPin;
              const active = selectedSavedId === a.id && !showCustom;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => pickSaved(a)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                      active
                        ? "border-primary bg-primary/15 font-bold text-primary"
                        : "border-border bg-background"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {a.label}
                    {a.is_default && (
                      <span className="text-[9px] text-muted-foreground">·padrão</span>
                    )}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => {
                  setSelectedSavedId(null);
                  setShowCustom(true);
                  setLabel("");
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs ${
                  showCustom
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border"
                }`}
              >
                <MapPin className="h-3 w-3" />
                Outro lugar
              </button>
            </li>
          </ul>
          {selectedSavedId && !showCustom && (
            <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">
              <strong>{label}</strong>
            </p>
          )}
        </div>
      )}

      {showCustom && (
        <>
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
              placeholder="Ex: Pousada do Vale, Q5 · Praia do Sancho, barraca azul"
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
        </>
      )}
    </section>
  );
}
