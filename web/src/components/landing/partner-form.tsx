"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitPartner, type PartnerState } from "@/app/actions/partner";

const initial: PartnerState = { ok: false };

const districts = [
  "Vila dos Remédios",
  "Vila do Trinta",
  "Vila do Boldró",
  "Floresta Nova",
  "Floresta Velha",
  "Vila do Sueste",
  "Porto",
  "Outro",
];

type Props = {
  type: "comercio" | "operador" | "motorista" | "pousada";
  businessLabel: string;
  categories?: string[];
  showCnpj?: boolean;
  about?: string;
};

export function PartnerForm({
  type,
  businessLabel,
  categories,
  showCnpj = true,
  about,
}: Props) {
  const [state, formAction, pending] = useActionState(submitPartner, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[color:var(--turtle)]/40 bg-[color:var(--turtle)]/10 p-8 text-center">
        <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--turtle)] text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold">Pré-cadastro recebido</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Nossa equipe vai entrar em contato pelo WhatsApp em breve com os próximos passos.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Seu nome</Label>
          <Input id="name" name="name" required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            required
            inputMode="tel"
            placeholder="(00) 00000-0000"
            maxLength={20}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="business">{businessLabel}</Label>
        <Input id="business" name="business" required maxLength={160} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" maxLength={160} />
        </div>
        {showCnpj && (
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input id="cnpj" name="cnpj" maxLength={20} placeholder="00.000.000/0000-00" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories && categories.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category">
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="district">Onde fica</Label>
          <Select name="district">
            <SelectTrigger id="district">
              <SelectValue placeholder="Selecione o bairro" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about">
          {about ?? "Conte rapidamente sobre o seu negócio"}
        </Label>
        <Textarea id="about" name="about" rows={4} maxLength={1000} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar pré-cadastro"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Pré-cadastro gratuito. Sem compromisso. Taxa reduzida nos primeiros 60 dias após
        o lançamento.
      </p>
    </form>
  );
}
