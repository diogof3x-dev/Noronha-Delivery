"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Check, Clock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";
import { createServiceBooking } from "@/app/actions/service-bookings";

import { SERVICE_FEE_BPS } from "@/lib/constants";

type Slot = {
  id: string;
  start_at: string;
  duration_minutes: number;
  spots_left: number;
  staff_name: string | null;
};

type SvcItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number | null;
  image_url: string | null;
  slots: Slot[];
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ServiceBookingFlow({
  businessId,
  services,
}: {
  businessId: string;
  services: SvcItem[];
}) {
  const router = useRouter();
  const [selectedSvcId, setSelectedSvcId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedSvc = services.find((s) => s.id === selectedSvcId) ?? null;
  const selectedSlot = selectedSvc?.slots.find((s) => s.id === selectedSlotId) ?? null;

  const totals = useMemo(() => {
    if (!selectedSvc) return null;
    const subtotal = selectedSvc.price_cents;
    const fee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
    return { subtotal, fee, total: subtotal + fee };
  }, [selectedSvc]);

  function reserve() {
    if (!selectedSvc || !selectedSlot) {
      toast.error("Escolha um serviço e horário");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setError(null);
    start(async () => {
      const res = await createServiceBooking({
        businessId,
        serviceId: selectedSvc.id,
        slotId: selectedSlot.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerWhatsapp: customerWhatsapp.trim() || undefined,
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
      router.push(`/app/agendamentos/${res.bookingId}`);
    });
  }

  return (
    <div className="space-y-5 px-4 pb-32 pt-5">
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Escolha o serviço</h2>
        <ul className="space-y-3">
          {services.map((s) => {
            const sel = s.id === selectedSvcId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSvcId(s.id);
                    setSelectedSlotId(null);
                  }}
                  className={`flex w-full flex-col gap-3 rounded-2xl border bg-card p-3 text-left transition-colors sm:flex-row ${
                    sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-40">
                    {s.image_url ? (
                      <Image src={s.image_url} alt={s.name} fill className="object-cover" sizes="200px" unoptimized />
                    ) : (
                      <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                    )}
                    {sel && (
                      <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">{s.name}</h3>
                    {s.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {s.duration_minutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {s.duration_minutes} min
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {s.slots.length} horário{s.slots.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold">{formatCents(s.price_cents)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selectedSvc && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold">
            <CalendarDays className="h-4 w-4 text-primary" />
            Horários disponíveis
          </h2>
          {selectedSvc.slots.length === 0 ? (
            <p className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
              Sem horários abertos. Fale com o atendente.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedSvc.slots.map((sl) => {
                const sel = sl.id === selectedSlotId;
                const full = sl.spots_left === 0;
                return (
                  <li key={sl.id}>
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => setSelectedSlotId(sl.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                        full
                          ? "border-border bg-muted/50 opacity-60"
                          : sel
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold capitalize">{formatDateTime(sl.start_at)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {sl.duration_minutes} min
                          {sl.staff_name ? ` · com ${sl.staff_name}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs ${full ? "text-destructive" : "text-muted-foreground"}`}>
                        {full ? "CHEIO" : `${sl.spots_left} vaga${sl.spots_left === 1 ? "" : "s"}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {selectedSlot && (
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
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>
      )}

      {selectedSlot && totals && (
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
                <span className="block text-sm font-semibold">Cartão · Apple/Google Pay</span>
              </span>
              <span className={`h-4 w-4 rounded-full border ${paymentMethod === "card" ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
            </button>
          </div>

          <div className="mt-3 space-y-1 border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedSvc!.name}</span>
              <span>{formatCents(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taxa de serviço</span>
              <span>{formatCents(totals.fee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCents(totals.total)}</span>
            </div>
          </div>
        </section>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {selectedSlot && totals && (
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
                  Agendando...
                </>
              ) : (
                <>Agendar · {formatCents(totals.total)}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
