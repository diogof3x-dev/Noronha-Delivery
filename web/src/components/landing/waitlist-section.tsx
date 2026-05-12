import { WaitlistForm } from "./waitlist-form";

export function WaitlistSection() {
  return (
    <section id="fila" className="relative isolate overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-ocean-grad" aria-hidden />
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              Fila de lançamento
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Seja um dos primeiros a usar
            </h2>
            <p className="mt-4 max-w-md text-base text-white/85 md:text-lg">
              Quem entra na fila ganha frete grátis no primeiro pedido e desconto no
              primeiro passeio reservado pelo app.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/90">
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

          <div className="rounded-3xl border border-white/10 bg-background p-6 shadow-2xl md:p-8">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
