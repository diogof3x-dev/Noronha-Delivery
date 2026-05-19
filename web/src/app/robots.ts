import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noronhadelivery.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/parceiro/",
          "/entregador/",
          "/super-admin/",
          "/admin/",
          "/app/perfil",
          "/app/carteira",
          "/app/pedidos",
          "/app/notificacoes",
          "/app/onboarding",
          "/app/carrinho",
          "/app/favoritos",
          "/entrar",
          "/cadastrar",
          "/auth/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
