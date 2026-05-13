import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/footer";
import { ParceiroBenefits } from "@/components/parceiro/parceiro-benefits";
import { ParceiroCta } from "@/components/parceiro/parceiro-cta";
import { ParceiroFaq } from "@/components/parceiro/parceiro-faq";
import { ParceiroHeader } from "@/components/parceiro/parceiro-header";
import { ParceiroHero } from "@/components/parceiro/parceiro-hero";
import { ParceiroHow } from "@/components/parceiro/parceiro-how";
import { ParceiroPricing } from "@/components/parceiro/parceiro-pricing";

export const metadata: Metadata = {
  title: "Para parceiros — restaurantes, pousadas, operadores, prestadores",
  description:
    "Coloque seu negócio na vitrine do único app oficial de Fernando de Noronha. Taxa 10%, pagamento PIX em D+8, exposição para 140 mil turistas/ano.",
};

export default function ParceiroLanding() {
  return (
    <>
      <ParceiroHeader />
      <main className="flex-1">
        <ParceiroHero />
        <ParceiroBenefits />
        <ParceiroHow />
        <ParceiroPricing />
        <ParceiroFaq />
        <ParceiroCta />
      </main>
      <LandingFooter />
    </>
  );
}
