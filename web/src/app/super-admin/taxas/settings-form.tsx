"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettings } from "@/app/actions/take-rate";

type State = { ok: boolean; error?: string };
const initial: State = { ok: false };

export function SettingsForm({
  defaults,
}: {
  defaults: { default_take_rate_pct: string; d_plus_days: string };
}) {
  const [state, action, pending] = useActionState(updatePlatformSettings, initial);
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <header>
        <h2 className="text-base font-semibold">Configuração padrão</h2>
        <p className="text-xs text-muted-foreground">
          Vale pra todos os pedidos quando nenhuma campanha se aplica.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="default_take_rate_pct">Take rate padrão (%)</Label>
          <Input
            id="default_take_rate_pct"
            name="default_take_rate_pct"
            inputMode="decimal"
            defaultValue={defaults.default_take_rate_pct}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="d_plus_days">D+ pra liberar (dias)</Label>
          <Input
            id="d_plus_days"
            name="d_plus_days"
            inputMode="numeric"
            defaultValue={defaults.d_plus_days}
            required
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" /> Configuração salva
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar"
        )}
      </Button>
    </form>
  );
}
