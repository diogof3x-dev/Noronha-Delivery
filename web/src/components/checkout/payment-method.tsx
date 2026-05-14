"use client";

import { Banknote, CreditCard, QrCode } from "lucide-react";

export type PaymentMethod = "pix" | "card" | "cash";

const OPTIONS: { value: PaymentMethod; label: string; sub: string; icon: typeof QrCode }[] = [
  { value: "pix", label: "PIX instantâneo", sub: "QR Code ou copia-cola", icon: QrCode },
  { value: "card", label: "Cartão · Apple Pay · Google Pay", sub: "Crédito ou débito no app", icon: CreditCard },
  { value: "cash", label: "Dinheiro na entrega", sub: "Pague direto pro entregador", icon: Banknote },
];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}) {
  return (
    <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <header>
        <h2 className="text-sm font-semibold">Forma de pagamento</h2>
      </header>
      <ul className="space-y-2">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const isActive = o.value === value;
          return (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => onChange(o.value)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{o.label}</p>
                  <p className="text-[11px] text-muted-foreground">{o.sub}</p>
                </div>
                <span
                  className={`h-4 w-4 rounded-full border ${
                    isActive ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
