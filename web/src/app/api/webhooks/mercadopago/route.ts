import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPaymentStatus } from "@/lib/payments/mercadopago";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyMpSignature(req: Request, paymentId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret, deixa passar (dev)

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId || !paymentId) return false;

  const parts = Object.fromEntries(
    xSignature
      .split(",")
      .map((p) => p.trim().split("="))
      .filter((kv) => kv.length === 2),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
  const computed = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}

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

  if (!verifyMpSignature(req, paymentId)) {
    return NextResponse.json({ ok: false, error: "Assinatura inválida" }, { status: 401 });
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
