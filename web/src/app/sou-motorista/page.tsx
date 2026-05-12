import type { Metadata } from "next";
import { PartnerForm } from "@/components/landing/partner-form";
import { PartnerPageShell } from "@/components/landing/partner-page-shell";

export const metadata: Metadata = {
  title: "Sou motorista — Pré-cadastro",
  description:
    "Táxis, transfers e entregadores elétricos em Fernando de Noronha. Trabalhe com o Noronha Delivery.",
};

export default function SouMotoristaPage() {
  return (
    <PartnerPageShell
      eyebrow="Para motoristas e entregadores"
      title="Corrida e entrega sem telefone, sem espera"
      description="Táxi, transfer, entrega de pedido ou transporte de malas. Receba demanda canalizada com pagamento garantido — privilegiamos bikes e scooters elétricas."
      bullets={[
        "Demanda direta pelo app, sem dependência de telefone.",
        "Pagamento garantido com saque PIX no D+1.",
        "Frota 100% elétrica em destaque (selo verde no perfil).",
        "Avaliação dos passageiros e dos motoristas (ranking equilibrado).",
        "Parceria com Nortax e cooperativas locais.",
      ]}
    >
      <PartnerForm
        type="motorista"
        businessLabel="Nome ou apelido profissional"
        showCnpj={false}
        categories={[
          "Táxi (Nortax)",
          "Transfer aeroporto/pousada",
          "Buggy com motorista",
          "Entregador (bike elétrica)",
          "Entregador (scooter elétrica)",
          "Transporte de malas",
          "Outro",
        ]}
        about="Conte sobre seu veículo, anos na ilha, idiomas falados (se atender turistas)"
      />
    </PartnerPageShell>
  );
}
