"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCoupon, type CouponState } from "@/app/actions/coupons-admin";

const initial: CouponState = { ok: false };

export function CreateCouponForm({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createCoupon, initial);
  const [kind, setKind] = useState<"percent" | "fixed">("percent");

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <header>
        <h2 className="text-base font-semibold">Novo cupom</h2>
        <p className="text-xs text-muted-foreground">
          Percentual ou valor fixo. Ative limites e validades pra controlar a campanha.
        </p>
      </header>

      <input type="hidden" name="kind" value={kind} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            name="code"
            required
            maxLength={40}
            placeholder="NORONHA10"
            className="uppercase"
            onInput={(e) => {
              const t = e.currentTarget;
              t.value = t.value.toUpperCase();
            }}
          />
        </div>

        <div className="grid gap-1.5">
          <Label>Tipo</Label>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-input bg-background p-0.5">
            <button
              type="button"
              onClick={() => setKind("percent")}
              className={`h-9 rounded text-xs font-medium transition-colors ${
                kind === "percent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Percentual %
            </button>
            <button
              type="button"
              onClick={() => setKind("fixed")}
              className={`h-9 rounded text-xs font-medium transition-colors ${
                kind === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Valor fixo R$
            </button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="value">
            {kind === "percent" ? "Desconto (%)" : "Valor (R$)"}
          </Label>
          <Input
            id="value"
            name="value"
            required
            inputMode="decimal"
            placeholder={kind === "percent" ? "10" : "15,00"}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="min_subtotal_brl">Pedido mínimo (R$, opcional)</Label>
          <Input id="min_subtotal_brl" name="min_subtotal_brl" inputMode="decimal" placeholder="0,00" />
        </div>

        {kind === "percent" && (
          <div className="grid gap-1.5">
            <Label htmlFor="max_discount_brl">Desconto máximo (R$, opcional)</Label>
            <Input id="max_discount_brl" name="max_discount_brl" inputMode="decimal" placeholder="20,00" />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="business_id">Loja específica (opcional)</Label>
          <select
            id="business_id"
            name="business_id"
            defaultValue=""
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Toda a plataforma</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
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
          <Label htmlFor="max_uses">Limite de usos (opcional)</Label>
          <Input id="max_uses" name="max_uses" inputMode="numeric" placeholder="ilimitado" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Observações internas</Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={500} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <Check className="h-4 w-4" /> Cupom criado
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Criar cupom
          </>
        )}
      </Button>
    </form>
  );
}
