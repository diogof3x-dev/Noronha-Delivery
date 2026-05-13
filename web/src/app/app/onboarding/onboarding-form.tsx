"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeOnboarding, type OnboardingState } from "@/app/actions/profile";

const DISTRICTS = [
  "Vila dos Remédios",
  "Vila do Trinta",
  "Vila do Boldró",
  "Floresta Nova",
  "Floresta Velha",
  "Vila do Sueste",
  "Porto",
];

const initial: OnboardingState = { ok: false };

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(completeOnboarding, initial);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Seu nome</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          maxLength={120}
          defaultValue={defaultName}
          placeholder="Como você quer ser chamado"
        />
      </div>

      <div className="space-y-2">
        <Label>Você é</Label>
        <RadioGroup name="is_resident" defaultValue="false" className="grid grid-cols-2 gap-2">
          <Label
            htmlFor="r-turista"
            className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-input bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <RadioGroupItem id="r-turista" value="false" />
              Turista
            </span>
            <span className="text-xs text-muted-foreground">
              Vou visitar ou estou na ilha
            </span>
          </Label>
          <Label
            htmlFor="r-morador"
            className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-input bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <RadioGroupItem id="r-morador" value="true" />
              Morador
            </span>
            <span className="text-xs text-muted-foreground">
              Moro em Fernando de Noronha
            </span>
          </Label>
        </RadioGroup>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="district">Onde você está / mora</Label>
        <Select name="district" required>
          <SelectTrigger id="district">
            <SelectValue placeholder="Selecione o bairro" />
          </SelectTrigger>
          <SelectContent>
            {DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          inputMode="tel"
          maxLength={20}
          placeholder="(00) 00000-0000"
        />
        <p className="text-xs text-muted-foreground">
          Pra te avisar sobre pedidos se o sinal cair.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </form>
  );
}
