"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const Schema = z.object({
  q: z.string().min(1).max(80),
  limit: z.number().int().min(1).max(20).default(8),
});

export type SearchHit =
  | {
      type: "business";
      id: string;
      slug: string;
      name: string;
      district: string | null;
      cuisine: string | null;
      logoUrl: string | null;
      vitrineSegment: string;
    }
  | {
      type: "service";
      id: string;
      name: string;
      priceCents: number;
      imageUrl: string | null;
      businessId: string;
      businessSlug: string;
      businessName: string;
      vitrineSegment: string;
    };

const VITRINE_SEGMENT: Record<string, string> = {
  restaurante: "restaurante",
  mercado: "restaurante",
  farmacia: "restaurante",
  conveniencia: "restaurante",
  loja: "restaurante",
  pousada: "pousada",
  residencia: "casa",
  operador_passeio: "passeio",
  locadora: "aluguel",
  servico: "servico",
};

export type SearchResult =
  | { ok: true; hits: SearchHit[] }
  | { ok: false; error: string };

export async function searchInstant(input: {
  q: string;
  limit?: number;
}): Promise<SearchResult> {
  const parsed = Schema.safeParse({ q: input.q, limit: input.limit ?? 8 });
  if (!parsed.success) return { ok: true, hits: [] };

  const supabase = await getServerClient();
  const term = `%${parsed.data.q.trim()}%`;

  const [{ data: businesses }, { data: services }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, slug, name, district, logo_url, type, metadata")
      .eq("is_active", true)
      .ilike("name", term)
      .limit(parsed.data.limit),
    supabase
      .from("services")
      .select(
        "id, name, price_cents, image_url, business_id, businesses(slug, name, type, is_active)",
      )
      .eq("is_active", true)
      .ilike("name", term)
      .limit(parsed.data.limit),
  ]);

  const hits: SearchHit[] = [];

  for (const b of businesses ?? []) {
    const meta = (b.metadata as { cuisine?: string } | null) ?? {};
    hits.push({
      type: "business",
      id: b.id,
      slug: b.slug ?? b.id,
      name: b.name,
      district: b.district,
      cuisine: meta.cuisine ?? null,
      logoUrl: b.logo_url,
      vitrineSegment: VITRINE_SEGMENT[b.type] ?? "restaurante",
    });
  }

  for (const s of services ?? []) {
    const biz = s.businesses as {
      slug?: string;
      name?: string;
      type?: string;
      is_active?: boolean;
    } | null;
    if (!biz?.is_active) continue;
    hits.push({
      type: "service",
      id: s.id,
      name: s.name,
      priceCents: s.price_cents,
      imageUrl: s.image_url,
      businessId: s.business_id,
      businessSlug: biz.slug ?? s.business_id,
      businessName: biz.name ?? "",
      vitrineSegment: VITRINE_SEGMENT[biz.type ?? "restaurante"] ?? "restaurante",
    });
  }

  return { ok: true, hits };
}
