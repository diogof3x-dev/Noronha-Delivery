import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/footer";
import { EntregadorBenefits } from "@/components/entregador/entregador-benefits";
import { EntregadorCta } from "@/components/entregador/entregador-cta";
import { EntregadorFaq } from "@/components/entregador/entregador-faq";
import { EntregadorHeader } from "@/components/entregador/entregador-header";
import { EntregadorHero } from "@/components/entregador/entregador-hero";
import { EntregadorHow } from "@/components/entregador/entregador-how";

export const metadata: Metadata = {
  title: "Para entregadores — bike, scooter, táxi, transfer",
  description:
    "Entregue ou rode no Noronha Delivery. Demanda canalizada, PIX por entrega, frota elétrica em destaque. Sem chefe, sem escala obrigatória.",
};

export default function EntregadorLanding() {
  return (
    <>
      <EntregadorHeader />
      <main className="flex-1">
        <EntregadorHero />
        <EntregadorBenefits />
        <EntregadorHow />
        <EntregadorFaq />
        <EntregadorCta />
      </main>
      <LandingFooter />
    </>
  );
}
