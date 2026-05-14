"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Receipt, Wallet, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon };

const tabs: Tab[] = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/buscar", label: "Buscar", icon: Search },
  { href: "/app/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/app/carteira", label: "Carteira", icon: Wallet },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // some screens have own sticky footers (cart checkout button, order PIX panel)
  if (pathname?.startsWith("/app/carrinho")) return null;
  if (pathname?.startsWith("/app/produto/")) return null;

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 pb-[max(env(safe-area-inset-bottom),0.25rem)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/app"
              ? pathname === "/app"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-sm")} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
