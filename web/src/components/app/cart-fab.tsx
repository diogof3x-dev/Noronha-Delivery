"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatCents } from "@/lib/format";

export function CartFab() {
  const pathname = usePathname();
  const count = useCart((s) => s.itemCount());
  const subtotal = useCart((s) => s.subtotalCents());
  const business = useCart((s) => s.business);

  if (count === 0) return null;
  if (pathname?.startsWith("/app/carrinho")) return null;
  if (pathname?.startsWith("/app/pedidos/")) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto w-full max-w-md px-4">
      <Link
        href="/app/carrinho"
        className="flex h-12 items-center justify-between gap-3 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
      >
        <span className="inline-flex items-center gap-2">
          <span className="relative inline-flex">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--sun)] px-1 text-[10px] font-bold text-foreground">
              {count}
            </span>
          </span>
          <span className="truncate">{business?.name ?? "Ver carrinho"}</span>
        </span>
        <span>{formatCents(subtotal)}</span>
      </Link>
    </div>
  );
}
