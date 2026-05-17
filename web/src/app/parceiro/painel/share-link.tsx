"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

const PUBLIC_PATH: Record<string, string> = {
  restaurante: "/app/restaurante",
  mercado: "/app/restaurante",
  farmacia: "/app/restaurante",
  conveniencia: "/app/restaurante",
  loja: "/app/restaurante",
  pousada: "/app/pousada",
  residencia: "/app/casa",
  operador_passeio: "/app/passeio",
  locadora: "/app/aluguel",
  servico: "/app/servico",
};

export function ShareLinkPanel({
  type,
  slug,
  name,
}: {
  type: string;
  slug: string;
  name: string;
}) {
  const [copied, setCopied] = useState(false);
  const base = typeof window !== "undefined" ? window.location.origin : "https://noronhadelivery.com";
  const path = PUBLIC_PATH[type] ?? "/app/restaurante";
  const link = `${base}${path}/${slug}`;
  const waMessage = encodeURIComponent(
    `Oi! Já estamos no Noronha Delivery. Pede aqui no app:\n${link}`,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não consegui copiar");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Conheça ${name} no Noronha Delivery`,
          url: link,
        });
      } catch {
        /* user canceled */
      }
    } else {
      await copy();
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header>
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <Share2 className="h-4 w-4 text-primary" />
          Compartilhe sua loja
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Mande esse link pra seus clientes no WhatsApp, Instagram, story, em qualquer lugar.
        </p>
      </header>
      <div className="mt-3 break-all rounded-lg bg-secondary/40 p-3 font-mono text-xs">
        {link}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${waMessage}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          Enviar pelo WhatsApp
        </a>
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          {copied ? <Check className="h-4 w-4 text-[color:var(--turtle)]" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <a
          href={link}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
        >
          Ver como cliente ↗
        </a>
      </div>
    </section>
  );
}
