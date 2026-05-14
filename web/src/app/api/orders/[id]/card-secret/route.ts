import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server-client";
import { getStripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, payment_method, payment_status, payment_id")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.customer_id !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (order.payment_method !== "card") {
    return NextResponse.json({ error: "wrong method" }, { status: 400 });
  }
  if (!order.payment_id) {
    return NextResponse.json({ error: "no intent" }, { status: 404 });
  }
  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(order.payment_id);
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "stripe error" },
      { status: 500 },
    );
  }
}
