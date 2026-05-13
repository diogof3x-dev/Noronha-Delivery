"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBusiness, type BusinessState } from "@/app/actions/business";

const initial: BusinessState = { ok: false };

const TYPES = [
  { value: "restaurante", label: "Restaurante / lanchonete / bar" },
  { value: "mercado", label: "Mercado / mercearia" },
  { value: "farmacia", label: "Farmácia" },
  { value: "conveniencia", label: "Conveniência" },
  { value: "loja", label: "Loja / boutique" },
  { value: "operador_passeio", label: "Operador de passeio" },
  { value: "pousada", label: "Pousada / hospedagem" },
  { value: "locadora", label: "Aluguel (bike, scooter, equip.)" },
  { value: "servico", label: "Serviço (spa, lavanderia, pet, etc.)" },
];

const DISTRICTS = [
  "Vila dos Remédios",
  "Floresta Nova",
  "Floresta Velha",
  "Boldró",
  "Vila do Trinta",
  "Sueste",
  "Outro",
];

export function CreateBusinessForm({
  defaultName,
}: {
  defaultName?: string;
}) {
  const [state, action, pending] = useActionState(createBusiness, initial);

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <header>
        <h2 className="text-base font-semibold">Crie sua loja agora</h2>
        <p className="text-xs text-muted-foreground">
          Em 1 minuto. Você pode editar os detalhes (logo, capa, horários, fotos) depois.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome da loja *</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={defaultName ?? ""}
            placeholder="Ex: Mergulhão Bistrô"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="type">Tipo *</Label>
          <Select name="type" defaultValue="restaurante">
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="district">Bairro *</Label>
          <Select name="district" defaultValue="Vila dos Remédios">
            <SelectTrigger id="district">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Descrição curta</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            maxLength={600}
            placeholder="Ex: Comida regional com toque autoral. Especialista em frutos do mar fresquinhos."
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp da loja</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            maxLength={30}
            placeholder="(81) 99999-0000"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="avg_prep_minutes">Tempo de preparo (min)</Label>
          <Input
            id="avg_prep_minutes"
            name="avg_prep_minutes"
            inputMode="numeric"
            placeholder="30"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="delivery_fee_brl">Taxa de entrega (R$)</Label>
          <Input
            id="delivery_fee_brl"
            name="delivery_fee_brl"
            inputMode="decimal"
            placeholder="8,00"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="min_order_brl">Pedido mínimo (R$)</Label>
          <Input
            id="min_order_brl"
            name="min_order_brl"
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Criar loja e ir pro cardápio
          </>
        )}
      </Button>
    </form>
  );
}
