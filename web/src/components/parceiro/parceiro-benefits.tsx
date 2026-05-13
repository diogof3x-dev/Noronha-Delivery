import {
  BadgeCheck,
  BarChart3,
  Eye,
  Leaf,
  PiggyBank,
  Star,
  type LucideIcon,
} from "lucide-react";

type Benefit = {
  icon: LucideIcon;
  title: string;
  body: string;
  highlight?: string;
};

const benefits: Benefit[] = [
  {
    icon: PiggyBank,
    title: "Taxa que cabe no bolso",
    body: "10% sobre cada pedido. Menos da metade do iFood (27%) e Booking (15-25%). Sem mensalidade, sem fee de cadastro, sem taxa de listagem.",
    highlight: "10% vs 27% iFood",
  },
  {
    icon: Eye,
    title: "Vitrine pra ilha toda",
    body: "Aparece pros 140 mil turistas que chegam por ano e pros 3.341 moradores no único app oficial da ilha. Categoria certa, busca, recomendação por bairro.",
    highlight: "140 mil turistas/ano",
  },
  {
    icon: BarChart3,
    title: "Painel completo, vendas claras",
    body: "Pedidos em tempo real com som de alerta. Dashboard de vendas, ticket médio, top produtos. Histórico, exports, controle de estoque.",
  },
  {
    icon: BadgeCheck,
    title: "Pagamento garantido",
    body: "PIX e cartão pago pelo cliente direto no app. Você recebe líquido (já descontada a taxa) em D+8, dentro da janela legal de estorno. Sem calote.",
  },
  {
    icon: Star,
    title: "Avaliação pública te promove",
    body: "Quem entrega bem sobe no ranking automaticamente. Score bayesiano evita injustiça com loja nova. Você responde cada avaliação publicamente.",
  },
  {
    icon: Leaf,
    title: "Frota 100% elétrica",
    body: "Entrega silenciosa, alinhada à agenda ambiental da Administração Distrital. Selo verde no seu perfil — turista de eco-resort prefere quem cuida.",
  },
];

export function ParceiroBenefits() {
  return (
    <section id="beneficios" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Por que ser parceiro
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Tudo o que você precisa para vender mais na ilha
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Construído junto com comerciantes locais — não com cara de software de
            corporação distante.
          </p>
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
                {b.highlight && (
                  <p className="mt-1 inline-block rounded-full bg-[color:var(--sun)]/20 px-2 py-0.5 text-xs font-bold text-[color:var(--turtle)]">
                    {b.highlight}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
