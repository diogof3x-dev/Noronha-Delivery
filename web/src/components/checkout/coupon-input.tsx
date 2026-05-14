"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Ticket, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateCoupon } from "@/app/actions/coupon";
import { formatCents } from "@/lib/format";

export type AppliedCoupon = {
  code: string;
  couponId: string;
  discountCents: number;
};

export function CouponInput({
  businessId,
  subtotalCents,
  applied,
  onChange,
}: {
  businessId: string;
  subtotalCents: number;
  applied: AppliedCoupon | null;
  onChange: (c: AppliedCoupon | null) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleApply() {
    if (!code.trim()) return;
    setError(null);
    start(async () => {
      const res = await validateCoupon({
        code: code.trim(),
        subtotalCents,
        businessId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onChange({ code: res.code, couponId: res.couponId, discountCents: res.discountCents });
      setCode("");
    });
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/10 p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
          <Ticket className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{applied.code}</p>
          <p className="text-xs text-muted-foreground">
            -{formatCents(applied.discountCents)} de desconto
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remover cupom"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Cupom de desconto</p>
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Digite o código"
          maxLength={40}
          className="uppercase"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={pending || !code.trim()}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
