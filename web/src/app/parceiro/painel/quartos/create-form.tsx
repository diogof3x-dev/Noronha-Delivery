"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/upload/image-upload";
import { createRoom, type RoomState } from "@/app/actions/rooms";

const initial: RoomState = { ok: false };

export function CreateRoomForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(createRoom, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Adicionar quarto
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="business_id" value={businessId} />
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Novo quarto</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </header>

      <ImageUpload name="photo_url" label="Foto principal" aspect="wide" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome do quarto</Label>
          <Input id="name" name="name" required maxLength={120} placeholder="Ex: Suíte Vista Mar" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="capacity">Capacidade</Label>
          <Input id="capacity" name="capacity" type="number" min={1} max={20} defaultValue={2} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="price_per_night_brl">Valor / noite (R$)</Label>
          <Input id="price_per_night_brl" name="price_per_night_brl" inputMode="decimal" placeholder="450,00" required />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="bed_layout">Configuração das camas</Label>
          <Input id="bed_layout" name="bed_layout" maxLength={120} placeholder="1 casal + 1 solteiro" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={2} maxLength={600} placeholder="Vista panorâmica do Morro Dois Irmãos, ar-condicionado, ducha quente..." />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="amenities">Comodidades</Label>
        <Input
          id="amenities"
          name="amenities"
          maxLength={600}
          placeholder="WiFi, Ar-condicionado, Café da manhã, Estacionamento"
        />
        <p className="text-[11px] text-muted-foreground">Separe por vírgula.</p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
          </>
        ) : (
          "Criar quarto"
        )}
      </Button>
    </form>
  );
}
