"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#beneficios", label: "Benefícios" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#taxa", label: "Taxa" },
  { href: "#faq", label: "Perguntas" },
];

export function ParceiroHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/parceiro" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NoronhaMark className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Noronha Delivery</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Para parceiros
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/parceiro/entrar"
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            Já sou parceiro
          </Link>
          <Link
            href="/parceiro/credenciar"
            className={cn(buttonVariants({ size: "sm" }), "ml-1 h-9 px-4")}
          >
            Credenciar
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("border-t border-border/60 bg-background md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/parceiro/entrar"
            onClick={() => setOpen(false)}
            className="rounded-md border border-input bg-background px-3 py-2.5 text-center text-sm font-medium"
          >
            Já sou parceiro
          </Link>
          <Link
            href="/parceiro/credenciar"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ size: "lg" }), "h-11 w-full")}
          >
            Credenciar meu negócio
          </Link>
        </nav>
      </div>
    </header>
  );
}
