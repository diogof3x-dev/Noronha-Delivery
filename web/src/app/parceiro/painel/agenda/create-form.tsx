"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTourSession, type TourState } from "@/app/actions/tours";

const initial: TourState = { ok: false };

type Tour = { id: string; name: string; capacity: number | null };

export function CreateSessionForm({ tours }: { tours: Tour[] }) {
  const [state, action, pending] = useActionState(createTourSession, initial);
  const [serviceId, setServiceId] = useState(tours[0]?.id ?? "");
  const selectedTour = tours.find((t) => t.id === serviceId);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold">Nova sessão</h3>

      <input type="hidden" name="service_id" value={serviceId} />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="tour">Passeio</Label>
          <select
            id="tour"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="start_at">Data e hora</Label>
          <Input id="start_at" name="start_at" type="datetime-local" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="capacity">Vagas</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={200}
            defaultValue={selectedTour?.capacity ?? 10}
            required
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="meeting_point">Ponto de encontro</Label>
        <Input
          id="meeting_point"
          name="meeting_point"
          maxLength={200}
          placeholder="Ex: Porto Santo Antônio, 8h30 (chegar 15min antes)"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notas (visíveis ao cliente após reserva)</Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={500} placeholder="Levar protetor solar..." />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" /> Sessão criada
        </p>
      )}

      <Button type="submit" disabled={pending || !serviceId}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" /> Criar sessão
          </>
        )}
      </Button>
    </form>
  );
}
