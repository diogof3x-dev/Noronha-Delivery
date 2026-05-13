import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Bike, Wallet } from "lucide-react";
import { EntregadorHeader } from "@/components/entregador/entregador-header";
import { LandingFooter } from "@/components/landing/footer";
import { PartnerForm } from "@/components/landing/partner-form";

export const metadata: Metadata = {
  title: "Credenciamento de entregador",
  description: "Credencie-se como entregador, motoboy, taxista ou transferista no Noronha Delivery.",
};

export default function EntregadorCredenciar() {
  return (
    <>
      <EntregadorHeader />
      <main className="flex-1 bg-sand-grad">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link
            href="/entregador"
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
                Comece a entregar em Noronha
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Preenche o formulário, anexa CNH + foto + dados do veículo. Aprovação em
                até 48h e você liga o switch pra começar.
              </p>

              <ul className="mt-8 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  <span>Aprovação em até <strong>48h úteis</strong>, com chave de acesso no WhatsApp.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <Bike className="h-4 w-4" />
                  </span>
                  <span>Bike elétrica ou scooter elétrica preferencialmente. Não tem? A gente conecta com locadora.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span>Saldo PIX disponível pra saque a qualquer momento, sem espera.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              <PartnerForm
                type="motorista"
                businessLabel="Nome ou apelido profissional"
                showCnpj={false}
                categories={[
                  "Bike elétrica",
                  "Scooter elétrica",
                  "Moto",
                  "Buggy",
                  "Carro elétrico",
                  "Táxi (Nortax)",
                  "Transfer aeroporto/pousada",
                  "Transporte de malas",
                  "Outro",
                ]}
                about="Conte sobre seu veículo (modelo, ano, placa), tempo na ilha, idiomas que fala (se atender turistas)"
              />
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
