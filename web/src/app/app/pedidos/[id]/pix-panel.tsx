"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";

export function PixPanel({
  qrCodeBase64,
  copyPaste,
  expiresAt,
  totalCents,
}: {
  qrCodeBase64: string | null;
  copyPaste: string;
  expiresAt: string | null;
  totalCents: number;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Pague com PIX
        </p>
        <p className="text-2xl font-bold">{formatCents(totalCents)}</p>
        {expiresAt && (
          <p className="text-xs text-muted-foreground">
            Expira em {new Date(expiresAt).toLocaleString("pt-BR")}
          </p>
        )}
      </header>

      {qrCodeBase64 && (
        <div className="flex justify-center rounded-xl bg-white p-3">
          <Image
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            width={220}
            height={220}
            unoptimized
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium">Ou copie e cole o código:</p>
        <div className="overflow-hidden rounded-lg border border-border bg-background p-2 text-[10px] break-all font-mono">
          {copyPaste}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            navigator.clipboard.writeText(copyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copiar código PIX
            </>
          )}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        A página atualiza automaticamente quando o pagamento for confirmado.
      </p>
    </section>
  );
}
