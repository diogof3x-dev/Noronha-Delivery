"use client";

import Link from "next/link";
import { useState } from "react";
import { Bike, Menu, ShoppingBag, Store, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";
import { cn } from "@/lib/utils";

const ctas = [
  {
    href: "/parceiro",
    label: "Quero vender",
    sub: "Cadastrar negócio",
    icon: Store,
    variant: "ghost" as const,
  },
  {
    href: "/entregador",
    label: "Quero entregar",
    sub: "Sou entregador",
    icon: Bike,
    variant: "ghost" as const,
  },
  {
    href: "/app",
    label: "Quero comprar",
    sub: "Fazer pedido",
    icon: ShoppingBag,
    variant: "primary" as const,
  },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NoronhaMark className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Noronha Delivery</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              aqui você tem Tudo
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {ctas.map((cta) => {
            const Icon = cta.icon;
            const isPrimary = cta.variant === "primary";
            return (
              <Link
                key={cta.href}
                href={cta.href}
                className={cn(
                  isPrimary
                    ? buttonVariants({ size: "sm" })
                    : "inline-flex items-center rounded-full border border-input bg-background hover:bg-muted",
                  "h-10 gap-2 px-4 text-sm font-semibold",
                )}
              >
                <Icon className="h-4 w-4" />
                {cta.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border/60 bg-background md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
          {ctas.map((cta) => {
            const Icon = cta.icon;
            const isPrimary = cta.variant === "primary";
            return (
              <Link
                key={cta.href}
                href={cta.href}
                onClick={() => setOpen(false)}
                className={cn(
                  isPrimary
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background hover:bg-muted",
                  "flex items-center gap-3 rounded-2xl px-4 py-3",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isPrimary ? "bg-white/20 text-white" : "bg-secondary text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{cta.label}</span>
                  <span className={cn("text-xs", isPrimary ? "text-white/80" : "text-muted-foreground")}>
                    {cta.sub}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
