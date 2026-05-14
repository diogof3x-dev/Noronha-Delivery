"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/cart-store";
import { formatCents } from "@/lib/format";
import { createOrder } from "@/app/actions/orders";

const PAYMENT_OPTIONS = [
  { value: "pix", label: "PIX instantâneo" },
  { value: "card", label: "Cartão crédito/débito" },
  { value: "cash", label: "Dinheiro na entrega" },
];

const DESTINATION_OPTIONS = [
  { value: "pousada", label: "Minha pousada" },
  { value: "praia", label: "Praia onde estou" },
  { value: "barco", label: "Barco / marina" },
  { value: "outro", label: "Outro endereço" },
];

export function CartView() {
  const business = useCart((s) => s.business);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalCents());
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const [destination, setDestination] = useState("pousada");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [payment, setPayment] = useState("pix");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!business || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Seu carrinho está vazio</h1>
          <p className="text-sm text-muted-foreground">
            Que tal escolher um restaurante e começar?
          </p>
        </div>
        <Link href="/app/comida" className={cn(buttonVariants(), "h-10 px-4")}>
          Ver restaurantes
        </Link>
      </div>
    );
  }

  const deliveryFee = business.deliveryFeeCents ?? 0;
  const total = subtotal + deliveryFee;
  const minOrder = business.minOrderCents ?? 0;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href={`/app/restaurante/${business.slug}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pedido em
          </p>
          <h1 className="text-base font-bold tracking-tight">{business.name}</h1>
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar carrinho"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Itens
        </h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.serviceId}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCents(item.priceCents)} × {item.quantity}
                </p>
                {item.options && item.options.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                    {item.options.map((opt) => (
                      <li key={`${opt.groupId}-${opt.optionId}`}>
                        · {opt.optionName}
                        {opt.priceDeltaCents > 0
                          ? ` (+${formatCents(opt.priceDeltaCents)})`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background">
                <button
                  type="button"
                  onClick={() =>
                    item.quantity > 1 ? decrement(item.lineId) : remove(item.lineId)
                  }
                  className="inline-flex h-8 w-8 items-center justify-center"
                  aria-label="Diminuir"
                >
                  {item.quantity > 1 ? (
                    <Minus className="h-3.5 w-3.5" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  )}
                </button>
                <span className="min-w-[1.5rem] text-center text-xs font-bold">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => increment(item.lineId)}
                  className="inline-flex h-8 w-8 items-center justify-center"
                  aria-label="Aumentar"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="w-16 shrink-0 text-right text-sm font-bold">
                {formatCents(item.priceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Entregar em
        </h2>
        <Select value={destination} onValueChange={(v) => setDestination(v ?? "pousada")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DESTINATION_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor="dest-label" className="sr-only">
          Detalhes da entrega
        </Label>
        <Textarea
          id="dest-label"
          value={destinationLabel}
          onChange={(e) => setDestinationLabel(e.target.value)}
          placeholder="Ponto de referência (ex: Pousada do Vale, quarto 5; ou Praia do Sancho, barraca azul)"
          rows={2}
          maxLength={300}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Forma de pagamento
        </h2>
        <Select value={payment} onValueChange={(v) => setPayment(v ?? "pix")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Observações
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Sem cebola, ponto da carne, etc."
          rows={2}
          maxLength={500}
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCents(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entrega</span>
          <span>{formatCents(deliveryFee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span>{formatCents(total)}</span>
        </div>
        {belowMin && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Pedido mínimo: {formatCents(minOrder)}. Faltam {formatCents(minOrder - subtotal)}.
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={belowMin || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await createOrder({
              businessId: business.id,
              items: items.map((i) => ({
                serviceId: i.serviceId,
                name: i.name,
                priceCents: i.priceCents,
                quantity: i.quantity,
                notes: i.notes,
                options: i.options,
              })),
              destinationKind: destination as "pousada" | "praia" | "barco" | "outro",
              destinationLabel: destinationLabel || undefined,
              paymentMethod: payment as "pix" | "card" | "cash",
              notes: notes || undefined,
            });
            if (!res.ok) {
              if (res.error.toLowerCase().includes("login")) {
                router.push("/entrar?next=/app/carrinho");
                return;
              }
              setError(res.error);
              return;
            }
            clear();
            router.push(`/app/pedidos/${res.orderId}`);
          });
        }}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando pedido...
          </>
        ) : (
          <>Finalizar pedido — {formatCents(total)}</>
        )}
      </Button>
    </div>
  );
}
