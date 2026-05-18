"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const Schema = z.object({ order_id: z.string().uuid() });

export type ReorderResult =
  | {
      ok: true;
      business: {
        id: string;
        slug: string;
        name: string;
        deliveryFeeCents: number | null;
        minOrderCents: number | null;
        avgPrepMinutes: number | null;
      };
      items: Array<{
        serviceId: string;
        name: string;
        priceCents: number;
        quantity: number;
        imageUrl?: string | null;
        notes?: string;
        options?: Array<{
          groupId: string;
          groupName: string;
          optionId: string;
          optionName: string;
          priceDeltaCents: number;
        }>;
      }>;
      skipped: Array<{ name: string; reason: string }>;
      businessActive: boolean;
    }
  | { ok: false; error: string };

export async function prepareReorder(input: {
  orderId: string;
}): Promise<ReorderResult> {
  const parsed = Schema.safeParse({ order_id: input.orderId });
  if (!parsed.success) return { ok: false, error: "Pedido inválido" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login" };

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, customer_id, business_id, businesses(id, slug, name, delivery_fee_cents, min_order_cents, avg_prep_minutes, is_active)",
    )
    .eq("id", parsed.data.order_id)
    .maybeSingle();

  if (!order || order.customer_id !== user.id) {
    return { ok: false, error: "Sem permissão" };
  }

  const biz = order.businesses as {
    id?: string;
    slug?: string | null;
    name?: string;
    delivery_fee_cents?: number | null;
    min_order_cents?: number | null;
    avg_prep_minutes?: number | null;
    is_active?: boolean;
  } | null;
  if (!biz?.id) return { ok: false, error: "Estabelecimento indisponível" };

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("service_id, name_snapshot, quantity, unit_price_cents, customizations, notes")
    .eq("order_id", parsed.data.order_id);

  if (!orderItems?.length) {
    return { ok: false, error: "Pedido sem itens" };
  }

  const serviceIds = orderItems
    .map((i) => i.service_id)
    .filter((x): x is string => !!x);
  const { data: services } = serviceIds.length
    ? await supabase
        .from("services")
        .select("id, name, price_cents, image_url, is_active, business_id")
        .in("id", serviceIds)
    : { data: [] };
  const svcMap = new Map((services ?? []).map((s) => [s.id, s]));

  type ReorderItem = Extract<ReorderResult, { ok: true }>["items"][number];
  const items: ReorderItem[] = [];
  const skipped: Array<{ name: string; reason: string }> = [];

  for (const oi of orderItems) {
    if (!oi.service_id) {
      skipped.push({ name: oi.name_snapshot, reason: "item antigo" });
      continue;
    }
    const svc = svcMap.get(oi.service_id);
    if (!svc) {
      skipped.push({ name: oi.name_snapshot, reason: "removido do cardápio" });
      continue;
    }
    if (!svc.is_active) {
      skipped.push({ name: oi.name_snapshot, reason: "indisponível" });
      continue;
    }
    if (svc.business_id !== biz.id) {
      skipped.push({ name: oi.name_snapshot, reason: "mudou de loja" });
      continue;
    }

    // reconstrói customizations
    const custom = oi.customizations as
      | { options?: Array<{ group: string; option: string; delta_cents: number }> }
      | null;
    const options = (custom?.options ?? []).map((o, idx) => ({
      groupId: `legacy-${idx}`,
      groupName: o.group,
      optionId: `legacy-opt-${idx}`,
      optionName: o.option,
      priceDeltaCents: o.delta_cents,
    }));
    const optionsDelta = options.reduce((sum, o) => sum + o.priceDeltaCents, 0);
    const expectedUnit = svc.price_cents + optionsDelta;

    items.push({
      serviceId: oi.service_id,
      name: svc.name,
      priceCents: expectedUnit, // usa preço ATUAL (não o snapshot do pedido antigo)
      quantity: oi.quantity,
      imageUrl: svc.image_url,
      notes: oi.notes ?? undefined,
      options: options.length ? options : undefined,
    });
  }

  if (items.length === 0) {
    return {
      ok: false,
      error: "Nenhum item desse pedido está disponível agora",
    };
  }

  return {
    ok: true,
    business: {
      id: biz.id,
      slug: biz.slug ?? biz.id,
      name: biz.name ?? "Loja",
      deliveryFeeCents: biz.delivery_fee_cents ?? 0,
      minOrderCents: biz.min_order_cents ?? null,
      avgPrepMinutes: biz.avg_prep_minutes ?? null,
    },
    items,
    skipped,
    businessActive: !!biz.is_active,
  };
}
