import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20 md:hidden">
        <Image
          src="/hero/noronha-hero-mobile.jpg"
          alt="Baía dos Porcos com o Morro Dois Irmãos ao fundo, em Fernando de Noronha"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_center]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,30,45,0.55) 0%, rgba(8,30,45,0.35) 40%, rgba(8,30,45,0.85) 100%)",
          }}
        />
      </div>

      <div className="absolute inset-0 -z-20 hidden md:block">
        <div className="absolute inset-0 bg-ocean-grad opacity-95" />
      </div>
      <div
        className="absolute inset-0 -z-10 hidden opacity-30 md:block"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0px, transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0px, transparent 50%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 text-white md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-5 border-white/25 bg-white/15 text-white backdrop-blur md:mb-6"
            >
              <MapPin className="mr-1 h-3.5 w-3.5" />
              Fernando de Noronha · em breve
            </Badge>

            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-tight md:text-6xl">
              Aqui você tem{" "}
              <span className="text-[color:var(--sun)]">Tudo</span>.
              <br className="hidden md:block" />
              <span className="text-white/95">Em Noronha, na palma da mão.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/90 md:mt-6 md:text-xl">
              O super app oficial de Fernando de Noronha. Delivery, transporte,
              passeios, hospedagem, aluguel, ingressos, clima do mar e mais — num
              lugar só.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row md:mt-8 md:gap-3">
              <Link
                href="#fila"
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base shadow-lg shadow-primary/30")}
              >
                Entrar na fila de lançamento
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                href="#parceiros"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 border-white/40 bg-white/15 px-6 text-base text-white backdrop-blur hover:bg-white/25 hover:text-white",
                )}
              >
                Sou comércio / operador
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/85 md:mt-10 md:gap-3 md:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur">
                <Leaf className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Frota 100% elétrica
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur">
                <Star className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Avaliação pública
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur">
                PIX · cartão · saldo
              </span>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-white/5 blur-3xl" aria-hidden />
            <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl">
              <Image
                src="/hero/noronha-hero-desktop.jpg"
                alt="Baía dos Porcos com o Morro Dois Irmãos ao fundo, em Fernando de Noronha"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/95">
                <span>Morro Dois Irmãos</span>
                <span>Baía dos Porcos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
