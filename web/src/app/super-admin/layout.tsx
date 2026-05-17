import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgePercent, Banknote, Bike, Inbox, LayoutDashboard, ShieldAlert, Store, Ticket } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { signOut } from "@/app/actions/auth";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NAV = [
  { href: "/super-admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/super-admin/lojas", label: "Lojas", icon: Store },
  { href: "/super-admin/entregadores", label: "Entregadores", icon: Bike },
  { href: "/super-admin/taxas", label: "Taxas", icon: BadgePercent },
  { href: "/super-admin/cupons", label: "Cupons", icon: Ticket },
  { href: "/super-admin/saques", label: "Saques", icon: Banknote },
  { href: "/super-admin/pedidos", label: "Pedidos", icon: Inbox },
];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin");

  const profile = await getProfile(user);
  if (profile?.role !== "admin") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-sand-grad p-6 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Esta área é exclusiva da Agência F3X. Se você acredita que deveria ter acesso, fale
          com o administrador.
        </p>
        <Link href="/" className="mt-6 text-sm text-primary underline">
          Voltar ao início
        </Link>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
        <Link href="/super-admin" className="flex h-16 items-center gap-2 border-b border-border px-5 hover:bg-muted/50">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
            <NoronhaMark className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Super Admin</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Agência F3X
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
          <Link
            href="/app"
            className="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted"
          >
            ← App cliente
          </Link>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit" className="w-full h-8">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2 lg:hidden">
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
