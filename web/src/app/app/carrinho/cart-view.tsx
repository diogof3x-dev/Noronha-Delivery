"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-store";
import { formatCents } from "@/lib/format";
import { createOrder } from "@/app/actions/orders";
import { AddressPicker, type Geo } from "@/components/checkout/address-picker";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/checkout/payment-method";
import { CouponInput, type AppliedCoupon } from "@/components/checkout/coupon-input";
import { CpfNotaField } from "@/components/checkout/cpf-nota";

const SERVICE_FEE_BPS = 199;

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
  const [geo, setGeo] = useState<Geo | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [cpfNota, setCpfNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const totals = useMemo(() => {
    const deliveryFee = business?.deliveryFeeCents ?? 0;
    const discount = coupon?.discountCents ?? 0;
    const serviceFee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
    const total = Math.max(0, subtotal - discount) + deliveryFee + serviceFee;
    return { deliveryFee, discount, serviceFee, total };
  }, [business?.deliveryFeeCents, subtotal, coupon?.discountCents]);

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

  const minOrder = business.minOrderCents ?? 0;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  return (
    <div className="space-y-5 pb-40">
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
            Sacola
          </p>
          <h1 className="text-base font-bold tracking-tight">{business.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Limpar todos os itens?")) clear();
          }}
          aria-label="Limpar carrinho"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Itens adicionados
        </h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.lineId}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3"
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
            </li>
          ))}
        </ul>

        <Link
          href={`/app/restaurante/${business.slug}`}
          className="block text-center text-xs font-semibold text-primary hover:underline"
        >
          + Adicionar mais itens
        </Link>
      </section>

      <AddressPicker
        kind={destination}
        setKind={setDestination}
        label={destinationLabel}
        setLabel={setDestinationLabel}
        geo={geo}
        setGeo={setGeo}
      />

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <Label htmlFor="notes" className="text-sm font-semibold">
          Observações pro estabelecimento
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

      <PaymentMethodSelector value={payment} onChange={setPayment} />

      <CouponInput
        businessId={business.id}
        subtotalCents={subtotal}
        applied={coupon}
        onChange={setCoupon}
      />

      <CpfNotaField value={cpfNota} onChange={setCpfNota} />

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Resumo de valores
        </h2>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCents(subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-[color:var(--turtle)]">
            <span>Cupom {coupon?.code}</span>
            <span>-{formatCents(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxa de entrega</span>
          <span
            className={
              totals.deliveryFee === 0 ? "font-semibold text-[color:var(--turtle)]" : ""
            }
          >
            {totals.deliveryFee === 0 ? "Grátis" : formatCents(totals.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxa de serviço</span>
          <span>{formatCents(totals.serviceFee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span>{formatCents(totals.total)}</span>
        </div>
        {belowMin && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Pedido mínimo: {formatCents(minOrder)}. Faltam {formatCents(minOrder - subtotal)}.
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-primary/20 bg-background/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="mx-auto max-w-md">
          <Button
            size="lg"
            className="h-14 w-full text-base font-bold shadow-lg shadow-primary/40"
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
                  destinationGeo: geo ?? undefined,
                  paymentMethod: payment,
                  notes: notes || undefined,
                  couponCode: coupon?.code,
                  cpfNota: cpfNota || undefined,
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
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando pedido...
              </>
            ) : (
              <>
                Pagar agora · {formatCents(totals.total)}
              </>
            )}
          </Button>
          {belowMin && (
            <p className="mt-2 text-center text-[11px] text-destructive">
              Adicione mais {formatCents(minOrder - subtotal)} pra fechar o pedido
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
