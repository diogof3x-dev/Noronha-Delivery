"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Layers, Loader2, Pencil, Star, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/upload/image-upload";
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
  originalPriceCents,
  imageUrl,
  isActive,
  section,
  isFeatured,
  servesPeople,
}: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  originalPriceCents: number | null;
  imageUrl: string | null;
  isActive: boolean;
  section: string | null;
  isFeatured: boolean;
  servesPeople: number | null;
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

  const hasPromo =
    originalPriceCents != null && originalPriceCents > priceCents && priceCents > 0;
  const discountPct = hasPromo
    ? Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100)
    : 0;

  if (editing) {
    const fmt = (c: number | null) =>
      c == null ? "" : (c / 100).toFixed(2).replace(".", ",");
    return (
      <li className="rounded-2xl border border-primary/50 bg-card">
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <div className="flex gap-3 overflow-x-auto p-3 [scrollbar-width:thin]">
            <div className="shrink-0">
              <ImageUpload name="image_url" label="Foto" defaultUrl={imageUrl} aspect="square" />
            </div>

            <div className="grid w-48 shrink-0 gap-1.5">
              <Label htmlFor={`name-${id}`} className="text-xs">
                Nome
              </Label>
              <Input
                id={`name-${id}`}
                name="name"
                defaultValue={name}
                maxLength={160}
                required
                className="h-9"
              />
            </div>

            <div className="grid w-36 shrink-0 gap-1.5">
              <Label htmlFor={`desc-${id}`} className="text-xs">
                Descrição
              </Label>
              <Textarea
                id={`desc-${id}`}
                name="description"
                defaultValue={description ?? ""}
                maxLength={600}
                rows={1}
                className="h-9 min-h-9"
              />
            </div>

            <div className="grid w-28 shrink-0 gap-1.5">
              <Label htmlFor={`price-${id}`} className="text-xs">
                Preço (R$)
              </Label>
              <Input
                id={`price-${id}`}
                name="price_brl"
                defaultValue={fmt(priceCents)}
                inputMode="decimal"
                required
                className="h-9"
              />
            </div>

            <div className="grid w-28 shrink-0 gap-1.5">
              <Label htmlFor={`orig-${id}`} className="text-xs">
                De (riscado)
              </Label>
              <Input
                id={`orig-${id}`}
                name="original_price_brl"
                defaultValue={fmt(originalPriceCents)}
                inputMode="decimal"
                placeholder="—"
                className="h-9"
              />
            </div>

            <div className="grid w-44 shrink-0 gap-1.5">
              <Label htmlFor={`section-${id}`} className="text-xs">
                Seção
              </Label>
              <Input
                id={`section-${id}`}
                name="section"
                defaultValue={section ?? ""}
                maxLength={60}
                className="h-9"
              />
            </div>

            <div className="grid w-20 shrink-0 gap-1.5">
              <Label htmlFor={`serves-${id}`} className="text-xs">
                Serve
              </Label>
              <Input
                id={`serves-${id}`}
                name="serves_people"
                defaultValue={servesPeople ?? ""}
                inputMode="numeric"
                className="h-9"
              />
            </div>

            <div className="grid shrink-0 gap-1.5">
              <Label className="text-xs">Destaque</Label>
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-xs">
                <input type="checkbox" name="is_featured" defaultChecked={isFeatured} />
                Mais pedido
              </label>
            </div>

            <div className="grid shrink-0 gap-1.5">
              <Label className="text-xs invisible">.</Label>
              <div className="flex gap-1.5">
                <Button type="submit" size="sm" disabled={saving} className="h-9">
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="h-9"
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
          {state.error && (
            <p className="border-t border-border bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
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
      <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="48px" unoptimized />
        ) : (
          <UtensilsCrossed className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
          {isFeatured && (
            <Star className="h-3 w-3 shrink-0 fill-[color:var(--sun)] text-[color:var(--sun)]" />
          )}
          {name}
          {!isActive && <span className="text-[10px] text-muted-foreground">(pausado)</span>}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {section ? <span className="font-medium">{section} · </span> : null}
          {description ?? "—"}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="font-bold">{formatCents(priceCents)}</span>
        {hasPromo && (
          <span className="text-[10px] text-[color:var(--turtle)]">
            -{discountPct}% · <s className="text-muted-foreground">{formatCents(originalPriceCents)}</s>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Link
          href={`/parceiro/painel/cardapio/${id}/complementos`}
          aria-label="Complementos"
          title="Complementos"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5" />
        </Link>
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
