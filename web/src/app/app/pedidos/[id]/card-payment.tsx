"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) return null;
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export function CardPaymentPanel({
  orderId,
  clientSecret,
}: {
  orderId: string;
  clientSecret: string;
}) {
  const stripe = useMemo(() => getStripe(), []);

  if (!stripe) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        Pagamento por cartão indisponível: chave pública do Stripe não configurada.
      </p>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Pague com cartão
        </p>
        <p className="text-xs text-muted-foreground">
          Apple Pay e Google Pay aparecem automaticamente no seu dispositivo.
        </p>
      </header>
      <Elements
        stripe={stripe}
        options={{
          clientSecret,
          appearance: { theme: "stripe" },
        }}
      >
        <Inner orderId={orderId} />
      </Elements>
    </section>
  );
}

function Inner({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !elements) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("payment_intent_client_secret")) {
      stripe
        .retrievePaymentIntent(url.searchParams.get("payment_intent_client_secret")!)
        .then(({ paymentIntent }) => {
          if (paymentIntent?.status === "succeeded") {
            router.refresh();
          }
        });
    }
  }, [stripe, elements, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/pedidos/${orderId}`,
      },
      redirect: "if_required",
    });
    if (submitError) {
      setError(submitError.message ?? "Falha ao processar pagamento");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" size="lg" disabled={!stripe || busy} className="w-full">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirmando...
          </>
        ) : (
          "Pagar agora"
        )}
      </Button>
    </form>
  );
}
