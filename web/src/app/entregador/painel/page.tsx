import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Banknote,
  Bike,
  CheckCircle2,
  Hand,
  ListChecks,
  MapPin,
  Power,
  Star,
  Wallet,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { toggleDriverOnline } from "@/app/actions/driver-status";
import { PushPrompt } from "@/components/push/push-prompt";
import { ActiveTrackerSlot } from "@/components/entregador/active-tracker-slot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EntregadorPainel() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_online, vehicle, cnh_number, pix_value")
    .eq("id", user.id)
    .maybeSingle();

  const isOnline = profile?.is_online ?? false;

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("balance_cents")
    .eq("owner_id", user.id)
    .is("business_id", null)
    .maybeSingle();
  const balance = account?.balance_cents ?? 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count: activeCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", user.id)
    .in("status", ["confirmed", "preparing", "ready", "in_transit"]);

  const { count: deliveredToday } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", user.id)
    .eq("status", "delivered")
    .gte("delivered_at", startOfDay.toISOString());

  const { count: availableNow } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .is("driver_id", null)
    .in("status", ["confirmed", "preparing", "ready"]);

  const vehicle = profile?.vehicle as { kind?: string; model?: string } | null;
  const cadastroCompleto =
    !!profile?.cnh_number && !!profile?.pix_value && !!vehicle?.kind;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <PushPrompt context="entregador" />
      <div className="flex justify-end">
        <ActiveTrackerSlot />
      </div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Olá, {profile?.full_name ?? "entregador"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Status da sua jornada
        </h1>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Status atual
        </p>
        <p
          className={`mt-2 text-2xl font-bold ${
            isOnline ? "text-[color:var(--turtle)]" : "text-foreground"
          }`}
        >
          {isOnline ? "Online · recebendo pedidos" : "Offline"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isOnline
            ? "Você aparece pra plataforma como disponível pra novas corridas."
            : "Clique no botão pra começar a receber pedidos"}
        </p>
        <form action={toggleDriverOnline} className="mt-6">
          <input type="hidden" name="online" value={isOnline ? "false" : "true"} />
          <Button
            type="submit"
            size="lg"
            className={`h-14 w-full text-base ${
              isOnline ? "bg-muted text-foreground hover:bg-muted/80" : ""
            }`}
            variant={isOnline ? "outline" : "default"}
          >
            <Power className="mr-2 h-5 w-5" />
            {isOnline ? "Ficar offline" : "Ficar online"}
          </Button>
        </form>
      </section>

      {!cadastroCompleto && (
        <Link
          href="/entregador/painel/cadastro"
          className="block rounded-2xl border border-[color:var(--sun)]/40 bg-[color:var(--sun)]/10 p-4 text-sm hover:bg-[color:var(--sun)]/15"
        >
          <p className="font-semibold">Cadastro incompleto</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Falta preencher CNH, chave PIX ou veículo. Clique aqui pra completar.
          </p>
        </Link>
      )}

      {isOnline && (availableNow ?? 0) > 0 && (
        <Link
          href="/entregador/painel/entregas"
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 hover:bg-primary/10"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Hand className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {availableNow} corrida{availableNow! > 1 ? "s" : ""} disponível
              {availableNow! > 1 ? "is" : ""}
            </p>
            <p className="text-xs text-muted-foreground">Aceitar agora →</p>
          </div>
        </Link>
      )}

      {(activeCount ?? 0) > 0 && (
        <Link
          href="/entregador/painel/entregas"
          className="flex items-center gap-3 rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5 p-4 hover:bg-[color:var(--turtle)]/10"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
            <Bike className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {activeCount} corrida{activeCount! > 1 ? "s" : ""} ativa
              {activeCount! > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">Ver entregas em andamento →</p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/entregador/painel/ganhos"
          className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <Wallet className="mb-2 h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saldo</p>
          <p className="mt-1 text-xl font-bold">{formatCents(balance)}</p>
        </Link>
        <Link
          href="/entregador/painel/historico"
          className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <CheckCircle2 className="mb-2 h-4 w-4 text-[color:var(--turtle)]" />
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hoje</p>
          <p className="mt-1 text-xl font-bold">{deliveredToday ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">
            entrega{(deliveredToday ?? 0) === 1 ? "" : "s"} concluída
            {(deliveredToday ?? 0) === 1 ? "" : "s"}
          </p>
        </Link>
      </div>

      <section className="grid grid-cols-3 gap-2">
        <Link
          href="/entregador/painel/entregas"
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/40"
        >
          <ListChecks className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold">Entregas</span>
        </Link>
        <Link
          href="/entregador/painel/ganhos"
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/40"
        >
          <Banknote className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold">Ganhos</span>
        </Link>
        <Link
          href="/entregador/painel/avaliacoes"
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/40"
        >
          <Star className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold">Avaliações</span>
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Como funciona
        </p>
        <ol className="mt-2 space-y-1 pl-4 list-decimal">
          <li>Fica <strong>online</strong> pra aparecer pra plataforma</li>
          <li>Quando o lojista confirmar um pedido, aceita em <strong>Entregas</strong></li>
          <li>Coleta na loja → <strong>Coletei, saí pra entrega</strong></li>
          <li>Entrega no destino → <strong>Marcar como entregue</strong></li>
          <li>O valor entra na sua carteira em <strong>Ganhos</strong></li>
        </ol>
      </section>
    </div>
  );
}
