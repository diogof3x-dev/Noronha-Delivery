import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { verifyWebhookSignature } from "@/lib/payments/stripe";
import type { Database } from "@/lib/supabase/database.types";
import { sendOrderPaidNotification } from "@/lib/email";

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

    void notifyOrderPaid(supa, orderId);
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
      ownerId ? supa.from("profiles").select("full_name").eq("id", ownerId).maybeSingle() : Promise.resolve({ data: null }),
      full.customer_id ? supa.from("profiles").select("full_name").eq("id", full.customer_id).maybeSingle() : Promise.resolve({ data: null }),
      ownerId ? supa.auth.admin.getUserById(ownerId) : Promise.resolve({ data: { user: null } }),
      full.customer_id ? supa.auth.admin.getUserById(full.customer_id) : Promise.resolve({ data: { user: null } }),
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
    console.error("[stripe webhook] notifyOrderPaid failed", e);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "stripe-webhook" });
}
