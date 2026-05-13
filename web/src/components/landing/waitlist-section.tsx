import Image from "next/image";
import { WaitlistForm } from "./waitlist-form";

export function WaitlistSection() {
  return (
    <section id="fila" className="relative isolate overflow-hidden py-20 md:py-28">
      <Image
        src="/hero/noronha-hero-desktop.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[60%_center]"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,30,45,0.92) 0%, rgba(11,127,168,0.80) 55%, rgba(45,134,89,0.70) 100%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="text-white">
            <p
              className="text-sm font-semibold uppercase tracking-[0.18em] text-white/85"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
            >
              Fila de lançamento
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight md:text-4xl"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
            >
              Seja um dos primeiros a usar
            </h2>
            <p
              className="mt-4 max-w-md text-base text-white/90 md:text-lg"
              style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}
            >
              Quem entra na fila ganha frete grátis no primeiro pedido e desconto no
              primeiro passeio reservado pelo app.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/95">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--sun)]" />
                Avisamos por WhatsApp quando o app sair.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--sun)]" />
                Acesso antecipado ao beta com lista de espera.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--sun)]" />
                Cupom exclusivo de boas-vindas no primeiro uso.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/15 bg-background p-6 shadow-2xl md:p-8">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
