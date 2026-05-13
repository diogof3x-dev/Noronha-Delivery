import Link from "next/link";
import { ArrowRight, Leaf, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DoisIrmaosScene } from "@/components/illustrations/dois-irmaos";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-ocean-grad opacity-95" aria-hidden />
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0px, transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0px, transparent 50%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-white">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-6 border-white/20 bg-white/10 text-white backdrop-blur"
            >
              <MapPin className="mr-1 h-3.5 w-3.5" />
              Fernando de Noronha · em breve
            </Badge>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Aqui você tem <span className="text-[color:var(--sun)]">Tudo</span>.
              <br className="hidden md:block" />
              <span className="text-white/90">Em Noronha, na palma da mão.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-white/85 md:text-xl">
              O super app oficial de Fernando de Noronha. Delivery, transporte, passeios,
              hospedagem, aluguel, ingressos, clima do mar e mais — num lugar só, com
              pagamento seguro e avaliações públicas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#fila"
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}
              >
                Entrar na fila de lançamento
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                href="#parceiros"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 border-white/30 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white",
                )}
              >
                Sou comércio / operador
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                <Leaf className="h-4 w-4" />
                Frota 100% elétrica
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                <Star className="h-4 w-4" />
                Avaliação pública
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                PIX · cartão · saldo
              </span>
            </div>
          </div>

          <div className="relative hidden md:block" aria-hidden>
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-white/5 blur-3xl" />
            <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/5 shadow-2xl backdrop-blur">
              <DoisIrmaosScene className="absolute inset-0 h-full w-full" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/70">
                <span>Morro Dois Irmãos</span>
                <span>Praia do Cacimba do Padre</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/20 bg-white/5">
            <DoisIrmaosScene className="absolute inset-0 h-full w-full" />
            <span className="absolute bottom-2 left-3 right-3 text-[10px] uppercase tracking-[0.2em] text-white/70">
              Morro Dois Irmãos · Cacimba do Padre
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
