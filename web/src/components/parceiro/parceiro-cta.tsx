import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ParceiroCta() {
  return (
    <section
      id="cta"
      className="relative isolate overflow-hidden py-20 text-white md:py-28"
    >
      <Image
        src="/hero/parceiro-hero.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[70%_center]"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(28,12,4,0.94) 0%, rgba(229,85,37,0.72) 55%, rgba(244,196,48,0.45) 100%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-4xl px-4 text-center">
        <p
          className="text-sm font-semibold uppercase tracking-[0.18em] text-white/85"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
        >
          Pronto pra vender mais
        </p>
        <h2
          className="mt-2 text-3xl font-bold tracking-tight md:text-5xl"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
        >
          A ilha inteira esperando seu negócio.
        </h2>
        <p
          className="mx-auto mt-4 max-w-xl text-base text-white/95 md:text-lg"
          style={{ textShadow: "0 1px 14px rgba(0,0,0,0.55)" }}
        >
          Credenciamento em 5 minutos, aprovação em até 48h, primeiro pedido em poucos dias.
          Sem mensalidade, sem fidelidade.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/parceiro/credenciar"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 px-8 text-base shadow-xl shadow-primary/40 md:h-14 md:px-10 md:text-lg",
            )}
          >
            Quero me credenciar
            <ArrowRight className="ml-1 h-4 w-4 md:h-5 md:w-5" />
          </Link>
          <Link
            href="/parceiro/entrar"
            className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
          >
            Já sou parceiro · Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
