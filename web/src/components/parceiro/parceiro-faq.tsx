import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "Preciso ter CNPJ pra me cadastrar?",
    a: "Recomendamos CNPJ (mesmo MEI) pra agilizar pagamentos e emissão de nota. Aceitamos cadastro com CPF nos primeiros 30 dias enquanto você formaliza, desde que o tipo de atividade permita.",
  },
  {
    q: "Quanto tempo leva pra aprovação?",
    a: "Entre 24 e 48 horas úteis. Nossa equipe verifica documentos e confere se o negócio está em conformidade com a Administração Distrital. Você recebe a notificação no WhatsApp.",
  },
  {
    q: "Quando eu recebo o dinheiro dos pedidos?",
    a: "8 dias depois da entrega (D+8). Esse prazo cobre a janela legal de estorno do consumidor (CDC). Após 8 dias o valor líquido cai como saldo disponível no seu painel e você solicita saque PIX a qualquer momento.",
  },
  {
    q: "Tem multa pra encerrar a parceria?",
    a: "Não. Sem fidelidade, sem multa. Você pode pausar ou encerrar a qualquer momento pelo painel. Pedidos em andamento devem ser finalizados antes do encerramento total.",
  },
  {
    q: "Posso cadastrar mais de uma loja?",
    a: "Sim, com painel e financeiro separados. Cada estabelecimento passa pelo KYC individualmente.",
  },
  {
    q: "Como vocês garantem que o cliente não vai dar calote?",
    a: "O cliente paga 100% adiantado no app (PIX, cartão, Apple Pay, Google Pay). O dinheiro fica retido na plataforma e é liberado pra você em D+8. Você nunca leva calote — no máximo recebe um estorno antes do prazo se o cliente reclamar legitimamente.",
  },
  {
    q: "E se eu não tiver entregador próprio?",
    a: "A plataforma tem rede de entregadores elétricos credenciados. Você marca o pedido como pronto e um motoboy vai buscar. Frete pago pelo cliente, sem custo extra pra você.",
  },
  {
    q: "Quais tipos de negócio podem se credenciar?",
    a: "Restaurantes, pizzarias, açaís, mercados, farmácias, lojas, operadores de passeio, mergulho, barco, pousadas, hotéis, locadoras (buggy/bike/equipamentos), prestadores de serviço (lavanderia, spa, pet, mecânica) e mais.",
  },
];

export function ParceiroFaq() {
  return (
    <section id="faq" className="bg-secondary/30 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Perguntas frequentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Tudo o que você precisa saber
          </h2>
        </div>

        <Accordion className="mt-10">
          {items.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
