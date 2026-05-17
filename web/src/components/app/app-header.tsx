import Link from "next/link";
import { Bell, Bike, ChevronDown, LogIn, MapPin, Shield, Store } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";

type Props = {
  district: string | null;
  initials: string;
  isAuthed?: boolean;
  role?: "customer" | "business_owner" | "driver" | "admin" | null;
};

export function AppHeader({ district, initials, isAuthed = false, role = null }: Props) {
  const personaChips: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [];
  if (role === "business_owner" || role === "admin") {
    personaChips.push({
      href: "/parceiro/painel",
      label: "Modo lojista",
      icon: Store,
      tone: "border-primary/30 bg-primary/5 text-primary",
    });
  }
  if (role === "driver" || role === "admin") {
    personaChips.push({
      href: "/entregador/painel",
      label: "Modo entregador",
      icon: Bike,
      tone: "border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 text-[color:var(--turtle)]",
    });
  }
  if (role === "admin") {
    personaChips.push({
      href: "/super-admin",
      label: "Super admin",
      icon: Shield,
      tone: "border-[color:var(--sun)]/40 bg-[color:var(--sun)]/10 text-[color:var(--sun)]",
    });
  }
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-3">
        <Link
          href="/"
          aria-label="Voltar à página inicial"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <NoronhaMark className="h-5 w-5" />
        </Link>

        <Link
          href={isAuthed ? "/app/perfil/endereco" : "/entrar?next=/app/perfil/endereco"}
          className="flex min-w-0 flex-1 items-center gap-2 text-sm"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Endereço
            </span>
            <span className="flex items-center gap-1 truncate text-sm font-semibold">
              {district ?? "Fernando de Noronha"}
              <ChevronDown className="h-3 w-3 shrink-0" />
            </span>
          </span>
        </Link>

        {isAuthed ? (
          <>
            <Link
              href="/app/notificacoes"
              aria-label="Notificações"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/app/perfil" aria-label="Perfil">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <Link
            href="/entrar?next=/app"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar
          </Link>
        )}
      </div>
      {personaChips.length > 0 && (
        <div className="border-t border-border/60 bg-background/80">
          <div className="mx-auto flex max-w-md gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {personaChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${chip.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {chip.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
