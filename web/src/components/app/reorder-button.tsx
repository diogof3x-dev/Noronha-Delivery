"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useCart, buildCartItem } from "@/lib/cart-store";
import { prepareReorder } from "@/app/actions/reorder";

type Variant = "primary" | "ghost" | "compact";

export function ReorderButton({
  orderId,
  variant = "primary",
}: {
  orderId: string;
  variant?: Variant;
}) {
  const [pending, start] = useTransition();
  const replace = useCart((s) => s.replace);
  const router = useRouter();

  function handleClick() {
    start(async () => {
      const res = await prepareReorder({ orderId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (!res.businessActive) {
        toast.error("Essa loja está pausada no momento");
        return;
      }

      const items = res.items.map((i) =>
        buildCartItem({
          serviceId: i.serviceId,
          name: i.name,
          priceCents: i.priceCents,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
          notes: i.notes,
          options: i.options,
        }),
      );
      replace(res.business, items);

      if (res.skipped.length > 0) {
        toast.success(
          `Adicionado ao carrinho. ${res.skipped.length} item${
            res.skipped.length === 1 ? "" : "s"
          } não disponível.`,
        );
      } else {
        toast.success("Carrinho preparado!");
      }
      router.push("/app/carrinho");
    });
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Repeat className="h-3 w-3" />
        )}
        Pedir de novo
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Repeat className="h-3.5 w-3.5" />
        )}
        Pedir de novo
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Repeat className="h-4 w-4" />
      )}
      Pedir de novo
    </button>
  );
}
