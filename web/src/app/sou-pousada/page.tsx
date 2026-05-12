import type { Metadata } from "next";
import { PartnerForm } from "@/components/landing/partner-form";
import { PartnerPageShell } from "@/components/landing/partner-page-shell";

export const metadata: Metadata = {
  title: "Sou pousada — Pré-cadastro",
  description:
    "Pousadas, hotéis e hospedagens em Fernando de Noronha. Reservas, check-in digital e upsell pelo Noronha Delivery.",
};

export default function SouPousadaPage() {
  return (
    <PartnerPageShell
      eyebrow="Para pousadas e hospedagens"
      title="Reservas que viram experiência"
      description="Pousadas, hotéis e hospedagens podem captar reservas diretas, fazer check-in digital e oferecer transfer + 1º passeio + cesta de boas-vindas no mesmo carrinho."
      bullets={[
        "Calendário em tempo real e reserva com sinal de 30%.",
        "Check-in digital com QR para acelerar a chegada do hóspede.",
        "Comissão a partir de 8% — menor que Booking.",
        "Upsell de transfer, passeios e cesta de boas-vindas integrado.",
        "Avaliação pública dos hóspedes verificada.",
      ]}
    >
      <PartnerForm
        type="pousada"
        businessLabel="Nome da pousada ou hospedagem"
        categories={[
          "Pousada",
          "Hotel",
          "Hostel",
          "Pousada charme",
          "Hospedagem familiar",
          "Outro",
        ]}
      />
    </PartnerPageShell>
  );
}
