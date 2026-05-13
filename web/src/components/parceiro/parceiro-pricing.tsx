import { Check, X } from "lucide-react";

const includes = [
  "Take rate de 10% sobre cada pedido",
  "Painel web completo (pedidos, vendas, estoque, saque)",
  "Pagamento PIX e cartão processado pelo app",
  "Suporte por WhatsApp em horário comercial",
  "Selo de Verificado após KYC",
  "Notificações push pro celular do lojista",
];
const free = [
  "Mensalidade",
  "Taxa de adesão / cadastro",
  "Fee por listagem de produto",
  "Cobrança de boost obrigatório",
  "Multa por cancelamento da parceria",
];

export function ParceiroPricing() {
  return (
    <section id="taxa" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Sem letra miúda
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Taxa única e transparente
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border-2 border-primary/30 bg-card shadow-sm">
          <div className="bg-primary px-6 py-8 text-center text-primary-foreground md:px-10 md:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-90">
              Take rate
            </p>
            <p className="mt-2 text-6xl font-bold tracking-tight md:text-7xl">10%</p>
            <p className="mt-2 text-sm opacity-95">
              sobre cada pedido pago no app. Você recebe os outros 90% líquidos.
            </p>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
                O que inclui
              </p>
              <ul className="space-y-2 text-sm">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Você não paga
              </p>
              <ul className="space-y-2 text-sm">
                {free.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <X className="h-3 w-3" />
                    </span>
                    <span className="line-through">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border bg-secondary/30 px-6 py-4 text-center text-xs text-muted-foreground md:px-10">
            Campanhas sazonais podem reduzir temporariamente a taxa. Você sempre será
            informado com pelo menos 7 dias de antecedência sobre qualquer mudança.
          </div>
        </div>
      </div>
    </section>
  );
}
