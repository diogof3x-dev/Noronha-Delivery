"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rateOrder, type RatingState } from "@/app/actions/ratings";

const initial: RatingState = { ok: false };

export function RatingForm({
  orderId,
  hasDriver,
}: {
  orderId: string;
  hasDriver: boolean;
}) {
  const [state, action, pending] = useActionState(rateOrder, initial);
  const [businessStars, setBusinessStars] = useState(0);
  const [driverStars, setDriverStars] = useState(0);

  if (state.ok) {
    return (
      <section className="rounded-2xl border-2 border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5 p-5 text-center">
        <Check className="mx-auto h-8 w-8 text-[color:var(--turtle)]" />
        <p className="mt-2 text-sm font-bold">Avaliação enviada! Valeu pelo feedback.</p>
      </section>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="business_stars" value={businessStars} />
      {hasDriver && <input type="hidden" name="driver_stars" value={driverStars} />}

      <header>
        <h2 className="text-base font-bold">Avalie sua experiência</h2>
        <p className="text-xs text-muted-foreground">
          Sua nota ajuda outros clientes e dá feedback pro estabelecimento.
        </p>
      </header>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estabelecimento
        </p>
        <StarRow value={businessStars} onChange={setBusinessStars} />
      </div>

      {hasDriver && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Entregador
          </p>
          <StarRow value={driverStars} onChange={setDriverStars} />
        </div>
      )}

      <Textarea
        name="comment"
        rows={3}
        maxLength={600}
        placeholder="Conta como foi (opcional)..."
      />

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending || businessStars === 0} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
          </>
        ) : (
          "Enviar avaliação"
        )}
      </Button>
    </form>
  );
}

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-2 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrelas`}
          className="transition-transform active:scale-90"
        >
          <Star
            className={`h-9 w-9 ${
              n <= value
                ? "fill-[color:var(--sun)] text-[color:var(--sun)]"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
