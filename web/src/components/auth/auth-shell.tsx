import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoronhaMark } from "@/components/illustrations/noronha-mark";
import { Separator } from "@/components/ui/separator";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  altLink: { href: string; label: string; ctaPrefix: string };
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, subtitle, altLink, children }: Props) {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-sand-grad">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <NoronhaMark className="h-4 w-4" />
            </span>
            Noronha Delivery
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {altLink.ctaPrefix}{" "}
          <Link href={altLink.href} className="font-semibold text-primary hover:underline">
            {altLink.label}
          </Link>
        </p>

        <Separator className="my-8" />
        <p className="text-center text-xs text-muted-foreground">
          Ao continuar você aceita nossos termos e a política de privacidade.
        </p>
      </div>
    </main>
  );
}
