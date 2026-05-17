"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { BedDouble, CalendarDays, Check, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";
import { createBooking } from "@/app/actions/bookings";

type Room = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_night_cents: number;
  bed_layout: string | null;
  amenities: string[];
  photo: string | null;
};

import { SERVICE_FEE_BPS } from "@/lib/constants";

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function RoomsBookingFlow({
  businessId,
  businessName,
  rooms,
}: {
  businessId: string;
  businessName: string;
  rooms: Room[];
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(tomorrowIso());
  const [guests, setGuests] = useState(2);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nights = useMemo(() => {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / (24 * 3600 * 1000)));
  }, [checkIn, checkOut]);

  const eligibleRooms = useMemo(
    () => rooms.filter((r) => r.capacity >= guests),
    [rooms, guests],
  );

  const selectedRoom = eligibleRooms.find((r) => r.id === selectedRoomId) ?? null;

  const totals = useMemo(() => {
    if (!selectedRoom || nights < 1) return null;
    const subtotal = selectedRoom.price_per_night_cents * nights;
    const fee = Math.round((subtotal * SERVICE_FEE_BPS) / 10_000);
    return { subtotal, fee, total: subtotal + fee };
  }, [selectedRoom, nights]);

  function reserve() {
    if (!selectedRoom) {
      toast.error("Escolha um quarto");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setError(null);
    start(async () => {
      const res = await createBooking({
        businessId,
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        guests,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerWhatsapp: customerWhatsapp.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        if (res.error.toLowerCase().includes("login")) {
          router.push(`/entrar?next=/app/pousada/${businessName}`);
          return;
        }
        setError(res.error);
        return;
      }
      router.push(`/app/reservas/${res.bookingId}`);
    });
  }

  return (
    <div className="space-y-5 px-4 pb-32 pt-5">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold">
          <CalendarDays className="h-4 w-4 text-primary" />
          Quando e quantos
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="check-in">Check-in</Label>
            <Input
              id="check-in"
              type="date"
              min={todayIso()}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (new Date(e.target.value) >= new Date(checkOut)) {
                  const next = new Date(e.target.value);
                  next.setDate(next.getDate() + 1);
                  setCheckOut(next.toISOString().slice(0, 10));
                }
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="check-out">Check-out</Label>
            <Input
              id="check-out"
              type="date"
              min={checkIn}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guests">Hóspedes</Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {nights > 0
            ? `${nights} noite${nights === 1 ? "" : "s"} pra ${guests} hóspede${
                guests === 1 ? "" : "s"
              }`
            : "Selecione datas válidas"}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Quartos disponíveis</h2>
        {eligibleRooms.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum quarto comporta {guests} hóspedes. Reduza a quantidade ou tente outras datas.
          </p>
        ) : (
          <ul className="space-y-3">
            {eligibleRooms.map((r) => {
              const selected = r.id === selectedRoomId;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`flex w-full flex-col gap-3 rounded-2xl border bg-card p-3 text-left transition-colors sm:flex-row ${
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-40">
                      {r.photo ? (
                        <Image src={r.photo} alt={r.name} fill className="object-cover" sizes="200px" unoptimized />
                      ) : (
                        <BedDouble className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                      )}
                      {selected && (
                        <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold">{r.name}</h3>
                      {r.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                      )}
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" /> Até {r.capacity}
                        {r.bed_layout ? ` · ${r.bed_layout}` : ""}
                      </p>
                      {r.amenities?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.amenities.slice(0, 5).map((a) => (
                            <span key={a} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm font-bold">
                        {formatCents(r.price_per_night_cents)}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">/noite</span>
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedRoom && nights > 0 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">Seus dados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="customer-name">Nome completo</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Como vai no documento"
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
                placeholder="(81) 99999-0000"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Observações pra pousada</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Horário previsto de chegada, restrição alimentar, etc."
            />
          </div>
        </section>
      )}

      {selectedRoom && totals && (
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
                {formatCents(selectedRoom.price_per_night_cents)} × {nights} noite{nights === 1 ? "" : "s"}
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

      {selectedRoom && totals && (
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
                <>Reservar agora · {formatCents(totals.total)}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
