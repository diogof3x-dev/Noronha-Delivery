"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareBusinessButton({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Conheça ${name} no Noronha Delivery`,
          url,
        });
        return;
      } catch {
        /* user canceled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não consegui copiar o link");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Compartilhar loja"
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
      }
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
