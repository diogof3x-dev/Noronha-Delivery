import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Leaf, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section
      className="relative isolate flex w-full flex-col justify-end overflow-hidden text-white"
      style={{ minHeight: "100svh" }}
    >
      <Image
        src="/hero/noronha-hero-desktop.jpg"
        alt="Baía dos Porcos com o Morro Dois Irmãos ao fundo — Fernando de Noronha"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[52%_center] md:object-center"
      />

      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,30,45,0.55) 0%, rgba(8,30,45,0.10) 25%, rgba(8,30,45,0.10) 55%, rgba(8,30,45,0.80) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,30,45,0.85) 0%, rgba(8,30,45,0.45) 38%, rgba(8,30,45,0) 60%)",
        }}
        aria-hidden
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-16 pt-24 md:justify-center md:px-10 md:pb-32 md:pt-28">
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--sun)]" />
            Fernando de Noronha
          </span>

          <h1
            className="mt-6 font-bold leading-[0.98] tracking-tight"
            style={{
              fontSize: "clamp(2.75rem, 9vw, 6.5rem)",
              textShadow: "0 4px 32px rgba(0,0,0,0.45)",
            }}
          >
            Aqui você tem{" "}
            <span className="text-[color:var(--sun)]">Tudo</span>.
            <br />
            <span className="text-white/95">A ilha na palma da mão.</span>
          </h1>

          <p
            className="mt-6 max-w-xl text-base leading-relaxed text-white/95 md:text-xl"
            style={{ textShadow: "0 1px 14px rgba(0,0,0,0.55)" }}
          >
            O super app oficial de Fernando de Noronha. Delivery, transporte,
            passeios, hospedagem, aluguel, ingressos e clima do mar — num lugar
            só.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#fila"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 px-6 text-base shadow-xl shadow-primary/40 md:h-14 md:px-8 md:text-lg",
              )}
            >
              Entrar na fila de lançamento
              <ArrowRight className="ml-1 h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <Link
              href="#parceiros"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 border-white/40 bg-white/15 px-6 text-base text-white backdrop-blur hover:bg-white/25 hover:text-white md:h-14 md:px-8 md:text-lg",
              )}
            >
              Sou comércio / operador
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/95 md:mt-10 md:gap-3 md:text-sm">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              <Leaf className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Frota 100% elétrica
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              <Star className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Avaliação pública
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              PIX · cartão · saldo
            </li>
          </ul>
        </div>
      </div>

      <a
        href="#categorias"
        aria-label="Ver mais"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 transition-colors hover:text-white"
      >
        <span className="flex h-10 w-10 animate-bounce items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
          <ChevronDown className="h-5 w-5" />
        </span>
      </a>

      <span
        className="absolute bottom-5 right-5 hidden text-[10px] uppercase tracking-[0.22em] text-white/65 md:block"
        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
      >
        Morro Dois Irmãos · Baía dos Porcos
      </span>
    </section>
  );
}
