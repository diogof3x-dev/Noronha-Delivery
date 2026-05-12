import type { Metadata } from "next";
import { PartnerForm } from "@/components/landing/partner-form";
import { PartnerPageShell } from "@/components/landing/partner-page-shell";

export const metadata: Metadata = {
  title: "Sou comércio — Pré-cadastro",
  description:
    "Restaurantes, mercados, farmácias e conveniências de Fernando de Noronha: cadastre seu negócio no Noronha Delivery.",
};

export default function SouComercioPage() {
  return (
    <PartnerPageShell
      eyebrow="Para comércios"
      title="Seu cardápio na vitrine da ilha"
      description="Restaurante, mercado, farmácia, conveniência ou loja: receba pedidos diretamente pelo Noronha Delivery, com taxa reduzida e pagamento PIX no D+1."
      bullets={[
        "Taxa de comissão menor que iFood — 12 a 15% no lançamento.",
        "Painel web com pedidos em tempo real e dashboard de vendas.",
        "Pagamento PIX/cartão integrado, com saque automático.",
        "Avaliação pública estimula recorrência e protege a qualidade.",
        "Suporte presencial em Noronha durante a operação.",
      ]}
    >
      <PartnerForm
        type="comercio"
        businessLabel="Nome do estabelecimento"
        categories={[
          "Restaurante",
          "Pizzaria",
          "Açaí / sorveteria",
          "Cafeteria / padaria",
          "Mercado / mercearia",
          "Farmácia",
          "Conveniência 24h",
          "Loja / itens turísticos",
          "Outro",
        ]}
      />
    </PartnerPageShell>
  );
}
