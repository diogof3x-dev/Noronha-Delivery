"use client";

import { useActionState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusiness, type BusinessState } from "@/app/actions/business";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

type Hours = Record<string, { open?: string; close?: string; closed?: boolean }>;

export function EditBusinessForm({
  id,
  defaults,
}: {
  id: string;
  defaults: {
    description: string | null;
    whatsapp: string | null;
    district: string | null;
    address: string | null;
    delivery_fee_cents: number | null;
    min_order_cents: number | null;
    avg_prep_minutes: number | null;
    opening_hours: Hours;
  };
}) {
  const [state, action, pending] = useActionState<BusinessState, FormData>(
    updateBusiness,
    { ok: false },
  );

  const fmt = (c: number | null) =>
    c == null ? "" : (c / 100).toFixed(2).replace(".", ",");

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="id" value={id} />

      <h2 className="text-base font-semibold">Detalhes da loja</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaults.description ?? ""}
            rows={2}
            maxLength={600}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={defaults.whatsapp ?? ""} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="district">Bairro</Label>
          <Input id="district" name="district" defaultValue={defaults.district ?? ""} />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="address">Endereço completo</Label>
          <Input
            id="address"
            name="address"
            maxLength={300}
            defaultValue={defaults.address ?? ""}
            placeholder="Ex: Rua Quixaba, 35 – Vila dos Remédios"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="delivery_fee_brl">Taxa de entrega (R$)</Label>
          <Input
            id="delivery_fee_brl"
            name="delivery_fee_brl"
            inputMode="decimal"
            defaultValue={fmt(defaults.delivery_fee_cents)}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="min_order_brl">Pedido mínimo (R$)</Label>
          <Input
            id="min_order_brl"
            name="min_order_brl"
            inputMode="decimal"
            defaultValue={fmt(defaults.min_order_cents)}
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="avg_prep_minutes">Tempo médio de preparo (min)</Label>
          <Input
            id="avg_prep_minutes"
            name="avg_prep_minutes"
            inputMode="numeric"
            defaultValue={defaults.avg_prep_minutes ?? ""}
            className="max-w-32"
          />
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Horários de funcionamento</h3>
        <div className="space-y-2">
          {DAYS.map((d) => {
            const cur = defaults.opening_hours?.[d.key] ?? {};
            return (
              <div key={d.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2">
                <span className="w-20 text-xs font-medium">{d.label}</span>
                <label className="inline-flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    name={`oh_${d.key}_closed`}
                    defaultChecked={!!cur.closed}
                  />
                  Fechado
                </label>
                <Input
                  type="time"
                  name={`oh_${d.key}_open`}
                  defaultValue={cur.open ?? "08:00"}
                  className="h-8 w-28"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="time"
                  name={`oh_${d.key}_close`}
                  defaultValue={cur.close ?? "22:00"}
                  className="h-8 w-28"
                />
              </div>
            );
          })}
        </div>
      </section>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" /> Salvo
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Salvar mudanças
          </>
        )}
      </Button>
    </form>
  );
}
