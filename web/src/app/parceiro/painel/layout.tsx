import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Banknote,
  ListChecks,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { signOut } from "@/app/actions/auth";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/parceiro/painel", label: "Visão geral", icon: BarChart3 },
  { href: "/parceiro/painel/pedidos", label: "Pedidos", icon: ListChecks },
  { href: "/parceiro/painel/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/parceiro/painel/vendas", label: "Vendas", icon: Banknote },
  { href: "/parceiro/painel/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/parceiro/painel/loja", label: "Minha loja", icon: Store },
];

export default async function ParceiroPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/parceiro/entrar?next=/parceiro/painel");

  const profile = await getProfile(user);
  const allowed = profile?.role === "business_owner" || profile?.role === "admin";

  if (!allowed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-sand-grad p-6 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <NoronhaMark className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold">Sua conta ainda não foi credenciada</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Você está logado mas ainda não passou pela aprovação como parceiro. Preencha o
          formulário de credenciamento (5 min) e nossa equipe valida em até 48h.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/parceiro/credenciar" className={cn(buttonVariants(), "h-10 px-4")}>
            Quero me credenciar
          </Link>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex h-16 items-center gap-2 border-b border-border px-5 hover:bg-muted/50"
          aria-label="Voltar à página inicial"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NoronhaMark className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Painel parceiro</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Noronha Delivery
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="px-2 pb-3 text-xs">
            <p className="font-medium">{profile?.full_name ?? user.email}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit" className="w-full h-8">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2" aria-label="Voltar à página inicial">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <NoronhaMark className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Painel parceiro</span>
          </Link>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit" className="h-8">
              Sair
            </Button>
          </form>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
