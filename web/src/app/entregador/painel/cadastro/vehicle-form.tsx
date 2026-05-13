"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateVehicle, type AccountState } from "@/app/actions/account";

const initial: AccountState = { ok: false };

const VEHICLE_KINDS = [
  { value: "bike_eletrica", label: "Bike elétrica" },
  { value: "scooter_eletrica", label: "Scooter elétrica" },
  { value: "moto", label: "Moto" },
  { value: "buggy", label: "Buggy" },
  { value: "carro_eletrico", label: "Carro elétrico" },
  { value: "carro", label: "Carro" },
];

export function VehicleForm({
  defaults,
}: {
  defaults: {
    cnh_number: string;
    cnh_category: string;
    vehicle_kind: string;
    plate: string;
    model: string;
    year: string;
    color: string;
    photo_url: string;
  };
}) {
  const [state, action, pending] = useActionState(updateVehicle, initial);
  const [kind, setKind] = useState(defaults.vehicle_kind || "bike_eletrica");

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="vehicle_kind" value={kind} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cnh_number">CNH (número)</Label>
          <Input id="cnh_number" name="cnh_number" maxLength={40} defaultValue={defaults.cnh_number} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cnh_category">Categoria</Label>
          <Input id="cnh_category" name="cnh_category" maxLength={5} defaultValue={defaults.cnh_category} placeholder="A, B, AB..." />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Tipo de veículo</Label>
        <Select value={kind} onValueChange={(v) => setKind(v ?? "bike_eletrica")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_KINDS.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="plate">Placa (se aplicável)</Label>
          <Input id="plate" name="plate" maxLength={10} defaultValue={defaults.plate} placeholder="ABC1D23" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" maxLength={80} defaultValue={defaults.model} placeholder="Ex: Bike GoCycle G4" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" name="year" inputMode="numeric" maxLength={8} defaultValue={defaults.year} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="color">Cor</Label>
          <Input id="color" name="color" maxLength={40} defaultValue={defaults.color} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="photo_url">URL da foto do veículo</Label>
        <Input id="photo_url" name="photo_url" type="url" defaultValue={defaults.photo_url} placeholder="https://..." />
        <p className="text-[11px] text-muted-foreground">Upload direto chega na próxima versão.</p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" />
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar veículo"
        )}
      </Button>
    </form>
  );
}
