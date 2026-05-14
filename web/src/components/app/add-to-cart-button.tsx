"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildCartItem, useCart, type CartBusiness } from "@/lib/cart-store";

type Props = {
  business: CartBusiness;
  item: { serviceId: string; name: string; priceCents: number; imageUrl?: string | null };
  outOfStock?: boolean;
  hasOptions?: boolean;
};

export function AddToCartButton({ business, item, outOfStock, hasOptions }: Props) {
  const add = useCart((s) => s.add);
  const currentBusiness = useCart((s) => s.business);
  const items = useCart((s) => s.items);
  const [open, setOpen] = useState(false);

  const simpleLineId = `${item.serviceId}::`;
  const existing = items.find((i) => i.lineId === simpleLineId);
  const conflict =
    currentBusiness && currentBusiness.id !== business.id && items.length > 0;

  function handleClick() {
    if (conflict) {
      setOpen(true);
      return;
    }
    add(business, buildCartItem({ ...item, quantity: 1 }));
    toast.success(`${item.name} adicionado`);
  }

  function handleReplace() {
    add(business, buildCartItem({ ...item, quantity: 1 }));
    toast.success(`Carrinho substituído com ${item.name}`);
    setOpen(false);
  }

  if (hasOptions && !outOfStock) {
    return (
      <Link
        href={`/app/produto/${item.serviceId}`}
        aria-label={`Personalizar ${item.name}`}
        className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="h-4 w-4" />
      </Link>
    );
  }

  if (existing && !hasOptions) {
    return <QuantitySteps lineId={simpleLineId} quantity={existing.quantity} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={outOfStock}
        aria-label={`Adicionar ${item.name}`}
        className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar de restaurante?</DialogTitle>
            <DialogDescription>
              Você já tem itens de <strong>{currentBusiness?.name}</strong> no carrinho.
              Adicionar este item vai limpar o carrinho atual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Manter atual
            </Button>
            <Button onClick={handleReplace}>Substituir carrinho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuantitySteps({ lineId, quantity }: { lineId: string; quantity: number }) {
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);

  return (
    <div className="absolute -bottom-2 -right-2 inline-flex h-8 items-center gap-1 rounded-full bg-primary text-primary-foreground shadow-md">
      <button
        type="button"
        onClick={() => decrement(lineId)}
        className="inline-flex h-8 w-8 items-center justify-center"
        aria-label="Diminuir"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[1.5rem] text-center text-xs font-bold">{quantity}</span>
      <button
        type="button"
        onClick={() => increment(lineId)}
        className="inline-flex h-8 w-8 items-center justify-center"
        aria-label="Aumentar"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
