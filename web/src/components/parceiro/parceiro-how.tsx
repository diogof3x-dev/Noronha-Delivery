import { BadgeCheck, Banknote, ClipboardCheck, ShoppingBag, Upload } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Credencie em 5 minutos",
    body: "Preencha dados do negócio, anexe um documento e fotos. Sem custo.",
  },
  {
    icon: BadgeCheck,
    title: "Aprovação em até 48h",
    body: "Nossa equipe verifica e libera. Você recebe um WhatsApp com o painel.",
  },
  {
    icon: Upload,
    title: "Suba seu catálogo",
    body: "Produtos, fotos, preços e horários. Tudo gerenciado pelo painel web.",
  },
  {
    icon: ShoppingBag,
    title: "Receba pedidos no ar",
    body: "Notificação em tempo real. Confirme, prepare, despache — o cliente acompanha.",
  },
  {
    icon: Banknote,
    title: "Saque PIX em D+8",
    body: "Saldo líquido (já descontada a taxa) liberado 8 dias após cada entrega.",
  },
];

export function ParceiroHow() {
  return (
    <section id="como-funciona" className="bg-secondary/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Como funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Do credenciamento ao primeiro pedido em uma semana
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative rounded-2xl border border-border bg-card p-5 md:p-6"
              >
                <span className="absolute -top-3 left-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
