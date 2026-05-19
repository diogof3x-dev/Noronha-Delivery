import type { MetadataRoute } from "next";
import { getAdminClient } from "@/lib/supabase/admin-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noronhadelivery.com";

const PATH_BY_TYPE: Record<string, string> = {
  restaurante: "/app/restaurante",
  mercado: "/app/restaurante",
  farmacia: "/app/restaurante",
  conveniencia: "/app/restaurante",
  loja: "/app/restaurante",
  pousada: "/app/pousada",
  residencia: "/app/casa",
  operador_passeio: "/app/passeio",
  locadora: "/app/aluguel",
  servico: "/app/servico",
};

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/app`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/app/comida`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/sou-comercio`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sou-motorista`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sou-operador`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sou-pousada`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const admin = getAdminClient();
  if (!admin) return staticRoutes;

  const { data: businesses } = await admin
    .from("businesses")
    .select("slug, type, updated_at")
    .eq("is_active", true)
    .not("slug", "is", null)
    .limit(5000);

  const dynamicRoutes: MetadataRoute.Sitemap = [];
  for (const b of businesses ?? []) {
    const base = PATH_BY_TYPE[b.type as string];
    if (!base || !b.slug) continue;
    dynamicRoutes.push({
      url: `${BASE_URL}${base}/${b.slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}
