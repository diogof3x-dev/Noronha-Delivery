"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveCustomerAddress } from "@/app/actions/customer-addresses";

type AddressRow = {
  id: string;
  label: string;
  kind: "pousada" | "praia" | "barco" | "casa" | "outro";
  address: string;
  notes: string | null;
  is_default: boolean;
};

const KINDS: AddressRow["kind"][] = ["pousada", "praia", "barco", "casa", "outro"];

const KIND_LABEL: Record<AddressRow["kind"], string> = {
  pousada: "Pousada",
  praia: "Praia",
  barco: "Barco",
  casa: "Casa",
  outro: "Outro",
};

export function AddressFormCard({
  initial,
  compact,
}: {
  initial?: AddressRow;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return compact ? (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Pencil className="mr-1 h-3 w-3" />
        Editar
      </Button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-4 py-4 text-sm font-semibold hover:border-primary/40 hover:bg-muted/30"
      >
        <Plus className="h-4 w-4 text-primary" />
        Adicionar endereço
      </button>
    );
  }

  return (
    <AddressFormInner
      initial={initial}
      onDone={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}

function AddressFormInner({
  initial,
  onDone,
  onCancel,
}: {
  initial?: AddressRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [kind, setKind] = useState<AddressRow["kind"]>(initial?.kind ?? "pousada");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false);
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) =>
        start(async () => {
          if (initial?.id) fd.set("id", initial.id);
          fd.set("kind", kind);
          fd.set("is_default", isDefault ? "true" : "");
          const res = await saveCustomerAddress(fd);
          if (res.ok) {
            toast.success(initial ? "Endereço atualizado" : "Endereço salvo");
            onDone();
          } else {
            toast.error(res.error);
          }
        })
      }
      className="space-y-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {initial ? "Editar endereço" : "Novo endereço"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <Label htmlFor="label" className="text-[10px] uppercase tracking-[0.18em]">
          Apelido
        </Label>
        <Input
          id="label"
          name="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          maxLength={60}
          placeholder="Ex: Pousada do Sol, Trabalho, Casa"
        />
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-[0.18em]">Tipo</Label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                kind === k
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card"
              }`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-[10px] uppercase tracking-[0.18em]">
          Endereço
        </Label>
        <Input
          id="address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          minLength={3}
          maxLength={300}
          placeholder="Ex: Pousada Mar Aberto, Vila do Trinta"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          Localização será detectada automaticamente pra ajudar o motoboy.
        </p>
      </div>

      <div>
        <Label htmlFor="notes" className="text-[10px] uppercase tracking-[0.18em]">
          Observação (opcional)
        </Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Ex: Portão azul, casa 2. Tem cachorro mas é amigável."
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-3.5 w-3.5"
        />
        Endereço padrão (vem selecionado no checkout)
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !label || !address}>
          {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {initial ? "Salvar alterações" : "Salvar endereço"}
        </Button>
      </div>
    </form>
  );
}
