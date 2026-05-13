"use client";

import { useActionState, useState } from "react";
import { Check, ClipboardPaste, Globe, Loader2, Pencil } from "lucide-react";
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
import {
  addServiceManual,
  addServicesBulk,
  requestImportFromExternal,
  type CatalogState,
} from "@/app/actions/catalog";

const initial: CatalogState = { ok: false };

type Business = { id: string; name: string; type: string };

const MODES = [
  { id: "manual", label: "Inserir manualmente", icon: Pencil, sub: "Um item por vez" },
  { id: "bulk", label: "Colar em lote", icon: ClipboardPaste, sub: "Vários de uma vez" },
  { id: "external", label: "Importar de iFood/99/site", icon: Globe, sub: "Cole o link" },
] as const;

type Mode = (typeof MODES)[number]["id"];

export function NovoCardapioTabs({ businesses }: { businesses: Business[] }) {
  const [mode, setMode] = useState<Mode>("manual");
  const firstBizId = businesses[0]?.id ?? "";
  const [businessId, setBusinessId] = useState(firstBizId);

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="business_id_select">Loja</Label>
        <Select value={businessId} onValueChange={(v) => setBusinessId(v ?? "")}>
          <SelectTrigger id="business_id_select">
            <SelectValue placeholder="Selecione a loja" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => setMode(m.id)}
              className={
                "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors " +
                (active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40")
              }
            >
              <span
                className={
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                  (active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{m.label}</span>
                <span className="text-[11px] text-muted-foreground">{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {mode === "manual" && <ManualForm businessId={businessId} />}
      {mode === "bulk" && <BulkForm businessId={businessId} />}
      {mode === "external" && <ExternalImportForm businessId={businessId} />}
    </div>
  );
}

function ManualForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(addServiceManual, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="business_id" value={businessId} />

      <div className="grid gap-1.5">
        <Label htmlFor="name">Nome do item</Label>
        <Input id="name" name="name" required minLength={2} maxLength={160} placeholder="Ex: Pizza Margherita" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          placeholder="Molho da casa, mozarela de búfala, manjericão fresco."
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="price_brl">Preço (R$)</Label>
          <Input id="price_brl" name="price_brl" required inputMode="decimal" placeholder="65,00" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="original_price_brl">De (R$, opcional)</Label>
          <Input
            id="original_price_brl"
            name="original_price_brl"
            inputMode="decimal"
            placeholder="80,00"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="serves_people">Serve (pessoas)</Label>
          <Input id="serves_people" name="serves_people" inputMode="numeric" placeholder="1" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="section">Seção</Label>
          <Input id="section" name="section" maxLength={60} placeholder="Destaques, Pizzas, Bebidas..." />
        </div>
        <label className="inline-flex items-center gap-2 self-end rounded-lg border border-border bg-secondary/30 p-3 text-sm">
          <input type="checkbox" name="is_featured" />
          Marcar como destaque (Mais pedido)
        </label>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="image_url">URL da foto (opcional)</Label>
        <Input id="image_url" name="image_url" type="url" placeholder="https://..." />
        <p className="text-[11px] text-muted-foreground">
          Pra subir foto direto do PC, edite o item depois de criar.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !businessId} className="flex-1">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Adicionar ao cardápio"
          )}
        </Button>
      </div>
    </form>
  );
}

function BulkForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(addServicesBulk, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="business_id" value={businessId} />

      <div className="space-y-2 rounded-xl bg-secondary/40 p-3 text-xs">
        <p className="font-semibold">Formato (uma linha por item):</p>
        <pre className="whitespace-pre-wrap rounded bg-background p-2 text-[11px] leading-relaxed">{`Nome | Descrição | Preço
Pizza Margherita | Molho, mozarela, manjericão | 65,00
Pizza Calabresa | Calabresa, cebola roxa | 72,00
Coca 2L | | 15,00`}</pre>
        <p className="text-muted-foreground">
          O separador é a barra vertical <code>|</code>. Descrição é opcional (deixe vazia). Preço aceita
          vírgula ou ponto.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="default_section">Seção pra todos os itens (opcional)</Label>
        <Input id="default_section" name="default_section" maxLength={60} placeholder="Pizzas tradicionais" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="bulk">Cole as linhas do cardápio</Label>
        <Textarea id="bulk" name="bulk" required rows={10} className="font-mono text-sm" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending || !businessId} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importando...
          </>
        ) : (
          "Importar em lote"
        )}
      </Button>
    </form>
  );
}

function ExternalImportForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(requestImportFromExternal, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/10 p-6 text-center">
        <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-base font-semibold">Solicitação recebida</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Nossa equipe vai importar seu cardápio em até 24h e te avisa no WhatsApp.
          Enquanto isso, você já pode adicionar itens manualmente nas outras abas.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="business_id" value={businessId} />

      <div className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Como funciona</p>
        <p className="mt-1">
          Cole o link da sua loja no iFood, 99Food ou seu próprio site. Nossa equipe importa o
          cardápio inteiro (nomes, descrições, preços, fotos quando possível) e te avisa no
          WhatsApp em até 24h. Se preferir, cola direto o texto do cardápio no campo de baixo.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="source_url">URL do cardápio (iFood, 99, site)</Label>
        <Input
          id="source_url"
          name="source_url"
          type="url"
          placeholder="https://www.ifood.com.br/delivery/sua-cidade/sua-loja-xyz"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="pasted_menu">OU cole o cardápio inteiro aqui</Label>
        <Textarea
          id="pasted_menu"
          name="pasted_menu"
          rows={8}
          placeholder="Cole o texto do cardápio (pode ser screenshot OCR, copy/paste do PDF, etc)"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Observações pra nossa equipe (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Ex: cardápio do almoço só, ignorem as bebidas..."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending || !businessId} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando solicitação...
          </>
        ) : (
          "Solicitar importação"
        )}
      </Button>
    </form>
  );
}
