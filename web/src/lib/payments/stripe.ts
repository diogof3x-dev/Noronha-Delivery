import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado");
  cached = new Stripe(key, { typescript: true });
  return cached;
}

export type CreatePaymentIntentInput = {
  orderId: string;
  amountCents: number;
  applicationFeeCents?: number;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: "brl",
    receipt_email: input.customerEmail,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: input.orderId,
      applicationFeeCents: String(input.applicationFeeCents ?? 0),
      ...(input.metadata ?? {}),
    },
  });

  if (!intent.client_secret) {
    throw new Error("Stripe não retornou client_secret");
  }

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
