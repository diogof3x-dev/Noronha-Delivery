import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bike, Hotel, Sparkles, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const partnerTypes = [
  {
    href: "/parceiro/credenciar?tipo=comercio",
    icon: Store,
    title: "Sou comércio",
    body: "Restaurante, mercado, farmácia, conveniência. Receba pedidos no app, com taxa menor que iFood.",
    cta: "Credenciar comércio",
  },
  {
    href: "/parceiro/credenciar?tipo=operador",
    icon: Sparkles,
    title: "Sou operador",
    body: "Passeio, mergulho, barco, trilha, aluguel de buggy e equipamentos. Catálogo + reservas + agenda.",
    cta: "Credenciar operador",
  },
  {
    href: "/entregador/credenciar",
    icon: Bike,
    title: "Sou entregador",
    body: "Táxi, transfer, entregador elétrico. Demanda canalizada, pagamento garantido, saque PIX.",
    cta: "Quero entregar",
  },
  {
    href: "/parceiro/credenciar?tipo=pousada",
    icon: Hotel,
    title: "Sou pousada",
    body: "Pousadas, hotéis, hospedagens. Reservas, check-in digital, upsell de transfer e passeios.",
    cta: "Credenciar pousada",
  },
];

export function PartnerCardsSection() {
  return (
    <section id="parceiros" className="bg-sand-grad py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Para parceiros
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Seu negócio na vitrine da ilha
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Credenciamento gratuito. Take rate único de 10%. Pagamento PIX em D+8.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {partnerTypes.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.href}
                href={p.href}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{p.body}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {p.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/parceiro"
            className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}
          >
            Conhecer programa de parceiros
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="/entregador"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 px-6 text-base")}
          >
            Quero ser entregador
          </Link>
        </div>
      </div>
    </section>
  );
}
