"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Bike, CalendarDays, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";
import { createRentalBooking } from "@/app/actions/rentals";

import { SERVICE_FEE_BPS } from "@/lib/constants";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  deposit_cents: number;
};

function todayIso() {
  return new Date().toISOString().slice(0, 16);
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 16);
}

export function RentalBookingFlow({
  businessId,
  items,
}: {
  businessId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [pickupAt, setPickupAt] = useState(todayIso());
  const [returnAt, setReturnAt] = useState(tomorrowIso());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const a = new Date(pickupAt);
    const b = new Date(returnAt);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (24 * 3600 * 1000)));
  }, [pickupAt, returnAt]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const totals = useMemo(() => {
    if (!selected || days < 1) return null;
    const subtotal = selected.price_cents * days;
    const fee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
    const total = subtotal + fee + selected.deposit_cents;
    return { subtotal, fee, deposit: selected.deposit_cents, total };
  }, [selected, days]);

  function reserve() {
    if (!selected) {
      toast.error("Escolha um equipamento");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setError(null);
    start(async () => {
      const res = await createRentalBooking({
        businessId,
        serviceId: selected.id,
        pickupAt,
        returnAt,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerWhatsapp: customerWhatsapp.trim() || undefined,
        customerDocument: customerDocument.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        if (res.error.toLowerCase().includes("login")) {
          router.push("/entrar?next=/app");
          return;
        }
        setError(res.error);
        return;
      }
      router.push(`/app/locacoes/${res.bookingId}`);
    });
  }

  return (
    <div className="space-y-5 px-4 pb-32 pt-5">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold">
          <CalendarDays className="h-4 w-4 text-primary" />
          Período do aluguel
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="pickup">Retirada</Label>
            <Input
              id="pickup"
              type="datetime-local"
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="return">Devolução</Label>
            <Input
              id="return"
              type="datetime-local"
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {days > 0 ? `${days} dia${days === 1 ? "" : "s"} de aluguel` : "Selecione datas válidas"}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Equipamentos</h2>
        <ul className="space-y-3">
          {items.map((it) => {
            const isSelected = it.id === selectedId;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(it.id)}
                  className={`flex w-full flex-col gap-3 rounded-2xl border bg-card p-3 text-left transition-colors sm:flex-row ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-40">
                    {it.image_url ? (
                      <Image src={it.image_url} alt={it.name} fill className="object-cover" sizes="200px" unoptimized />
                    ) : (
                      <Bike className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                    )}
                    {isSelected && (
                      <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">{it.name}</h3>
                    {it.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.description}</p>
                    )}
                    {it.deposit_cents > 0 && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Caução: {formatCents(it.deposit_cents)}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-bold">
                      {formatCents(it.price_cents)}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">/dia</span>
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selected && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">Seus dados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="customer-name">Nome completo</Label>
              <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="customer-email">Email (opcional)</Label>
              <Input id="customer-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="customer-whatsapp">WhatsApp</Label>
              <Input id="customer-whatsapp" type="tel" value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(e.target.value)} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="customer-document">CNH / Documento (recomendado)</Label>
              <Input id="customer-document" value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>
      )}

      {selected && totals && (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Forma de pagamento
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                paymentMethod === "pix" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">PIX</span>
                <span className="text-[11px] text-muted-foreground">QR Code instantâneo</span>
              </span>
              <span className={`h-4 w-4 rounded-full border ${paymentMethod === "pix" ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">Cartão + Apple/Google Pay</span>
                <span className="text-[11px] text-muted-foreground">Crédito ou débito</span>
              </span>
              <span className={`h-4 w-4 rounded-full border ${paymentMethod === "card" ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
            </button>
          </div>

          <div className="mt-3 space-y-1 border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {formatCents(selected.price_cents)} × {days} dia{days === 1 ? "" : "s"}
              </span>
              <span>{formatCents(totals.subtotal)}</span>
            </div>
            {totals.deposit > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Caução (devolvida ao final)</span>
                <span>{formatCents(totals.deposit)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taxa de serviço</span>
              <span>{formatCents(totals.fee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total agora</span>
              <span>{formatCents(totals.total)}</span>
            </div>
          </div>
        </section>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {selected && totals && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-primary/20 bg-background/95 px-4 pt-3 backdrop-blur"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <div className="mx-auto max-w-md">
            <Button
              size="lg"
              className="h-14 w-full text-base font-bold shadow-lg shadow-primary/40"
              disabled={pending}
              onClick={reserve}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Reservando...
                </>
              ) : (
                <>Alugar · {formatCents(totals.total)}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
