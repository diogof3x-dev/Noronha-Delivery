"use client";

import { useActionState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type AuthState } from "@/app/actions/auth";

const initial: AuthState = { ok: false };

export function EmailMagicLinkForm({ next, cta }: { next?: string; cta: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);

  if (state.sent) {
    return (
      <div className="rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/10 p-6 text-center">
        <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-base font-semibold">Confira seu e-mail</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Mandamos um link mágico. Clique no link e você entra direto, sem senha.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando link...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            {cta}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Sem senha, sem complicação. Você recebe um link, clica, entra.
      </p>
    </form>
  );
}
