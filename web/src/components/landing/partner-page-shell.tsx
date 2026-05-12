import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LandingHeader } from "./header";
import { LandingFooter } from "./footer";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  children: React.ReactNode;
};

export function PartnerPageShell({
  eyebrow,
  title,
  description,
  bullets,
  children,
}: Props) {
  return (
    <>
      <LandingHeader />
      <main className="flex-1 bg-sand-grad">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à home
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                {description}
              </p>

              <ul className="mt-8 space-y-3 text-sm">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
