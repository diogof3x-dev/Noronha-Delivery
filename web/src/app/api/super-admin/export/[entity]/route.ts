import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { logAdminAction } from "@/lib/audit";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Entity = "orders" | "businesses" | "customers" | "drivers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
  if (!["orders", "businesses", "customers", "drivers"].includes(entity)) {
    return NextResponse.json({ ok: false, error: "Entidade inválida" }, { status: 400 });
  }

  // guard admin
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sem login" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Service role não configurado" }, { status: 500 });
  }

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");

  let csv = "";
  let filename = `${entity}.csv`;

  if (entity === "orders") {
    let q = admin
      .from("orders")
      .select(
        "id, code, status, payment_status, payment_method, subtotal_cents, delivery_fee_cents, service_fee_cents, platform_fee_cents, total_cents, business_id, customer_id, driver_id, destination_kind, destination_label, created_at, delivered_at, cancelled_at",
      )
      .order("created_at", { ascending: false })
      .limit(50000);
    if (since) q = q.gte("created_at", since);
    if (until) q = q.lte("created_at", until + "T23:59:59");
    const { data } = await q;
    csv = toCsv(data ?? [], [
      { key: "id", label: "id" },
      { key: "code", label: "codigo" },
      { key: "status", label: "status" },
      { key: "payment_status", label: "payment_status" },
      { key: "payment_method", label: "payment_method" },
      { key: "subtotal_cents", label: "subtotal_centavos" },
      { key: "delivery_fee_cents", label: "entrega_centavos" },
      { key: "service_fee_cents", label: "taxa_servico_centavos" },
      { key: "platform_fee_cents", label: "fee_plataforma_centavos" },
      { key: "total_cents", label: "total_centavos" },
      { key: "business_id", label: "business_id" },
      { key: "customer_id", label: "customer_id" },
      { key: "driver_id", label: "driver_id" },
      { key: "destination_kind", label: "destino_tipo" },
      { key: "destination_label", label: "destino_label" },
      { key: "created_at", label: "criado_em" },
      { key: "delivered_at", label: "entregue_em" },
      { key: "cancelled_at", label: "cancelado_em" },
    ]);
    filename = `pedidos_${since ?? "tudo"}_${until ?? "tudo"}.csv`;
  } else if (entity === "businesses") {
    const { data } = await admin.from("mv_business_lifetime").select("*").order("gmv_cents", { ascending: false });
    csv = toCsv(data ?? [], [
      { key: "business_id", label: "id" },
      { key: "name", label: "nome" },
      { key: "type", label: "tipo" },
      { key: "slug", label: "slug" },
      { key: "is_active", label: "ativo" },
      { key: "orders_count", label: "pedidos_total" },
      { key: "paid_count", label: "pedidos_pagos" },
      { key: "cancelled_count", label: "pedidos_cancelados" },
      { key: "gmv_cents", label: "gmv_centavos" },
      { key: "fee_cents", label: "receita_plataforma_centavos" },
      { key: "avg_ticket_cents", label: "ticket_medio_centavos" },
      { key: "first_order_at", label: "primeira_venda" },
      { key: "last_order_at", label: "ultima_venda" },
      { key: "business_created_at", label: "cadastrada_em" },
    ]);
    filename = `lojas.csv`;
  } else if (entity === "customers") {
    const { data } = await admin
      .from("mv_customer_lifetime")
      .select("*")
      .order("total_spent_cents", { ascending: false });
    csv = toCsv(data ?? [], [
      { key: "customer_id", label: "id" },
      { key: "name", label: "nome" },
      { key: "whatsapp", label: "whatsapp" },
      { key: "district", label: "bairro" },
      { key: "is_resident", label: "residente" },
      { key: "orders_count", label: "pedidos_total" },
      { key: "paid_orders_count", label: "pedidos_pagos" },
      { key: "total_spent_cents", label: "gasto_total_centavos" },
      { key: "avg_ticket_cents", label: "ticket_medio_centavos" },
      { key: "last_order_at", label: "ultimo_pedido" },
      { key: "customer_created_at", label: "cadastro_em" },
    ]);
    filename = `clientes.csv`;
  } else if (entity === "drivers") {
    const { data } = await admin
      .from("mv_driver_lifetime")
      .select("*")
      .order("deliveries_count", { ascending: false });
    csv = toCsv(data ?? [], [
      { key: "driver_id", label: "id" },
      { key: "name", label: "nome" },
      { key: "whatsapp", label: "whatsapp" },
      { key: "deliveries_count", label: "entregas_total" },
      { key: "delivered_count", label: "entregas_concluidas" },
      { key: "earnings_cents", label: "ganhos_total_centavos" },
      { key: "last_delivery_at", label: "ultima_entrega" },
      { key: "driver_created_at", label: "cadastro_em" },
    ]);
    filename = `motoboys.csv`;
  }

  await logAdminAction({
    adminId: user.id,
    action: "export_csv",
    targetType: "setting",
    targetLabel: `export ${entity}`,
    payload: { entity, since, until, rows: csv.split("\n").length - 2 },
  });

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
