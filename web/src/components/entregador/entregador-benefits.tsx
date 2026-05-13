import {
  Bell,
  Bike,
  Calendar,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Benefit = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const benefits: Benefit[] = [
  {
    icon: Bell,
    title: "Pedido cai no app, você aceita",
    body: "Sem telefone tocando. Você vê origem, destino, valor da corrida e aceita ou recusa. Recebeu, é seu.",
  },
  {
    icon: Wallet,
    title: "Pagamento PIX direto",
    body: "Cada entrega vira saldo na sua carteira do app. Saque PIX a qualquer momento sem complicação.",
  },
  {
    icon: Calendar,
    title: "Você define os horários",
    body: "Sem escala obrigatória. Liga o switch quando quer trabalhar, desliga quando quer parar. Sem multa.",
  },
  {
    icon: Bike,
    title: "Frota 100% elétrica",
    body: "Privilegiamos bikes e scooters elétricas (alinhado à lei 2029). Menos combustível, menos barulho, mais corridas.",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento garantido pelo app",
    body: "Cliente paga adiantado. Você nunca leva calote — chegou, entregou, recebeu.",
  },
  {
    icon: Bike,
    title: "Não tem bike? A gente conecta",
    body: "Parcerias com locadoras locais pra você alugar bike/scooter elétrica com desconto. Fale com a equipe.",
  },
];

export function EntregadorBenefits() {
  return (
    <section id="ganhos" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Por que entregar no Noronha Delivery
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Demanda canalizada. Pagamento garantido. Sem chefe.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
