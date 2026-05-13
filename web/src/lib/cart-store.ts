"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  serviceId: string;
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string | null;
  notes?: string;
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
  increment: (serviceId: string) => void;
  decrement: (serviceId: string) => void;
  remove: (serviceId: string) => void;
  setNotes: (serviceId: string, notes: string) => void;
  clear: () => void;
  itemCount: () => number;
  subtotalCents: () => number;
};

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

        const existing = current.items.find((i) => i.serviceId === item.serviceId);
        if (existing) {
          set({
            business,
            items: current.items.map((i) =>
              i.serviceId === item.serviceId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          });
        } else {
          set({ business, items: [...current.items, item] });
        }
        return { replaced: false };
      },

      increment: (serviceId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.serviceId === serviceId ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),

      decrement: (serviceId) =>
        set((s) => {
          const items = s.items
            .map((i) =>
              i.serviceId === serviceId ? { ...i, quantity: i.quantity - 1 } : i,
            )
            .filter((i) => i.quantity > 0);
          return { items, business: items.length ? s.business : null };
        }),

      remove: (serviceId) =>
        set((s) => {
          const items = s.items.filter((i) => i.serviceId !== serviceId);
          return { items, business: items.length ? s.business : null };
        }),

      setNotes: (serviceId, notes) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.serviceId === serviceId ? { ...i, notes } : i,
          ),
        })),

      clear: () => set({ business: null, items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotalCents: () =>
        get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    }),
    {
      name: "nd:cart:v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
