"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItemOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
};

export type CartItem = {
  serviceId: string;
  lineId: string;
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string | null;
  notes?: string;
  options?: CartItemOption[];
};

export type CartBusiness = {
  id: string;
  slug: string;
  name: string;
  deliveryFeeCents: number | null;
  minOrderCents: number | null;
  avgPrepMinutes: number | null;
  heroColor?: string;
};

type CartState = {
  business: CartBusiness | null;
  items: CartItem[];
  add: (business: CartBusiness, item: CartItem) => { replaced: boolean };
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  remove: (lineId: string) => void;
  setNotes: (lineId: string, notes: string) => void;
  clear: () => void;
  itemCount: () => number;
  subtotalCents: () => number;
};

function makeLineId(serviceId: string, options: CartItem["options"] | undefined): string {
  const sig = (options ?? [])
    .map((o) => `${o.groupId}:${o.optionId}`)
    .sort()
    .join("|");
  return `${serviceId}::${sig}`;
}

export function buildCartItem(
  base: Omit<CartItem, "lineId" | "options"> & { options?: CartItem["options"] },
): CartItem {
  return {
    ...base,
    options: base.options,
    lineId: makeLineId(base.serviceId, base.options),
  };
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      business: null,
      items: [],

      add: (business, item) => {
        const current = get();
        const sameBusiness = current.business?.id === business.id;

        if (!sameBusiness && current.items.length > 0) {
          set({ business, items: [item] });
          return { replaced: true };
        }

        const existing = current.items.find((i) => i.lineId === item.lineId);
        if (existing) {
          set({
            business,
            items: current.items.map((i) =>
              i.lineId === item.lineId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          });
        } else {
          set({ business, items: [...current.items, item] });
        }
        return { replaced: false };
      },

      increment: (lineId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),

      decrement: (lineId) =>
        set((s) => {
          const items = s.items
            .map((i) => (i.lineId === lineId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          return { items, business: items.length ? s.business : null };
        }),

      remove: (lineId) =>
        set((s) => {
          const items = s.items.filter((i) => i.lineId !== lineId);
          return { items, business: items.length ? s.business : null };
        }),

      setNotes: (lineId, notes) =>
        set((s) => ({
          items: s.items.map((i) => (i.lineId === lineId ? { ...i, notes } : i)),
        })),

      clear: () => set({ business: null, items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotalCents: () =>
        get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    }),
    {
      name: "nd:cart:v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
