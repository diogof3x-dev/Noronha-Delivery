import Link from "next/link";
import { Bell, ChevronDown, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  district: string | null;
  initials: string;
};

export function AppHeader({ district, initials }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
        <Link
          href="/app/perfil/endereco"
          className="flex min-w-0 flex-1 items-center gap-2 text-sm"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Endereço
            </span>
            <span className="flex items-center gap-1 truncate font-semibold">
              {district ?? "Definir"}
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </span>
          </span>
        </Link>

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
      </div>
    </header>
  );
}
