import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, ChevronDown, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EntregadorHero() {
  return (
    <section
      className="relative isolate flex w-full flex-col overflow-hidden text-white"
      style={{ height: "100svh", maxHeight: "100svh" }}
    >
      <Image
        src="/hero/entregador-hero.jpg"
        alt="Fernando de Noronha — passeio de barco com Morro do Pico"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[center_30%] md:object-[center_25%]"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,40,30,0.55) 0%, rgba(5,40,30,0.18) 25%, rgba(45,134,89,0.55) 65%, rgba(5,40,30,0.92) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,40,30,0.88) 0%, rgba(45,134,89,0.40) 38%, rgba(5,40,30,0) 60%)",
        }}
        aria-hidden
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-12 pt-20 md:justify-center md:px-10 md:pb-20">
        <div className="max-w-2xl">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
          >
            <Bike className="h-3.5 w-3.5 text-[color:var(--sun)]" />
            Para motoboys, táxis, transferistas e buggys
          </span>

          <h1
            className="mt-5 font-bold leading-[1.02] tracking-tight"
            style={{
              fontSize: "clamp(2.1rem, 6vw, 4.25rem)",
              textShadow: "0 4px 32px rgba(0,0,0,0.45)",
            }}
          >
            Entregue na ilha,
            <br />
            <span className="text-[color:var(--sun)]">ganhe pedalando elétrico</span>.
          </h1>

          <p
            className="mt-5 max-w-xl text-base leading-relaxed text-white/95 md:text-lg"
            style={{ textShadow: "0 1px 14px rgba(0,0,0,0.55)" }}
          >
            Demanda canalizada pelo único app de Noronha. Pedido cai, você aceita, coleta e
            entrega. Pagamento <strong>PIX por entrega</strong>, sem dependência de
            telefonema.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/entregador/credenciar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 px-6 text-base shadow-xl shadow-primary/40",
              )}
            >
              Quero entregar
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link
              href="/entregador/entrar"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 border-white/40 bg-white/15 px-6 text-base text-white backdrop-blur hover:bg-white/25 hover:text-white",
              )}
            >
              Já sou entregador
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-2 text-xs text-white/95">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              <Zap className="h-3.5 w-3.5" />
              Frota 100% elétrica
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              Pagamento PIX direto
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">
              Você define os horários
            </li>
          </ul>
        </div>
      </div>

      <a href="#ganhos" aria-label="Ver mais" className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80">
        <span className="flex h-9 w-9 animate-bounce items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
          <ChevronDown className="h-4 w-4" />
        </span>
      </a>
    </section>
  );
}
