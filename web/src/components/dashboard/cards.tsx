import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentType } from "react";

export type KpiTone = "primary" | "turtle" | "sun" | "destructive" | "muted";

const TONE_BORDER: Record<KpiTone, string> = {
  primary: "border-primary/30 bg-primary/5 text-primary",
  turtle:
    "border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 text-[color:var(--turtle)]",
  sun: "border-[color:var(--sun)]/30 bg-[color:var(--sun)]/5 text-[color:var(--sun)]",
  destructive: "border-destructive/30 bg-destructive/5 text-destructive",
  muted: "border-border bg-muted/30 text-muted-foreground",
};

type IconType = ComponentType<{ className?: string }>;

/**
 * Card com label + ícone na mesma linha, value grande, sub opcional embaixo.
 * Variante usada em /parceiro/painel, /parceiro/painel/vendas, /entregador/painel/ganhos.
 */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: IconType;
  tone?: KpiTone;
}) {
  const toneClass = tone ? TONE_BORDER[tone] : "border-border bg-card";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold uppercase tracking-[0.18em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/**
 * Card com ícone no topo, label uppercase pequena, value bold.
 * Variante mais compacta, usada em /super-admin/operacao e /super-admin/financeiro.
 */
export function KpiTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: IconType;
  tone?: KpiTone;
}) {
  const toneClass = tone ? TONE_BORDER[tone] : "border-border bg-card";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <Icon className="mb-2 h-4 w-4" />
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/**
 * Stat pequeno: label + value + sub opcional + icon opcional.
 * Substitui as 5 variantes inline de Stat espalhadas.
 */
export function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: IconType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.18em]">{label}</span>
        {Icon && <Icon className="h-3 w-3" />}
      </div>
      <p className={`font-bold ${sub || Icon ? "text-lg" : "text-sm"}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/**
 * Card linkado com ícone à direita, indicador de seta no hover.
 * Único uso é /parceiro/painel home.
 */
export function SummaryCard({
  label,
  value,
  sub,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  href: string;
  icon: IconType;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <ArrowUpRight className="hidden h-3 w-3 group-hover:block" />
    </Link>
  );
}
