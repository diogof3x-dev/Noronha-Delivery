"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updatePersonal,
  updateAddress,
  updatePix,
  changePassword,
  type AccountState,
} from "@/app/actions/account";

const initial: AccountState = { ok: false };

function StatusLine({ state }: { state: AccountState }) {
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state.ok && state.message)
    return (
      <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
        <Check className="h-4 w-4" />
        {state.message}
      </p>
    );
  return null;
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function PersonalForm({
  defaults,
}: {
  defaults: { full_name: string; whatsapp: string; cpf: string; birth_date: string };
}) {
  const [state, action, pending] = useActionState(updatePersonal, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input id="full_name" name="full_name" required minLength={2} maxLength={120} defaultValue={defaults.full_name} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" required inputMode="tel" maxLength={20} defaultValue={defaults.whatsapp} placeholder="(00) 00000-0000" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" inputMode="numeric" maxLength={20} defaultValue={defaults.cpf} placeholder="000.000.000-00" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="birth_date">Data de nascimento</Label>
        <Input id="birth_date" name="birth_date" type="date" defaultValue={defaults.birth_date} />
      </div>
      <StatusLine state={state} />
      <Submit pending={pending} label="Salvar dados pessoais" />
    </form>
  );
}

export function AddressForm({
  defaults,
}: {
  defaults: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
  };
}) {
  const [state, action, pending] = useActionState(updateAddress, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" name="cep" inputMode="numeric" maxLength={12} defaultValue={defaults.cep} placeholder="53990-000" />
        </div>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label htmlFor="street">Rua / logradouro</Label>
          <Input id="street" name="street" maxLength={160} defaultValue={defaults.street} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="number">Número</Label>
          <Input id="number" name="number" maxLength={20} defaultValue={defaults.number} />
        </div>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" name="complement" maxLength={120} defaultValue={defaults.complement} placeholder="Apto, casa, sala..." />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="district">Bairro</Label>
          <Input id="district" name="district" maxLength={80} defaultValue={defaults.district} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" maxLength={80} defaultValue={defaults.city} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" name="state" maxLength={40} defaultValue={defaults.state} />
        </div>
      </div>
      <StatusLine state={state} />
      <Submit pending={pending} label="Salvar endereço" />
    </form>
  );
}

const PIX_OPTIONS = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave aleatória" },
];

export function PixForm({
  defaults,
}: {
  defaults: { pix_kind: string; pix_value: string };
}) {
  const [state, action, pending] = useActionState(updatePix, initial);
  const [kind, setKind] = useState(defaults.pix_kind || "cpf");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="pix_kind" value={kind} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Tipo da chave</Label>
          <Select value={kind} onValueChange={(v) => setKind(v ?? "cpf")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIX_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pix_value">Valor da chave</Label>
          <Input id="pix_value" name="pix_value" required maxLength={120} defaultValue={defaults.pix_value} placeholder="000.000.000-00 ou contato@..." />
        </div>
      </div>
      <StatusLine state={state} />
      <Submit pending={pending} label="Salvar chave PIX" />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="new_password">Nova senha</Label>
          <Input id="new_password" name="new_password" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm">Confirmar</Label>
          <Input id="confirm" name="confirm" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </div>
      </div>
      <StatusLine state={state} />
      <Submit pending={pending} label="Trocar senha" />
    </form>
  );
}
