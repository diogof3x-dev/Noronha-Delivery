"use client";

import { useState, useTransition } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createBoost } from "@/app/actions/promotions";

const BOOST_OPTIONS = [
  {
    kind: "home_feature" as const,
    label: "Destaque na home",
    desc: "Sua loja aparece na faixa de destaque acima de tudo na home do cliente",
    suggestedDaily: 5000,
  },
  {
    kind: "category_top" as const,
    label: "Topo da categoria",
    desc: "Primeira posição quando o cliente abre a sua categoria (ex: comida)",
    suggestedDaily: 2500,
  },
  {
    kind: "banner" as const,
    label: "Banner na busca",
    desc: "Banner colorido aparece em buscas relevantes",
    suggestedDaily: 1500,
  },
];

export function BoostForm({ businessId }: { businessId: string }) {
  const [kind, setKind] = useState<typeof BOOST_OPTIONS[number]["kind"]>("home_feature");
  const [days, setDays] = useState(7);
  const [pending, start] = useTransition();

  const selected = BOOST_OPTIONS.find((b) => b.kind === kind)!;

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await createBoost(fd);
          if (res.ok) toast.success("Boost ativado!");
          else toast.error(res.error);
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="business_id" value={businessId} />

      <div className="grid gap-2 md:grid-cols-3">
        {BOOST_OPTIONS.map((b) => (
          <label
            key={b.kind}
            className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 text-xs ${
              kind === b.kind ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={b.kind}
              checked={kind === b.kind}
              onChange={() => setKind(b.kind)}
              className="sr-only"
            />
            <span className="font-semibold">{b.label}</span>
            <span className="text-[11px] text-muted-foreground">{b.desc}</span>
            <span className="mt-1 text-[10px] text-muted-foreground">
              Sugerido R$ {(b.suggestedDaily / 100).toFixed(2)}/dia
            </span>
          </label>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="days" className="text-[10px] uppercase">Duração</Label>
          <select
            id="days"
            name="days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value={3}>3 dias</option>
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
          </select>
        </div>
        <div>
          <Label htmlFor="daily_budget_cents" className="text-[10px] uppercase">
            Orçamento diário (centavos, opcional)
          </Label>
          <Input
            id="daily_budget_cents"
            name="daily_budget_cents"
            type="number"
            min={500}
            placeholder={String(selected.suggestedDaily)}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <TrendingUp className="mr-2 h-3 w-3" />
        )}
        Ativar boost
      </Button>
    </form>
  );
}
