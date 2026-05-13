import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaymentStatus } from "@/lib/payments/mercadopago";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Service role não configurada");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapMpStatus(mp: string): {
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "confirmed" | "cancelled" | "refunded" | null;
} {
  switch (mp) {
    case "approved":
      return { paymentStatus: "paid", orderStatus: "confirmed" };
    case "rejected":
    case "cancelled":
      return { paymentStatus: "failed", orderStatus: "cancelled" };
    case "refunded":
    case "charged_back":
      return { paymentStatus: "refunded", orderStatus: "refunded" };
    default:
      return { paymentStatus: "pending", orderStatus: null };
  }
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const data = body as {
    type?: string;
    action?: string;
    data?: { id?: string | number };
  };

  const isPaymentEvent =
    data.type === "payment" || data.action?.startsWith("payment.");
  if (!isPaymentEvent) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const paymentId = data.data?.id ? String(data.data.id) : null;
  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "Sem paymentId" }, { status: 400 });
  }

  let pay;
  try {
    pay = await getPaymentStatus(paymentId);
  } catch (e) {
    console.error("[mp webhook] getPaymentStatus", e);
    return NextResponse.json({ ok: false, error: "MP get falhou" }, { status: 502 });
  }

  if (!pay.externalReference) {
    return NextResponse.json({ ok: true, ignored: "sem externalReference" });
  }

  const supa = admin();
  const { data: order } = await supa
    .from("orders")
    .select("id, total_cents, payment_status, status, business_id, platform_fee_cents")
    .eq("id", pay.externalReference)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ ok: true, ignored: "order não encontrada" });
  }

  if (pay.amountCents != null && Math.abs(pay.amountCents - order.total_cents) > 5) {
    console.warn("[mp webhook] valor divergente", {
      order: order.total_cents,
      mp: pay.amountCents,
    });
  }

  const mapped = mapMpStatus(pay.status);
  const update: Database["public"]["Tables"]["orders"]["Update"] = {
    payment_status: mapped.paymentStatus,
    payment_id: paymentId,
  };
  if (mapped.orderStatus && order.status === "pending") {
    update.status = mapped.orderStatus;
    if (mapped.orderStatus === "confirmed") {
      update.confirmed_at = new Date().toISOString();
    } else if (mapped.orderStatus === "cancelled") {
      update.cancelled_at = new Date().toISOString();
    }
  }

  await supa.from("orders").update(update).eq("id", order.id);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" });
}
