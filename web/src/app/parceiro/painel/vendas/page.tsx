import { redirect } from "next/navigation";
import { Banknote, Clock, TrendingUp } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelVendas() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("balance_cents, business_id")
    .eq("owner_id", user.id);

  const balance = (account ?? []).reduce((sum, a) => sum + (a.balance_cents ?? 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Vendas
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {isAdmin ? "Financeiro consolidado" : "Suas vendas"}
        </h1>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Card title="Saldo disponível" value={formatCents(balance)} sub="Após D+8, líquido de taxa" icon={Banknote} />
        <Card title="Saldo a liberar" value={formatCents(0)} sub="Pedidos em janela D+1 a D+7" icon={Clock} />
        <Card title="Receita 30d" value={formatCents(0)} sub="Sem pedidos ainda" icon={TrendingUp} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Solicitar saque
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Solicite saque PIX do saldo disponível. Valor cai na conta cadastrada em até 1
          dia útil. Sem taxa.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled>Solicitar saque (em breve)</Button>
          <Button variant="outline" disabled>
            Configurar PIX
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Extrato
        </h2>
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sem movimentação ainda. Quando você receber o primeiro pedido pago, o extrato
          começa aqui.
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
