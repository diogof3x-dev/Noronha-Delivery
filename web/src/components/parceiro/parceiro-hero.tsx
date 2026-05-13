import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ParceiroHero() {
  return (
    <section
      className="relative isolate flex w-full flex-col overflow-hidden text-white"
      style={{ height: "100svh", maxHeight: "100svh" }}
    >
      <Image
        src="/hero/noronha-hero-desktop.jpg"
        alt="Fernando de Noronha — Baía dos Porcos"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[58%_center] md:object-center"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,30,45,0.55) 0%, rgba(8,30,45,0.20) 25%, rgba(8,30,45,0.40) 60%, rgba(8,30,45,0.85) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,30,45,0.85) 0%, rgba(8,30,45,0.50) 38%, rgba(8,30,45,0) 62%)",
        }}
        aria-hidden
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-12 pt-20 md:justify-center md:px-10 md:pb-20">
        <div className="max-w-2xl">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--sun)]" />
            Para comércios, operadores, pousadas e prestadores
          </span>

          <h1
            className="mt-5 font-bold leading-[1.02] tracking-tight"
            style={{
              fontSize: "clamp(2.1rem, 6vw, 4.25rem)",
              textShadow: "0 4px 32px rgba(0,0,0,0.45)",
            }}
          >
            Seu negócio na vitrine
            <br />
            <span className="text-[color:var(--sun)]">de Fernando de Noronha</span>.
          </h1>

          <p
            className="mt-5 max-w-xl text-base leading-relaxed text-white/95 md:text-lg"
            style={{ textShadow: "0 1px 14px rgba(0,0,0,0.55)" }}
          >
            Taxa de <strong>10%</strong>, painel completo, pagamento PIX, exposição direta
            para <strong>140 mil turistas</strong> que chegam todo ano. Sem mensalidade,
            sem fidelidade.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/parceiro/credenciar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 px-6 text-base shadow-xl shadow-primary/40",
              )}
            >
              Quero me credenciar
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link
              href="/parceiro/entrar"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 border-white/40 bg-white/15 px-6 text-base text-white backdrop-blur hover:bg-white/25 hover:text-white",
              )}
            >
              Já sou parceiro
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-2 text-xs text-white/95">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              <TrendingUp className="h-3.5 w-3.5" />
              Take rate 10%
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              Pagamento PIX em D+8
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              Sem mensalidade
            </li>
          </ul>
        </div>
      </div>

      <a
        href="#beneficios"
        aria-label="Ver mais"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80"
      >
        <span className="flex h-9 w-9 animate-bounce items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
          <ChevronDown className="h-4 w-4" />
        </span>
      </a>
    </section>
  );
}
