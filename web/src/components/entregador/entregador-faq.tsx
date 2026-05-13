import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "Preciso ter veículo próprio?",
    a: "Tem que ter bike elétrica, scooter elétrica, moto, buggy ou carro pra trabalhar. Damos preferência pra elétrico. Se ainda não tem, conectamos com locadoras parceiras.",
  },
  {
    q: "Quanto eu ganho por entrega?",
    a: "Você fica com 80–85% do valor do frete (a plataforma fica com 15–20%). O valor depende da distância e do horário. Pode chegar a R$ 8–25 por entrega.",
  },
  {
    q: "Quando recebo o dinheiro?",
    a: "Cada entrega completa vira saldo na sua carteira do app. Você saca PIX a qualquer momento sem espera.",
  },
  {
    q: "Tenho que cumprir escala?",
    a: "Não. Liga o switch online quando quer trabalhar, desliga quando quer descansar. Sem turno fixo, sem multa, sem chefe.",
  },
  {
    q: "Como é o credenciamento?",
    a: "Foto da CNH, foto sua, foto do veículo (com placa visível), chave PIX e bairro. Em 48h você é aprovado.",
  },
  {
    q: "Sou taxista da Nortax. Posso entrar?",
    a: "Sim, temos parceria com a Nortax. Sua credencial profissional acelera a aprovação. Fale com a equipe pra alinhar.",
  },
  {
    q: "Como funciona a corrida?",
    a: "Pedido entra com origem (estabelecimento), destino (cliente) e valor. Você aceita, vai buscar, leva e o saldo cai automaticamente.",
  },
];

export function EntregadorFaq() {
  return (
    <section id="faq" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Perguntas frequentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Antes de começar a entregar
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
