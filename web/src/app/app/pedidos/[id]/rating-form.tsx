"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rateOrder, type RatingState } from "@/app/actions/ratings";

const initial: RatingState = { ok: false };

const BUSINESS_TAGS = [
  "Comida boa",
  "Bem embalado",
  "Pontual",
  "Cardápio ótimo",
  "Atendimento top",
  "Vale o preço",
];

const DRIVER_TAGS = [
  "Rápido",
  "Educado",
  "Conhece a ilha",
  "Bem equipado",
  "Cordial",
  "Comida intacta",
];

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
  const [businessTags, setBusinessTags] = useState<Set<string>>(new Set());
  const [driverTags, setDriverTags] = useState<Set<string>>(new Set());

  if (state.ok) {
    return (
      <section className="rounded-2xl border-2 border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5 p-5 text-center">
        <Check className="mx-auto h-8 w-8 text-[color:var(--turtle)]" />
        <p className="mt-2 text-sm font-bold">Avaliação enviada! Valeu pelo feedback.</p>
        <p className="text-[11px] text-muted-foreground">
          Você ganhou pontos de fidelidade nesse pedido 🌊
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="business_stars" value={businessStars} />
      {hasDriver && <input type="hidden" name="driver_stars" value={driverStars} />}
      {Array.from(businessTags).map((t) => (
        <input key={`bt-${t}`} type="hidden" name="business_tags" value={t} />
      ))}
      {Array.from(driverTags).map((t) => (
        <input key={`dt-${t}`} type="hidden" name="driver_tags" value={t} />
      ))}

      <header>
        <h2 className="text-base font-bold">Avalie sua experiência</h2>
        <p className="text-xs text-muted-foreground">
          Sua nota ajuda outros clientes e dá feedback pro estabelecimento.
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estabelecimento
        </p>
        <StarRow value={businessStars} onChange={setBusinessStars} />
        {businessStars >= 4 && (
          <TagPicker tags={BUSINESS_TAGS} selected={businessTags} onChange={setBusinessTags} />
        )}
      </div>

      {hasDriver && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Entregador
          </p>
          <StarRow value={driverStars} onChange={setDriverStars} />
          {driverStars >= 4 && (
            <TagPicker tags={DRIVER_TAGS} selected={driverTags} onChange={setDriverTags} />
          )}
        </div>
      )}

      <Textarea
        name="comment"
        rows={3}
        maxLength={600}
        placeholder={
          businessStars > 0 && businessStars < 4
            ? "O que poderia ter sido melhor? (opcional)"
            : "Conta como foi (opcional)..."
        }
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
    <div className="flex gap-1">
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

function TagPicker({
  tags,
  selected,
  onChange,
}: {
  tags: string[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  function toggle(t: string) {
    const next = new Set(selected);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    onChange(next);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const active = selected.has(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-[color:var(--turtle)] bg-[color:var(--turtle)]/10 text-[color:var(--turtle)]"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {active ? "✓ " : ""}
            {t}
          </button>
        );
      })}
    </div>
  );
}
