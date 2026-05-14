"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCampaign } from "@/app/actions/take-rate";

type State = { ok: boolean; error?: string };
const initial: State = { ok: false };

export function CampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, initial);
  const [appliesTo, setAppliesTo] = useState<"all" | "business" | "category">("all");

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <header>
        <h2 className="text-base font-semibold">Nova campanha</h2>
        <p className="text-xs text-muted-foreground">
          Sobrescreve a taxa padrão dentro do período definido. Prioridade maior ganha.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome interno</Label>
          <Input id="name" name="name" required maxLength={120} placeholder="Ex: Black Friday 2026" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="take_rate_pct">Taxa (%)</Label>
          <Input id="take_rate_pct" name="take_rate_pct" inputMode="decimal" required placeholder="5,00" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="priority">Prioridade</Label>
          <Input id="priority" name="priority" inputMode="numeric" defaultValue={100} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="starts_at">Início (opcional)</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ends_at">Fim (opcional)</Label>
          <Input id="ends_at" name="ends_at" type="datetime-local" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="applies_to">Aplica em</Label>
          <select
            id="applies_to"
            name="applies_to"
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as "all" | "business" | "category")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Tudo (global)</option>
            <option value="business">Loja específica</option>
            <option value="category">Categoria</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="applies_id">ID</Label>
          <Input
            id="applies_id"
            name="applies_id"
            placeholder={appliesTo === "business" ? "UUID da loja" : appliesTo === "category" ? "Ex: comida" : "—"}
            disabled={appliesTo === "all"}
            required={appliesTo !== "all"}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={500} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" /> Campanha criada
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando...
          </>
        ) : (
          "Criar campanha"
        )}
      </Button>
    </form>
  );
}
