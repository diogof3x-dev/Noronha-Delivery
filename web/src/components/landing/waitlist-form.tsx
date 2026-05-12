"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitWaitlist, type WaitlistState } from "@/app/actions/waitlist";

const initialState: WaitlistState = { ok: false };

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(submitWaitlist, initialState);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/10 p-6 text-center">
        <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold">Você está na fila</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vamos te avisar pelo WhatsApp quando o app for lançado. Bem-vindo à Noronha
          Delivery.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required placeholder="Como podemos te chamar?" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            required
            inputMode="tel"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" />
      </div>

      <div className="space-y-2">
        <Label>Você é</Label>
        <RadioGroup name="profile" defaultValue="turista" className="grid grid-cols-2 gap-2">
          <Label
            htmlFor="profile-turista"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem id="profile-turista" value="turista" />
            Turista
          </Label>
          <Label
            htmlFor="profile-morador"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem id="profile-morador" value="morador" />
            Morador
          </Label>
        </RadioGroup>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando na fila...
          </>
        ) : (
          "Quero ser avisado no lançamento"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Sem spam. Só uma mensagem quando o app estiver no ar.
      </p>
    </form>
  );
}
