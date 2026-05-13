import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Clock,
  ListChecks,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUICK_ACTIONS = [
  { href: "/parceiro/painel/pedidos", label: "Ver pedidos", icon: ListChecks },
  { href: "/parceiro/painel/cardapio", label: "Editar cardápio", icon: UtensilsCrossed },
  { href: "/parceiro/painel/vendas", label: "Solicitar saque", icon: Banknote },
];

export default async function ParceiroPainelHome() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, type, is_active, is_verified, district, avg_prep_minutes, delivery_fee_cents")
    .eq("owner_id", user.id);

  const business = businesses?.[0];

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Visão geral
        </p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {business?.name ?? "Sua loja"}
        </h1>
        {business && (
          <p className="text-sm text-muted-foreground">
            {business.district} ·{" "}
            {business.is_active ? (
              <span className="inline-flex items-center gap-1 text-[color:var(--turtle)]">
                <BadgeCheck className="h-3.5 w-3.5" /> Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Pausada
              </span>
            )}
          </p>
        )}
      </header>

      {!business && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">Nenhuma loja cadastrada ainda</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta está aprovada mas a loja ainda não foi criada. Fale com o suporte pelo
            WhatsApp pra liberarmos seu cadastro completo.
          </p>
        </div>
      )}

      {business && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card title="Pedidos hoje" value="0" sub="Aguardando primeiro" icon={ListChecks} />
            <Card title="Receita 7d" value="R$ 0" sub="Líquido de taxa" icon={Banknote} />
            <Card title="Avaliação" value="—" sub="Novo na plataforma" icon={Star} />
            <Card title="Tempo médio" value={`${business.avg_prep_minutes ?? "—"} min`} sub="De preparo" icon={Clock} />
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ações rápidas
            </h2>
            <ul className="grid gap-3 md:grid-cols-3">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold">{a.label}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Painel completo em construção
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Em breve aqui: pedidos em tempo real com Realtime, gráficos de venda,
              ranking de produtos, repasse D+8 e solicitação de saque PIX integrado ao
              Mercado Pago. Por enquanto, fale com o suporte pelo WhatsApp se precisar de
              qualquer ajuste no seu cadastro.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.18em]">{title}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
