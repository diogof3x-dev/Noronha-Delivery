import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock, MessageCircle } from "lucide-react";
import { ParceiroHeader } from "@/components/parceiro/parceiro-header";
import { LandingFooter } from "@/components/landing/footer";
import { PartnerForm } from "@/components/landing/partner-form";

export const metadata: Metadata = {
  title: "Credenciamento de parceiro",
  description:
    "Cadastre seu restaurante, pousada, operação ou serviço no Noronha Delivery. Aprovação em até 48h.",
};

type Props = {
  searchParams: Promise<{ tipo?: string }>;
};

const TIPO_LABEL: Record<string, { title: string; tipo: "comercio" | "operador" | "pousada"; businessLabel: string; categories: string[] }> = {
  comercio: {
    title: "Credencie seu comércio",
    tipo: "comercio",
    businessLabel: "Nome do estabelecimento",
    categories: [
      "Restaurante",
      "Pizzaria",
      "Açaí / sorveteria",
      "Cafeteria / padaria",
      "Mercado / mercearia",
      "Farmácia",
      "Conveniência 24h",
      "Loja / itens turísticos",
      "Outro",
    ],
  },
  operador: {
    title: "Credencie seu serviço ou operação",
    tipo: "operador",
    businessLabel: "Nome da operação ou empresa",
    categories: [
      "Passeio de barco",
      "Mergulho / batismo",
      "Ilha-tour",
      "Trilhas guiadas",
      "Aluguel de buggy",
      "Aluguel de bike / scooter elétrica",
      "Aluguel de equipamento (snorkel, GoPro)",
      "Lavanderia",
      "Pet shop / veterinário",
      "Academia / personal",
      "Massagem / spa",
      "Assistência mecânica",
      "Outro",
    ],
  },
  pousada: {
    title: "Credencie sua pousada",
    tipo: "pousada",
    businessLabel: "Nome da pousada ou hospedagem",
    categories: ["Pousada", "Hotel", "Hostel", "Pousada charme", "Hospedagem familiar", "Outro"],
  },
};

export default async function CredenciarPage({ searchParams }: Props) {
  const { tipo } = await searchParams;
  const config = (tipo && TIPO_LABEL[tipo]) || TIPO_LABEL.comercio!;

  const tipos: Array<{ id: keyof typeof TIPO_LABEL; label: string }> = [
    { id: "comercio", label: "Comércio" },
    { id: "operador", label: "Operador / Serviço" },
    { id: "pousada", label: "Pousada / Hotel" },
  ];

  return (
    <>
      <ParceiroHeader />
      <main className="flex-1 bg-sand-grad">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link
            href="/parceiro"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Credenciamento gratuito
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {config.title}
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Em 5 minutos você envia o formulário, nossa equipe valida em até 48h e você
                começa a receber pedidos.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {tipos.map((t) => (
                  <Link
                    key={t.id}
                    href={`/parceiro/credenciar?tipo=${t.id}`}
                    className={
                      "rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors " +
                      (config.tipo === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")
                    }
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              <ul className="mt-8 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  <span>Aprovação em até <strong>48h úteis</strong>, com confirmação no WhatsApp.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span>Sem fee de cadastro, sem mensalidade. Só paga se vender (10%).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span>Suporte humano por WhatsApp em horário comercial enquanto monta o catálogo.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              <PartnerForm
                type={config.tipo}
                businessLabel={config.businessLabel}
                categories={config.categories}
              />
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
