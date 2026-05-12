import type { Metadata } from "next";
import { PartnerForm } from "@/components/landing/partner-form";
import { PartnerPageShell } from "@/components/landing/partner-page-shell";

export const metadata: Metadata = {
  title: "Sou operador — Pré-cadastro",
  description:
    "Operadores de passeio, mergulho, barco, trilhas e aluguel em Fernando de Noronha. Cadastre seus serviços no Noronha Delivery.",
};

export default function SouOperadorPage() {
  return (
    <PartnerPageShell
      eyebrow="Para operadores e prestadores"
      title="Sua agenda cheia, sem PIX no escuro"
      description="Passeios, mergulhos, trilhas, aluguel de buggy, bike e equipamento, lavanderia, massagem, spa, pet shop ou personal: ofereça com reserva, pagamento garantido e ranking público."
      bullets={[
        "Catálogo + calendário de disponibilidade no app.",
        "Pagamento embarcado com split automático.",
        "Selo de operador verificado (cruzado com credenciamento ICMBio).",
        "Avaliação pública aumenta visibilidade dos melhores.",
        "Take rate a partir de 8% para passeios e serviços.",
      ]}
    >
      <PartnerForm
        type="operador"
        businessLabel="Nome do operador ou empresa"
        categories={[
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
        ]}
      />
    </PartnerPageShell>
  );
}
