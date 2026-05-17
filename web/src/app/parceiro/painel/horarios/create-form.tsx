"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createServiceSlot, type SvcState } from "@/app/actions/service-bookings";

const initial: SvcState = { ok: false };

type SvcItem = { id: string; name: string; duration_minutes: number | null };

export function CreateSlotForm({ services }: { services: SvcItem[] }) {
  const [state, action, pending] = useActionState(createServiceSlot, initial);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const selected = services.find((s) => s.id === serviceId);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold">Novo horário</h3>
      <input type="hidden" name="service_id" value={serviceId} />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="service">Serviço</Label>
          <select
            id="service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="start_at">Data e hora</Label>
          <Input id="start_at" name="start_at" type="datetime-local" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="duration_minutes">Duração</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={5}
            max={720}
            defaultValue={selected?.duration_minutes ?? 60}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="capacity">Capacidade</Label>
          <Input id="capacity" name="capacity" type="number" min={1} max={50} defaultValue={1} />
        </div>
        <div className="grid gap-1.5 sm:col-span-3">
          <Label htmlFor="staff_name">Atendente (opcional)</Label>
          <Input id="staff_name" name="staff_name" maxLength={120} placeholder="Ex: Marina · Carlos" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={500} placeholder="Levar roupa, ponto de encontro..." />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" /> Horário criado
        </p>
      )}

      <Button type="submit" disabled={pending || !serviceId}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Criar horário
      </Button>
    </form>
  );
}
