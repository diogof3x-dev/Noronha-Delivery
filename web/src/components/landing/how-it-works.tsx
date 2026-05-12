import { CreditCard, Search, Star, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Escolha o que precisa",
    body: "Comida, passeio, transfer, mercado, lavanderia, ingresso. Tudo categorizado e com rating público.",
  },
  {
    icon: CreditCard,
    title: "Pague com segurança",
    body: "PIX instantâneo, cartão ou saldo Noronha. Sem PIX pra CPF de desconhecido nunca mais.",
  },
  {
    icon: Truck,
    title: "Acompanhe em tempo real",
    body: "Status do pedido, mapa do entregador e notificação no WhatsApp se o sinal falhar.",
  },
  {
    icon: Star,
    title: "Avalie e ajude a ilha",
    body: "Toda compra ganha avaliação pública. O ranking premia quem entrega bem e protege quem consome.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Como funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Simples como pedir um delivery. Completo como um concierge.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <span className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
