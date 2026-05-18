"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertOctagon,
  Banknote,
  Bike,
  CreditCard,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { ReportProblemModal } from "./report-problem-modal";

type Props = {
  orderId: string;
  code: string;
  status: string;
  statusLabel: string;
  driverEarningsCents: number;
  paymentMethod: string;
  paymentStatus: string;
  totalCents: number;
  businessName: string;
  pickupAddr: string | null;
  pickupQuery: string | null;
  destinationKind: string | null;
  destinationLabel: string | null;
  destinationNotes: string | null;
  destQuery: string | null;
  routeKm: number | null;
  customerName: string | null;
  customerWhatsapp: string | null;
  businessWhatsapp: string | null;
  stepButtons: React.ReactNode;
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  card: "Cartão",
  cash: "Dinheiro na entrega",
};

const PAYMENT_PAID_LABEL: Record<string, string> = {
  pix: "✓ PIX já pago",
  card: "✓ Cartão já pago",
};

function waLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function telLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `tel:+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export function ActiveOrderCard({
  orderId,
  code,
  status,
  statusLabel,
  driverEarningsCents,
  paymentMethod,
  paymentStatus,
  totalCents,
  businessName,
  pickupAddr,
  pickupQuery,
  destinationKind,
  destinationLabel,
  destinationNotes,
  destQuery,
  routeKm,
  customerName,
  customerWhatsapp,
  businessWhatsapp,
  stepButtons,
}: Props) {
  const [reportOpen, setReportOpen] = useState(false);

  const isInTransit = status === "in_transit";
  const navTargetQuery = isInTransit ? destQuery : pickupQuery;
  const navTargetLabel = isInTransit ? "Ir pro cliente" : "Ir buscar na loja";

  return (
    <li className="rounded-2xl border-2 border-[color:var(--turtle)]/40 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">#{code}</p>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Você ganha
          </p>
          <p className="text-xl font-bold leading-none text-[color:var(--turtle)]">
            {formatCents(driverEarningsCents)}
          </p>
        </div>
      </div>

      {/* CTA principal — botão de navegação */}
      {navTargetQuery && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navTargetQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground"
        >
          <MapPin className="h-4 w-4" />
          {navTargetLabel}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Endereços */}
      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-medium">{businessName}</p>
            {pickupQuery ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:underline"
              >
                {pickupAddr ?? "—"} ↗
              </a>
            ) : (
              <p className="text-muted-foreground">{pickupAddr ?? "—"}</p>
            )}
          </div>
        </div>

        {destinationLabel && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--turtle)]" />
            <div className="flex-1">
              <p className="font-medium capitalize">
                {destinationKind ?? "Destino"}: {customerName ?? "Cliente"}
              </p>
              {destQuery ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:underline"
                >
                  {destinationLabel} ↗
                </a>
              ) : (
                <p className="text-muted-foreground">{destinationLabel}</p>
              )}
              {destinationNotes && (
                <p className="mt-0.5 italic text-[11px] text-muted-foreground">
                  &quot;{destinationNotes}&quot;
                </p>
              )}
            </div>
          </div>
        )}

        {routeKm != null && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Bike className="h-3 w-3" />
            Rota total: <strong>{routeKm.toFixed(1)} km</strong>
          </p>
        )}
      </div>

      {/* Pagamento — destaque pra dinheiro */}
      <div className="mt-3 rounded-lg border border-border bg-background p-2 text-xs">
        {paymentMethod === "cash" ? (
          <p className="flex items-center gap-2 font-bold text-[color:var(--sun)]">
            <Banknote className="h-4 w-4" />
            Dinheiro na entrega — cobrar {formatCents(totalCents)}
          </p>
        ) : paymentStatus === "paid" ? (
          <p className="flex items-center gap-2 text-[color:var(--turtle)]">
            <CreditCard className="h-3.5 w-3.5" />
            {PAYMENT_PAID_LABEL[paymentMethod] ?? PAYMENT_LABEL[paymentMethod]}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            {PAYMENT_LABEL[paymentMethod] ?? paymentMethod}
            <span className="text-[10px]">· aguardando pagamento</span>
          </p>
        )}
      </div>

      {/* Comunicação */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {waLink(customerWhatsapp) ? (
          <a
            href={waLink(customerWhatsapp)!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 px-3 py-2 text-xs font-semibold text-[color:var(--turtle)]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp cliente
          </a>
        ) : (
          <span className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            sem whatsapp do cliente
          </span>
        )}
        {telLink(customerWhatsapp) && (
          <a
            href={telLink(customerWhatsapp)!}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold"
          >
            <Phone className="h-3.5 w-3.5" />
            Ligar cliente
          </a>
        )}
      </div>

      {waLink(businessWhatsapp) && (
        <a
          href={waLink(businessWhatsapp)!}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp da loja ({businessName})
        </a>
      )}

      {stepButtons}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        <Link
          href={`/app/pedidos/${orderId}`}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Receipt className="h-3 w-3" />
          Itens do pedido
        </Link>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
        >
          <AlertOctagon className="h-3 w-3" />
          Reportar problema
        </button>
      </div>

      {reportOpen && (
        <ReportProblemModal
          orderId={orderId}
          code={code}
          onClose={() => setReportOpen(false)}
        />
      )}
    </li>
  );
}
