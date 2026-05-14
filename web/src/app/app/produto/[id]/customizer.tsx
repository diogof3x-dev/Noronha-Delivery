"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildCartItem,
  useCart,
  type CartBusiness,
  type CartItemOption,
} from "@/lib/cart-store";
import { formatCents } from "@/lib/format";

type Option = {
  id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
  is_default: boolean;
};

type Group = {
  id: string;
  name: string;
  kind: "required" | "optional";
  minChoices: number;
  maxChoices: number;
  options: Option[];
};

export function ProductCustomizer({
  business,
  item,
  groups,
}: {
  business: CartBusiness;
  item: { serviceId: string; name: string; priceCents: number; imageUrl?: string | null };
  groups: Group[];
}) {
  const add = useCart((s) => s.add);
  const currentBusiness = useCart((s) => s.business);
  const cartItems = useCart((s) => s.items);
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of groups) {
      const defaults = g.options.filter((o) => o.is_default).map((o) => o.id);
      init[g.id] = defaults.slice(0, g.maxChoices);
    }
    return init;
  });

  const totals = useMemo(() => {
    let delta = 0;
    for (const g of groups) {
      const ids = selected[g.id] ?? [];
      for (const optId of ids) {
        const opt = g.options.find((o) => o.id === optId);
        if (opt) delta += opt.price_delta_cents;
      }
    }
    const unit = item.priceCents + delta;
    return { unit, total: unit * quantity, delta };
  }, [groups, selected, quantity, item.priceCents]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    for (const g of groups) {
      const count = (selected[g.id] ?? []).length;
      if (g.kind === "required" && count < Math.max(1, g.minChoices)) {
        errors.push(`${g.name}: escolha ao menos ${Math.max(1, g.minChoices)}`);
      }
      if (count > g.maxChoices) {
        errors.push(`${g.name}: máximo ${g.maxChoices}`);
      }
    }
    return errors;
  }, [groups, selected]);

  function toggleOption(group: Group, optionId: string) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.includes(optionId);
      let next: string[];
      if (group.maxChoices === 1) {
        next = isSelected ? [] : [optionId];
      } else if (isSelected) {
        next = current.filter((id) => id !== optionId);
      } else {
        if (current.length >= group.maxChoices) {
          next = [...current.slice(1), optionId];
        } else {
          next = [...current, optionId];
        }
      }
      return { ...prev, [group.id]: next };
    });
  }

  function handleAdd() {
    if (validation.length) {
      toast.error(validation[0]);
      return;
    }
    const conflict =
      currentBusiness && currentBusiness.id !== business.id && cartItems.length > 0;
    if (conflict) {
      const ok = confirm(
        `Você já tem itens de ${currentBusiness?.name}. Substituir pelo carrinho dessa loja?`,
      );
      if (!ok) return;
    }

    const options: CartItemOption[] = [];
    for (const g of groups) {
      for (const optId of selected[g.id] ?? []) {
        const opt = g.options.find((o) => o.id === optId);
        if (opt) {
          options.push({
            groupId: g.id,
            groupName: g.name,
            optionId: opt.id,
            optionName: opt.name,
            priceDeltaCents: opt.price_delta_cents,
          });
        }
      }
    }

    add(
      business,
      buildCartItem({
        serviceId: item.serviceId,
        name: item.name,
        priceCents: totals.unit,
        imageUrl: item.imageUrl,
        quantity,
        options,
      }),
    );
    toast.success(`${item.name} no carrinho`);
    router.push("/app/carrinho");
  }

  return (
    <>
      <div className="space-y-4 pb-32">
        {groups.map((g) => (
          <section key={g.id} className="rounded-2xl border border-border bg-card">
            <header className="flex items-start justify-between gap-3 p-4 pb-2">
              <div>
                <h2 className="text-sm font-bold">{g.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {g.kind === "required"
                    ? `Escolha ${g.minChoices > 0 ? g.minChoices : 1}${g.maxChoices > 1 ? ` até ${g.maxChoices}` : ""}`
                    : `Até ${g.maxChoices}`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  g.kind === "required"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {g.kind === "required" ? "OBRIGATÓRIO" : "OPCIONAL"}
              </span>
            </header>
            <ul className="divide-y divide-border">
              {g.options.map((opt) => {
                const isSelected = (selected[g.id] ?? []).includes(opt.id);
                const isRadio = g.maxChoices === 1;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => toggleOption(g, opt.id)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{opt.name}</p>
                        {opt.price_delta_cents > 0 && (
                          <p className="text-xs text-muted-foreground">
                            + {formatCents(opt.price_delta_cents)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center ${
                          isRadio ? "rounded-full" : "rounded"
                        } border ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                        aria-hidden
                      >
                        {isSelected && (
                          <span
                            className={`block h-2 w-2 ${
                              isRadio ? "rounded-full" : ""
                            } bg-primary-foreground`}
                          />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
              {g.options.length === 0 && (
                <li className="px-4 py-3 text-xs text-muted-foreground">
                  Lojista ainda não adicionou opções neste grupo.
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="inline-flex h-12 items-center gap-1 rounded-full border border-border bg-background px-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Diminuir"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Aumentar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="lg"
            className="h-12 flex-1 text-sm"
            disabled={validation.length > 0}
            onClick={handleAdd}
          >
            Adicionar · {formatCents(totals.total)}
          </Button>
        </div>
      </div>
    </>
  );
}
