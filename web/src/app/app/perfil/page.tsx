import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Bell,
  Heart,
  ChevronRight,
  LogOut,
  MapPin,
  ShieldCheck,
  Store,
  Bike,
  User,
  Wallet,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/perfil");

  const profile = await getProfile(user);
  const initials = (profile?.full_name ?? user.email ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isAdmin = profile?.role === "admin";
  const items: { href: string; label: string; sub?: string; icon: typeof MapPin }[] = [
    { href: "/app/perfil/endereco", label: "Endereço", sub: profile?.district ?? "Definir bairro", icon: MapPin },
    { href: "/app/perfil/enderecos", label: "Meus endereços", sub: "Pousada, casa, praia favorita...", icon: MapPin },
    { href: "/app/perfil/pontos", label: "Pontos & Status", sub: "Bronze · Prata · Ouro · Diamante", icon: Award },
    { href: "/app/favoritos", label: "Favoritos", sub: "Lojas e pratos que você ama", icon: Heart },
    { href: "/app/notificacoes", label: "Notificações", icon: Bell },
    { href: "/app/carteira", label: "Carteira", icon: Wallet },
  ];

  const adminItems = isAdmin
    ? [
        { href: "/parceiro/painel", label: "Painel do parceiro", icon: Store },
        { href: "/entregador/painel", label: "App do entregador", icon: Bike },
        { href: "/super-admin", label: "Super Admin", icon: ShieldCheck },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Perfil</h1>
      </div>

      <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Avatar className="h-14 w-14 border border-border">
          <AvatarFallback className="bg-primary text-base text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{profile?.full_name ?? user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {profile?.role && profile.role !== "customer" && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {profile.role}
            </span>
          )}
        </div>
      </section>

      <section className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Conta
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    {item.sub && (
                      <span className="block text-[11px] text-muted-foreground">{item.sub}</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {adminItems.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
            Acessos liberados
          </h2>
          <ul className="overflow-hidden rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5">
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href} className="border-b border-[color:var(--turtle)]/30 last:border-b-0">
                  <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--turtle)]/10">
                    <Icon className="h-4 w-4 text-[color:var(--turtle)]" />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-[color:var(--turtle)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <form action={signOut}>
          <Button variant="outline" type="submit" className="w-full h-10">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </form>
      </section>

      <p className="pt-4 text-center text-[10px] text-muted-foreground">
        Noronha Delivery · {new Date().getFullYear()}
      </p>

      <span className="hidden">
        <User />
      </span>
    </div>
  );
}
