"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/upload/image-upload";
import {
  deleteRoom,
  toggleRoomActive,
  updateRoom,
  type RoomState,
} from "@/app/actions/rooms";

export function RoomActions({
  id,
  defaults,
  isActive,
}: {
  id: string;
  defaults: {
    name: string;
    description: string;
    capacity: string;
    price_per_night_brl: string;
    bed_layout: string;
    amenities: string;
    photo_url: string;
  };
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, action, saving] = useActionState<RoomState, FormData>(updateRoom, {
    ok: false,
  });
  if (state.ok && editing) setEditing(false);

  if (editing) {
    return (
      <div className="w-full rounded-2xl border border-primary/40 bg-card p-3">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <ImageUpload name="photo_url" label="Foto" defaultUrl={defaults.photo_url} aspect="wide" />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor={`room-name-${id}`}>Nome</Label>
              <Input id={`room-name-${id}`} name="name" defaultValue={defaults.name} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`room-cap-${id}`}>Capacidade</Label>
              <Input id={`room-cap-${id}`} name="capacity" type="number" min={1} max={20} defaultValue={defaults.capacity} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`room-price-${id}`}>R$/noite</Label>
              <Input id={`room-price-${id}`} name="price_per_night_brl" inputMode="decimal" defaultValue={defaults.price_per_night_brl} required />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor={`room-bed-${id}`}>Camas</Label>
              <Input id={`room-bed-${id}`} name="bed_layout" defaultValue={defaults.bed_layout} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`room-desc-${id}`}>Descrição</Label>
            <Textarea id={`room-desc-${id}`} name="description" rows={2} defaultValue={defaults.description} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`room-am-${id}`}>Comodidades</Label>
            <Input id={`room-am-${id}`} name="amenities" defaultValue={defaults.amenities} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Salvar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="mr-1 h-3 w-3" /> Cancelar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Editar"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <form action={(fd) => startTransition(() => toggleRoomActive(fd))}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="is_active" value={isActive ? "false" : "true"} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center justify-center rounded-full px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isActive ? "Pausar" : "Ativar"}
        </button>
      </form>
      <form
        action={(fd) => {
          if (confirm("Excluir este quarto?")) startTransition(() => deleteRoom(fd));
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label="Excluir"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
