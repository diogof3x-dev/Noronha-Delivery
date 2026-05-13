import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { verifyWebhookSignature } from "@/lib/payments/stripe";
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

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Sem secret" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Sem assinatura" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(raw, signature, secret);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Assinatura inválida" },
      { status: 400 },
    );
  }

  const supa = admin();

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;
    if (!orderId) return NextResponse.json({ ok: true, ignored: "sem orderId" });

    await supa
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_id: pi.id,
      })
      .eq("id", orderId)
      .eq("status", "pending");
    return NextResponse.json({ ok: true });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;
    if (!orderId) return NextResponse.json({ ok: true, ignored: "sem orderId" });

    await supa
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId);
    return NextResponse.json({ ok: true });
  }

  if (event.type === "charge.refunded") {
    const ch = event.data.object as Stripe.Charge;
    const orderId = ch.metadata?.orderId;
    if (!orderId) return NextResponse.json({ ok: true, ignored: "sem orderId" });

    await supa
      .from("orders")
      .update({
        payment_status: "refunded",
        status: "refunded",
      })
      .eq("id", orderId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: event.type });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "stripe-webhook" });
}
