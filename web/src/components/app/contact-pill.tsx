import { Bike, MessageCircle, Phone, Store } from "lucide-react";

function waLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

function telLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `tel:+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

function initialsFromName(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0]!.slice(0, 2).toUpperCase()
    : (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type Props = {
  kind: "driver" | "business";
  name: string | null;
  whatsapp: string | null;
  avatarUrl?: string | null;
  subtitle?: string | null;
};

export function ContactPill({ kind, name, whatsapp, avatarUrl, subtitle }: Props) {
  const wa = waLink(whatsapp);
  const tel = telLink(whatsapp);
  const Icon = kind === "driver" ? Bike : Store;
  const accent =
    kind === "driver"
      ? "border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/5"
      : "border-primary/30 bg-primary/5";
  const accentText =
    kind === "driver" ? "text-[color:var(--turtle)]" : "text-primary";

  return (
    <section className={`rounded-2xl border-2 p-4 ${accent}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name ?? "Foto"}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-background"
            />
          ) : (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-background text-sm font-bold ${accentText}`}
            >
              {initialsFromName(name)}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background ${
              kind === "driver"
                ? "bg-[color:var(--turtle)] text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {kind === "driver" ? "Seu entregador" : "Estabelecimento"}
          </p>
          <p className="truncate text-sm font-bold">{name ?? "—"}</p>
          {subtitle && (
            <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {(wa || tel) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--turtle)]/30 bg-background px-3 py-2 text-xs font-semibold text-[color:var(--turtle)]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          ) : (
            <span className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-center text-[11px] text-muted-foreground">
              sem whatsapp
            </span>
          )}
          {tel && (
            <a
              href={tel}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold"
            >
              <Phone className="h-3.5 w-3.5" />
              Ligar
            </a>
          )}
        </div>
      )}
    </section>
  );
}
