import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EntregadorCta() {
  return (
    <section className="relative isolate overflow-hidden py-20 text-white md:py-28">
      <Image
        src="/hero/noronha-hero-desktop.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[35%_center]"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,30,45,0.92) 0%, rgba(45,134,89,0.85) 100%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/85">
          Comece a entregar
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
          A ilha precisa de você.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/95 md:text-lg" style={{ textShadow: "0 1px 14px rgba(0,0,0,0.55)" }}>
          Credenciamento em 5 minutos, aprovação em até 48h. Pegue sua bike elétrica e ganhe
          rodando o paraíso.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/entregador/credenciar"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 px-8 text-base shadow-xl shadow-primary/40 md:h-14 md:px-10 md:text-lg",
            )}
          >
            Quero entregar
            <ArrowRight className="ml-1 h-4 w-4 md:h-5 md:w-5" />
          </Link>
          <Link
            href="/entregador/entrar"
            className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
          >
            Já sou entregador · Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
