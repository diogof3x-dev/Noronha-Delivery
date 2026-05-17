import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://noronhadelivery.com";

const TYPE_LABEL: Record<string, string> = {
  restaurante: "Restaurante em Fernando de Noronha",
  mercado: "Mercado em Fernando de Noronha",
  farmacia: "Farmácia em Fernando de Noronha",
  conveniencia: "Conveniência em Fernando de Noronha",
  loja: "Loja em Fernando de Noronha",
  pousada: "Pousada em Fernando de Noronha",
  residencia: "Casa pra alugar em Fernando de Noronha",
  operador_passeio: "Passeios em Fernando de Noronha",
  locadora: "Aluguel em Fernando de Noronha",
  servico: "Serviço em Fernando de Noronha",
};

export function buildBusinessMetadata(business: {
  name: string;
  description: string | null;
  type: string;
  district: string | null;
  slug: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_eco_certified?: boolean;
}): Metadata {
  const typeLabel = TYPE_LABEL[business.type] ?? "Noronha Delivery";
  const ecoPart = business.is_eco_certified ? " · 100% elétrica ⚡" : "";
  const title = `${business.name} — ${typeLabel}`;
  const description =
    business.description ?? `${business.name} no Noronha Delivery${ecoPart}.`;

  const path =
    business.type === "pousada"
      ? "pousada"
      : business.type === "residencia"
        ? "casa"
        : business.type === "operador_passeio"
          ? "passeio"
          : business.type === "locadora"
            ? "aluguel"
            : business.type === "servico"
              ? "servico"
              : "restaurante";
  const url = `${APP_URL}/app/${path}/${business.slug ?? ""}`;

  const image = business.cover_url ?? business.logo_url ?? `${APP_URL}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Noronha Delivery",
      type: "website",
      locale: "pt_BR",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: business.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "og:image:secure_url": image,
    },
  };
}
