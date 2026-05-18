import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Award, Gem, Sparkles, Trophy } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const TIER_META: Record<
  string,
  { label: string; color: string; min: number; perks: string[] }
> = {
  bronze: {
    label: "Bronze",
    color: "#D97706",
    min: 0,
    perks: ["Acesso ao app", "Cupom VOLTA10 após cada entrega"],
  },
  prata: {
    label: "Prata",
    color: "#94A3B8",
    min: 100,
    perks: ["Tudo do Bronze", "Frete grátis em pedidos acima de R$60"],
  },
  ouro: {
    label: "Ouro",
    color: "#F4B642",
    min: 500,
    perks: ["Tudo do Prata", "Cupom mensal de R$20 (sem mínimo)"],
  },
  diamante: {
    label: "Diamante",
    color: "#2BB673",
    min: 1500,
    perks: [
      "Tudo do Ouro",
      "Suporte prioritário",
      "Acesso antecipado a lojas novas",
      "Bônus de aniversário R$50",
    ],
  },
};

const TIERS = ["bronze", "prata", "ouro", "diamante"];

export default async function PontosPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/perfil/pontos");

  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("customer_id", user.id)
    .maybeSingle();

  const points = loyalty?.points_balance ?? 0;
  const total = loyalty?.points_total ?? 0;
  const tier = loyalty?.tier ?? "bronze";
  const orders = loyalty?.paid_orders_count ?? 0;
  const spent = loyalty?.total_spent_cents ?? 0;
  const tierMeta = TIER_META[tier];

  const tierIndex = TIERS.indexOf(tier);
  const nextTier = tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null;
  const nextMeta = nextTier ? TIER_META[nextTier] : null;
  const pointsToNext = nextMeta ? Math.max(0, nextMeta.min - total) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app/perfil"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Perfil
          </p>
          <h1 className="text-base font-bold tracking-tight">Pontos & Status</h1>
        </div>
      </div>

      <section
        className="rounded-3xl border-2 p-5"
        style={{ borderColor: `${tierMeta.color}66`, background: `${tierMeta.color}0F` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Status atual
            </p>
            <p
              className="mt-1 text-3xl font-bold tracking-tight"
              style={{ color: tierMeta.color }}
            >
              {tierMeta.label}
            </p>
          </div>
          <Trophy className="h-12 w-12" style={{ color: tierMeta.color }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Saldo de pontos" value={points.toLocaleString("pt-BR")} />
          <Stat label="Pedidos pagos" value={String(orders)} />
          <Stat label="Total gasto" value={formatCents(spent)} />
        </div>

        {nextMeta && pointsToNext > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Próximo: {nextMeta.label}</span>
              <span>
                <strong>{pointsToNext}</strong> pts faltam
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, (total / nextMeta.min) * 100)}%`,
                  background: nextMeta.color,
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Award className="h-3.5 w-3.5" />
          O que você ganha com {tierMeta.label}
        </h2>
        <ul className="space-y-1.5">
          {tierMeta.perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Sparkles
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: tierMeta.color }}
              />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Todos os tiers
        </h2>
        {TIERS.map((t) => {
          const m = TIER_META[t]!;
          const isCurrent = t === tier;
          return (
            <div
              key={t}
              className={`rounded-xl border p-3 ${
                isCurrent ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gem className="h-4 w-4" style={{ color: m.color }} />
                  <span className="text-sm font-bold" style={{ color: m.color }}>
                    {m.label}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      você
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {m.min}+ pontos
                </span>
              </div>
              <ul className="mt-1 ml-6 text-[11px] text-muted-foreground">
                {m.perks.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          🌊 <strong>Como ganha pontos:</strong> a cada R$ 1 pago em pedido entregue,
          você ganha <strong>1 ponto</strong>. Pontos contam pra subir de status; status
          desbloqueia benefícios. Cupom de retorno (10% off) é automático em toda entrega
          — chega por push e fica salvo aqui.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/60 p-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold">{value}</p>
    </div>
  );
}
