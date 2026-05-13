import { MercadoPagoConfig, Payment } from "mercadopago";

let cachedClient: MercadoPagoConfig | null = null;

function getClient(): MercadoPagoConfig {
  if (cachedClient) return cachedClient;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN não configurado");
  }
  cachedClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10_000 },
  });
  return cachedClient;
}

export type CreatePixChargeInput = {
  orderId: string;
  amountCents: number;
  payerEmail: string;
  payerName?: string;
  description: string;
};

export type PixCharge = {
  paymentId: string;
  status: string;
  qrCodeBase64: string | null;
  qrCodeCopyPaste: string | null;
  ticketUrl: string | null;
  expiresAt: string | null;
};

export async function createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
  const client = getClient();
  const payment = new Payment(client);

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 30);

  const res = await payment.create({
    body: {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: "pix",
      payer: {
        email: input.payerEmail,
        first_name: input.payerName?.split(" ")[0],
        last_name: input.payerName?.split(" ").slice(1).join(" ") || undefined,
      },
      external_reference: input.orderId,
      date_of_expiration: expires.toISOString(),
      notification_url: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
        : undefined,
    },
  });

  const txData = res.point_of_interaction?.transaction_data;

  return {
    paymentId: String(res.id),
    status: res.status ?? "pending",
    qrCodeBase64: txData?.qr_code_base64 ?? null,
    qrCodeCopyPaste: txData?.qr_code ?? null,
    ticketUrl: txData?.ticket_url ?? null,
    expiresAt: res.date_of_expiration ?? null,
  };
}

export async function getPaymentStatus(paymentId: string): Promise<{
  status: string;
  externalReference: string | null;
  amountCents: number | null;
}> {
  const client = getClient();
  const payment = new Payment(client);
  const res = await payment.get({ id: paymentId });
  return {
    status: res.status ?? "pending",
    externalReference: res.external_reference ?? null,
    amountCents:
      res.transaction_amount != null
        ? Math.round(res.transaction_amount * 100)
        : null,
  };
}
