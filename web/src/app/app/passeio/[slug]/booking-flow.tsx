"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Check, Clock, Loader2, MapPin, Sailboat, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";
import { createTourBooking } from "@/app/actions/tour-booking";

const SERVICE_FEE_BPS = 199;

type Session = {
  id: string;
  start_at: string;
  capacity: number;
  spots_left: number;
  meeting_point: string | null;
};

type Tour = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number | null;
  capacity: number | null;
  image_url: string | null;
  sessions: Session[];
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

export function TourBookingFlow({
  businessId,
  tours,
}: {
  businessId: string;
  tours: Tour[];
}) {
  const router = useRouter();
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [paxCount, setPaxCount] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedTour = tours.find((t) => t.id === selectedTourId) ?? null;
  const selectedSession = selectedTour?.sessions.find((s) => s.id === selectedSessionId) ?? null;

  const totals = useMemo(() => {
    if (!selectedTour) return null;
    const subtotal = selectedTour.price_cents * paxCount;
    const fee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
    return { subtotal, fee, total: subtotal + fee };
  }, [selectedTour, paxCount]);

  function reserve() {
    if (!selectedTour || !selectedSession) {
      toast.error("Escolha um passeio e uma sessão");
      return;
    }
    if (paxCount > selectedSession.spots_left) {
      toast.error(`Restam ${selectedSession.spots_left} vagas nessa sessão`);
      return;
    }
    if (!customerName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setError(null);
    start(async () => {
      const res = await createTourBooking({
        businessId,
        serviceId: selectedTour.id,
        sessionId: selectedSession.id,
        paxCount,
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
      router.push(`/app/reservas-passeio/${res.bookingId}`);
    });
  }

  return (
    <div className="space-y-5 px-4 pb-32 pt-5">
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Escolha o passeio</h2>
        <ul className="space-y-3">
          {tours.map((t) => {
            const selected = t.id === selectedTourId;
            const sessionsCount = t.sessions.length;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTourId(t.id);
                    setSelectedSessionId(null);
                  }}
                  className={`flex w-full flex-col gap-3 rounded-2xl border bg-card p-3 text-left transition-colors sm:flex-row ${
                    selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-40">
                    {t.image_url ? (
                      <Image src={t.image_url} alt={t.name} fill className="object-cover" sizes="200px" unoptimized />
                    ) : (
                      <Sailboat className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                    )}
                    {selected && (
                      <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">{t.name}</h3>
                    {t.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {t.duration_minutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t.duration_minutes} min
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {sessionsCount} sessã{sessionsCount === 1 ? "o" : "es"} disponível
                        {sessionsCount === 1 ? "" : "is"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold">
                      {formatCents(t.price_cents)}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">/pessoa</span>
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selectedTour && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold">
            <CalendarDays className="h-4 w-4 text-primary" />
            Quando você quer ir
          </h2>
          {selectedTour.sessions.length === 0 ? (
            <p className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
              Sem sessões disponíveis nesse passeio.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedTour.sessions.map((s) => {
                const selected = s.id === selectedSessionId;
                const sold_out = s.spots_left === 0;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={sold_out}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                        sold_out
                          ? "border-border bg-muted/50 opacity-60"
                          : selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold capitalize">{formatDateTime(s.start_at)}</p>
                        {s.meeting_point && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {s.meeting_point}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs ${sold_out ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {sold_out ? "ESGOTADO" : `${s.spots_left} vaga${s.spots_left === 1 ? "" : "s"}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {selectedSession && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">Quantas pessoas</h2>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-background">
            <button
              type="button"
              onClick={() => setPaxCount((q) => Math.max(1, q - 1))}
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Diminuir"
            >
              −
            </button>
            <span className="inline-flex w-10 items-center justify-center text-sm font-bold">
              {paxCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setPaxCount((q) =>
                  Math.min(selectedSession.spots_left, Math.min(50, q + 1)),
                )
              }
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <Users className="mr-1 inline h-3 w-3" />
            {selectedSession.spots_left} vaga{selectedSession.spots_left === 1 ? "" : "s"} restantes
          </p>
        </section>
      )}

      {selectedSession && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">Seus dados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="customer-name">Nome completo</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="customer-email">Email (opcional)</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="customer-whatsapp">WhatsApp</Label>
              <Input
                id="customer-whatsapp"
                type="tel"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Observações pra operadora</Label>
            <Textarea
              id="notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Restrição alimentar, mobilidade, criança..."
            />
          </div>
        </section>
      )}

      {selectedSession && totals && (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Forma de pagamento
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                paymentMethod === "pix"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">PIX</span>
                <span className="text-[11px] text-muted-foreground">QR Code instantâneo</span>
              </span>
              <span
                className={`h-4 w-4 rounded-full border ${
                  paymentMethod === "pix" ? "border-primary bg-primary" : "border-muted-foreground/40"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                paymentMethod === "card"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">Cartão + Apple/Google Pay</span>
                <span className="text-[11px] text-muted-foreground">Crédito ou débito</span>
              </span>
              <span
                className={`h-4 w-4 rounded-full border ${
                  paymentMethod === "card" ? "border-primary bg-primary" : "border-muted-foreground/40"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 space-y-1 border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {formatCents(selectedTour!.price_cents)} × {paxCount} pax
              </span>
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

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {selectedSession && totals && (
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
                <>Reservar · {formatCents(totals.total)}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
