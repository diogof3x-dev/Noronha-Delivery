"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import Image from "next/image";
import { Check, Loader2, Pencil, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/format";
import {
  deleteService,
  toggleServiceActive,
  updateService,
  type CatalogState,
} from "@/app/actions/catalog";

export function CardapioItemRow({
  id,
  name,
  description,
  priceCents,
  imageUrl,
  isActive,
}: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, action, saving] = useActionState<CatalogState, FormData>(
    updateService,
    { ok: false },
  );

  if (state.ok && editing) {
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-2xl border border-primary/40 bg-card p-3">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="sm:col-span-2 grid gap-1.5">
              <Label htmlFor={`name-${id}`}>Nome</Label>
              <Input id={`name-${id}`} name="name" defaultValue={name} maxLength={160} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`price-${id}`}>Preço (R$)</Label>
              <Input
                id={`price-${id}`}
                name="price_brl"
                defaultValue={(priceCents / 100).toFixed(2).replace(".", ",")}
                inputMode="decimal"
                required
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`desc-${id}`}>Descrição</Label>
            <Textarea
              id={`desc-${id}`}
              name="description"
              defaultValue={description ?? ""}
              rows={2}
              maxLength={600}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`img-${id}`}>URL da foto</Label>
            <Input id={`img-${id}`} name="image_url" defaultValue={imageUrl ?? ""} type="url" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Salvar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="mr-1 h-3 w-3" /> Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3 ${
        !isActive ? "opacity-60" : ""
      }`}
    >
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="40px" />
        ) : (
          <UtensilsCrossed className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {name}
          {!isActive && <span className="ml-2 text-[10px] text-muted-foreground">(pausado)</span>}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{description ?? "—"}</p>
      </div>
      <span className="font-bold">{formatCents(priceCents)}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Editar"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <form
          action={(fd) => {
            startTransition(() => toggleServiceActive(fd));
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="is_active" value={isActive ? "false" : "true"} />
          <button
            type="submit"
            disabled={pending}
            aria-label={isActive ? "Pausar" : "Ativar"}
            className="inline-flex h-8 px-2 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isActive ? "Pausar" : "Ativar"}
          </button>
        </form>
        <form
          action={(fd) => {
            if (confirm(`Excluir "${name}"?`)) {
              startTransition(() => deleteService(fd));
            }
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
    </li>
  );
}
