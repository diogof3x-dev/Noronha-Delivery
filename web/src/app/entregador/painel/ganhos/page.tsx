import { redirect } from "next/navigation";
import { Banknote, Clock, TrendingUp } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EntregadorGanhos() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("balance_cents")
    .eq("owner_id", user.id)
    .is("business_id", null)
    .maybeSingle();

  const balance = account?.balance_cents ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ganhos
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Carteira</h1>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Card title="Saldo disponível" value={formatCents(balance)} sub="Pra saque PIX" icon={Banknote} />
        <Card title="Hoje" value={formatCents(0)} sub="0 entregas" icon={Clock} />
        <Card title="Mês" value={formatCents(0)} sub="Receita do mês" icon={TrendingUp} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Solicitar saque
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Solicite saque PIX a qualquer momento sem espera. A chave PIX é a que você
          cadastrou em <strong>Meu cadastro</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled>Solicitar saque (em breve)</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Extrato
        </h2>
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sem movimentação ainda. Cada entrega concluída entra automaticamente como crédito.
        </p>
      </section>
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
