import { Resend } from "resend";

const NOTIFICATION_TO = "contato@noronhadelivery.com";
const NOTIFICATION_CC = ["agenciaf3xia@gmail.com"];
const NOTIFICATION_FROM = "Noronha Delivery <contato@noronhadelivery.com>";

let cached: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Resend(key);
  return cached;
}

const LEAD_LABEL: Record<string, string> = {
  waitlist: "Fila de lançamento (turista/morador)",
  comercio: "Pré-cadastro de comércio",
  operador: "Pré-cadastro de operador",
  motorista: "Pré-cadastro de motorista",
  pousada: "Pré-cadastro de pousada",
};

type LeadEmailInput = {
  type: string;
  name: string;
  whatsapp: string;
  email?: string | null;
  payload?: Record<string, unknown>;
};

function payloadHtml(payload: Record<string, unknown> | undefined): string {
  if (!payload) return "";
  const entries = Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return "";
  const rows = entries
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-weight:500;text-transform:capitalize;">${k.replace(/_/g, " ")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a2332;">${String(v)}</td>
        </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">${rows}</table>`;
}

export async function sendLeadNotification(lead: LeadEmailInput): Promise<void> {
  const resend = getResend();
  const label = LEAD_LABEL[lead.type] ?? lead.type;

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY ausente — não vai enviar notificação. Lead recebido:`, {
      type: lead.type,
      name: lead.name,
      whatsapp: lead.whatsapp,
    });
    return;
  }

  try {
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="background:linear-gradient(135deg,#0B7FA8 0%,#2D8659 100%);padding:24px;color:#fff;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;opacity:0.85;">Novo pré-cadastro</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px;">${label}</div>
        </div>
        <div style="padding:24px;">
          <div style="font-size:18px;font-weight:600;color:#1a2332;">${lead.name}</div>
          <div style="margin-top:4px;color:#666;font-size:14px;">
            WhatsApp: <a href="https://wa.me/${lead.whatsapp.replace(/\D/g, "")}" style="color:#FF6B35;text-decoration:none;font-weight:500;">${lead.whatsapp}</a>
            ${lead.email ? `<br/>E-mail: <a href="mailto:${lead.email}" style="color:#FF6B35;text-decoration:none;font-weight:500;">${lead.email}</a>` : ""}
          </div>
          ${payloadHtml(lead.payload)}
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;">
            Recebido em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Recife" })} (horário de Noronha)
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: NOTIFICATION_FROM,
      to: NOTIFICATION_TO,
      cc: NOTIFICATION_CC,
      replyTo: lead.email ?? undefined,
      subject: `Noronha Delivery · ${label} — ${lead.name}`,
      html,
    });
  } catch (err) {
    console.error("[email] sendLeadNotification failed", err);
  }
}

type OrderPaidInput = {
  orderCode: string;
  orderId: string;
  businessName: string;
  totalCents: number;
  ownerEmail?: string | null;
  ownerName?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  deliveryCode?: string | null;
  destinationLabel?: string | null;
};

function brl(c: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
}

export async function sendOrderPaidNotification(input: OrderPaidInput): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY ausente — pedido pago não notificado:", input.orderCode);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://noronhadelivery.com";
  const orderLink = `${appUrl}/app/pedidos/${input.orderId}`;

  // 1) Lojista
  if (input.ownerEmail) {
    try {
      const html = `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
          <div style="background:linear-gradient(135deg,#FF6B35 0%,#FF8B53 100%);padding:24px;color:#fff;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;opacity:0.9;">Novo pedido pago</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px;">#${input.orderCode}</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 8px 0;color:#1a2332;font-size:16px;">Oi ${input.ownerName ?? input.businessName}!</p>
            <p style="margin:0;color:#555;font-size:14px;">Um pedido de ${brl(input.totalCents)} acabou de ser pago. Confirma a aceitação pelo painel pra começar o preparo.</p>
            <a href="${appUrl}/parceiro/painel/pedidos" style="display:inline-block;margin-top:20px;background:#FF6B35;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">Abrir painel de pedidos</a>
            ${input.destinationLabel ? `<p style="margin-top:16px;font-size:13px;color:#666;"><strong>Destino:</strong> ${input.destinationLabel}</p>` : ""}
          </div>
        </div>`;
      await resend.emails.send({
        from: NOTIFICATION_FROM,
        to: input.ownerEmail,
        subject: `Noronha Delivery · Pedido pago #${input.orderCode} (${brl(input.totalCents)})`,
        html,
      });
    } catch (err) {
      console.error("[email] sendOrderPaidNotification owner failed", err);
    }
  }

  // 2) Cliente — confirmação + código de entrega
  if (input.customerEmail) {
    try {
      const html = `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
          <div style="background:linear-gradient(135deg,#2D8659 0%,#3FA873 100%);padding:24px;color:#fff;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;opacity:0.9;">Pagamento confirmado</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px;">#${input.orderCode}</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 8px 0;color:#1a2332;font-size:16px;">Oi ${input.customerName ?? "viajante"}!</p>
            <p style="margin:0;color:#555;font-size:14px;">Seu pedido em <strong>${input.businessName}</strong> foi pago. Vamos avisar quando sair pra entrega.</p>
            ${
              input.deliveryCode
                ? `<div style="margin-top:20px;padding:16px;background:#f5fff8;border:2px solid #2D8659;border-radius:12px;text-align:center;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#2D8659;font-weight:600;">Código de entrega</div>
                    <div style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:0.4em;margin-top:6px;color:#1a2332;">${input.deliveryCode}</div>
                    <div style="font-size:11px;color:#666;margin-top:4px;">Mostre só pro entregador na hora da entrega</div>
                  </div>`
                : ""
            }
            <a href="${orderLink}" style="display:inline-block;margin-top:20px;background:#FF6B35;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">Acompanhar pedido</a>
          </div>
        </div>`;
      await resend.emails.send({
        from: NOTIFICATION_FROM,
        to: input.customerEmail,
        subject: `Noronha Delivery · Pedido confirmado #${input.orderCode}`,
        html,
      });
    } catch (err) {
      console.error("[email] sendOrderPaidNotification customer failed", err);
    }
  }
}
