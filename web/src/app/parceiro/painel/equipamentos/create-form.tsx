"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/upload/image-upload";
import { createRentalItem, type RentalState } from "@/app/actions/rentals";

const initial: RentalState = { ok: false };

export function CreateRentalItemForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(createRentalItem, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Adicionar equipamento
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="business_id" value={businessId} />
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Novo equipamento</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </header>

      <ImageUpload name="photo_url" label="Foto do equipamento" aspect="wide" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required maxLength={160} placeholder="Ex: Bike elétrica modelo X / Buggy 4 lugares" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="daily_brl">Diária (R$)</Label>
          <Input id="daily_brl" name="daily_brl" inputMode="decimal" required placeholder="120,00" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deposit_brl">Caução (R$, opcional)</Label>
          <Input id="deposit_brl" name="deposit_brl" inputMode="decimal" placeholder="500,00" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          placeholder="Características, autonomia, restrições de uso, capacete incluído..."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Criar
      </Button>
    </form>
  );
}
