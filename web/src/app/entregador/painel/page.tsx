import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, MapPin, Power, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { signOut } from "@/app/actions/auth";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EntregadorPainel() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar?next=/entregador/painel");

  const profile = await getProfile(user);
  const allowed = profile?.role === "driver" || profile?.role === "admin";

  if (!allowed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-sand-grad p-6 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <NoronhaMark className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold">Sua conta ainda não foi credenciada</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Você está logado mas ainda não foi aprovado como entregador. Preencha o
          formulário (5 min) e nossa equipe valida em até 48h.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/entregador/credenciar"
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            Quero entregar
          </Link>
          <form action={signOut}>
            <Button variant="outline" type="submit">Sair</Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Voltar à página inicial">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NoronhaMark className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Entregador</span>
        </Link>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit" className="h-8">Sair</Button>
        </form>
      </header>

      <div className="flex-1 space-y-5 p-4">
        <section className="rounded-3xl border border-border bg-card p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Status
          </p>
          <p className="mt-2 text-2xl font-bold">Offline</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clique no botão pra começar a receber pedidos
          </p>
          <button
            type="button"
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
            disabled
          >
            <Power className="h-5 w-5" />
            Ficar online (em breve)
          </button>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <Wallet className="mb-2 h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Saldo
            </p>
            <p className="mt-1 text-xl font-bold">R$ 0,00</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <Banknote className="mb-2 h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Hoje
            </p>
            <p className="mt-1 text-xl font-bold">0 entregas</p>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Painel completo em construção
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Em breve: switch online com geolocalização, pedidos chegando em tempo real,
            navegação Mapbox até o estabelecimento e o cliente, histórico de entregas e
            saque PIX integrado. Por enquanto, fale com o suporte pelo WhatsApp se
            precisar de qualquer ajuste no seu cadastro.
          </p>
        </section>
      </div>
    </main>
  );
}
