import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServerClient } from "@/lib/supabase/server-client";
import { ReciboDocument, type ReciboData } from "@/lib/recibo-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // RLS já restringe — cliente, lojista owner, motoboy e admin conseguem ler
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, code, status, payment_method, payment_status, customer_id, business_id, subtotal_cents, delivery_fee_cents, service_fee_cents, coupon_discount_cents, coupon_code, total_cents, destination_kind, destination_label, delivery_code, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) return NextResponse.json({ ok: false, error: "Não encontrado" }, { status: 404 });

  const [{ data: customer }, { data: biz }, { data: items }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", order.customer_id).maybeSingle(),
    supabase.from("businesses").select("name").eq("id", order.business_id).maybeSingle(),
    supabase
      .from("order_items")
      .select("name_snapshot, quantity, total_cents")
      .eq("order_id", id)
      .order("created_at"),
  ]);

  const data: ReciboData = {
    orderCode: order.code,
    createdAt: order.created_at,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    businessName: biz?.name ?? "—",
    customerName: customer?.full_name ?? null,
    destinationKind: order.destination_kind,
    destinationLabel: order.destination_label,
    items: (items ?? []).map((it) => ({
      name: it.name_snapshot,
      quantity: it.quantity,
      totalCents: it.total_cents,
    })),
    subtotalCents: order.subtotal_cents,
    deliveryFeeCents: order.delivery_fee_cents,
    serviceFeeCents: order.service_fee_cents,
    couponCode: order.coupon_code,
    couponDiscountCents: order.coupon_discount_cents ?? 0,
    totalCents: order.total_cents,
    deliveryCode: order.delivery_code,
  };

  const buffer = await renderToBuffer(<ReciboDocument data={data} />);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="recibo-${order.code}.pdf"`,
      "cache-control": "private, max-age=300",
    },
  });
}
