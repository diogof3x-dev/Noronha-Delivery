// Fetch direto na API REST do MP — sem SDK pra cortar peso do bundle.
// Docs: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post

const MP_BASE = "https://api.mercadopago.com";

function token(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não configurado");
  return t;
}

async function mpRequest<T = unknown>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;
  const res = await fetch(`${MP_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    // 10s timeout via AbortController
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new Error(`MP ${res.status}: ${JSON.stringify(body)}`);
  }
  return res.json() as Promise<T>;
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

type MpPaymentResponse = {
  id: number | string;
  status?: string;
  date_of_expiration?: string;
  external_reference?: string;
  transaction_amount?: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
      ticket_url?: string;
    };
  };
};

export async function createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 30);

  const [firstName, ...rest] = (input.payerName ?? "").split(" ");
  const lastName = rest.join(" ") || undefined;

  const body = {
    transaction_amount: input.amountCents / 100,
    description: input.description,
    payment_method_id: "pix",
    payer: {
      email: input.payerEmail,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
    },
    external_reference: input.orderId,
    date_of_expiration: expires.toISOString(),
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? { notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago` }
      : {}),
  };

  const res = await mpRequest<MpPaymentResponse>("/v1/payments", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey: `pix-${input.orderId}`,
  });

  const tx = res.point_of_interaction?.transaction_data;
  return {
    paymentId: String(res.id),
    status: res.status ?? "pending",
    qrCodeBase64: tx?.qr_code_base64 ?? null,
    qrCodeCopyPaste: tx?.qr_code ?? null,
    ticketUrl: tx?.ticket_url ?? null,
    expiresAt: res.date_of_expiration ?? null,
  };
}

export async function getPaymentStatus(paymentId: string): Promise<{
  status: string;
  externalReference: string | null;
  amountCents: number | null;
}> {
  const res = await mpRequest<MpPaymentResponse>(`/v1/payments/${paymentId}`);
  return {
    status: res.status ?? "pending",
    externalReference: res.external_reference ?? null,
    amountCents:
      res.transaction_amount != null ? Math.round(res.transaction_amount * 100) : null,
  };
}
