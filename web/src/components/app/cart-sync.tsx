"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-store";
import { saveCart, loadCart } from "@/app/actions/cart-sync";

/**
 * Sincroniza o carrinho zustand (localStorage) com o servidor:
 *  - Mount: se localStorage tá vazio mas servidor tem, hidrata local.
 *  - Mudanças: debounce 1.5s, manda pro servidor.
 *  - Logout: handled separadamente pelo signOut.
 */
export function CartSync({ isAuthed }: { isAuthed: boolean }) {
  const hydratedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthed || hydratedRef.current) return;
    hydratedRef.current = true;

    const state = useCart.getState();
    // se já tem item localmente, sobe pro server (não sobrescreve)
    if (state.items.length > 0 && state.business) {
      void saveCart({ business: state.business, items: state.items });
      return;
    }
    // local vazio: tenta puxar do server
    loadCart().then((res) => {
      if (res.ok && res.remote && res.remote.business && res.remote.items.length > 0) {
        useCart.getState().replace(res.remote.business, res.remote.items);
      }
    });
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    const unsub = useCart.subscribe((state) => {
      if (!hydratedRef.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void saveCart({ business: state.business, items: state.items });
      }, 1500);
    });
    return () => {
      unsub();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [isAuthed]);

  return null;
}
