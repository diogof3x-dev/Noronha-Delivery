import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPaymentStatus } from "@/lib/payments/mercadopago";
import type { Database } from "@/lib/supabase/database.types";
import { sendOrderPaidNotification } from "@/lib/email";
import { captureError } from "@/lib/observability";
import { recordWebhookEvent } from "@/lib/webhook-dedup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyMpSignature(req: Request, paymentId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Fail-closed em prod/preview: secret é obrigatório. Em dev (npm run dev
    // sem env), aceita pra não travar testes locais com tunnels.
    return process.env.NODE_ENV === "development";
  }

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
    id?: string | number;
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

  // dedup pelo notification id (com fallback paymentId+action)
  const eventId = data.id
    ? String(data.id)
    : `${paymentId}:${data.action ?? data.type ?? "unknown"}`;
  const supa = admin();
  const dedup = await recordWebhookEvent(supa, "mercadopago", eventId, body);
  if (dedup === "duplicate") {
    return NextResponse.json({ ok: true, deduped: true });
  }

  let pay;
  try {
    pay = await getPaymentStatus(paymentId);
  } catch (e) {
    captureError(e, {
      message: "mp webhook getPaymentStatus failed",
      tags: { provider: "mercadopago", payment_id: paymentId },
    });
    return NextResponse.json({ ok: false, error: "MP get falhou" }, { status: 502 });
  }

  if (!pay.externalReference) {
    return NextResponse.json({ ok: true, ignored: "sem externalReference" });
  }

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

  // Notificações por email só quando virou paid
  if (mapped.paymentStatus === "paid") {
    void notifyOrderPaid(supa, order.id);
  }

  return NextResponse.json({ ok: true });
}

async function notifyOrderPaid(supa: ReturnType<typeof admin>, orderId: string) {
  try {
    const { data: full } = await supa
      .from("orders")
      .select(
        "id, code, total_cents, customer_id, delivery_code, destination_label, business_id, businesses(name, owner_id)",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!full) return;

    const biz = full.businesses as { name?: string; owner_id?: string } | null;
    const ownerId = biz?.owner_id ?? null;

    const [ownerProfile, customerProfile, ownerAuth, customerAuth] = await Promise.all([
      ownerId
        ? supa.from("profiles").select("full_name").eq("id", ownerId).maybeSingle()
        : Promise.resolve({ data: null }),
      full.customer_id
        ? supa.from("profiles").select("full_name").eq("id", full.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      ownerId ? supa.auth.admin.getUserById(ownerId) : Promise.resolve({ data: { user: null } }),
      full.customer_id
        ? supa.auth.admin.getUserById(full.customer_id)
        : Promise.resolve({ data: { user: null } }),
    ]);

    await sendOrderPaidNotification({
      orderId: full.id,
      orderCode: full.code,
      businessName: biz?.name ?? "—",
      totalCents: full.total_cents,
      ownerEmail: ownerAuth.data.user?.email ?? null,
      ownerName: (ownerProfile.data as { full_name?: string } | null)?.full_name ?? null,
      customerEmail: customerAuth.data.user?.email ?? null,
      customerName: (customerProfile.data as { full_name?: string } | null)?.full_name ?? null,
      deliveryCode: full.delivery_code,
      destinationLabel: full.destination_label,
    });
  } catch (e) {
    captureError(e, {
      message: "mp webhook notifyOrderPaid failed",
      tags: { provider: "mercadopago", order_id: orderId },
    });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" });
}
