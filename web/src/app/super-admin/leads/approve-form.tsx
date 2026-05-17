"use client";

import { useActionState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveLead, type LeadAdminState } from "@/app/actions/leads-admin";

const initial: LeadAdminState = { ok: false };

const LEAD_TO_TYPE: Record<string, string> = {
  comercio: "restaurante",
  pousada: "pousada",
  operador: "operador_passeio",
};

const TYPES = [
  { value: "restaurante", label: "Restaurante / lanchonete / bar" },
  { value: "mercado", label: "Mercado" },
  { value: "farmacia", label: "Farmácia" },
  { value: "conveniencia", label: "Conveniência" },
  { value: "loja", label: "Loja / boutique" },
  { value: "operador_passeio", label: "Operador de passeio" },
  { value: "pousada", label: "Pousada" },
  { value: "residencia", label: "Residência particular (Airbnb)" },
  { value: "locadora", label: "Aluguel (bike, scooter, equip.)" },
  { value: "servico", label: "Serviço (spa, lavanderia, pet, etc.)" },
];

export function ApproveLeadForm({
  leadId,
  defaultName,
  defaultType,
  defaultDistrict,
  defaultEmail,
}: {
  leadId: string;
  defaultName: string;
  defaultType: string;
  defaultDistrict: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(approveLead, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="lead_id" value={leadId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor={`bname-${leadId}`}>Nome da loja</Label>
          <Input id={`bname-${leadId}`} name="business_name" defaultValue={defaultName} required maxLength={120} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`btype-${leadId}`}>Tipo</Label>
          <select
            id={`btype-${leadId}`}
            name="business_type"
            defaultValue={LEAD_TO_TYPE[defaultType] ?? "restaurante"}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`bdistrict-${leadId}`}>Bairro</Label>
          <Input
            id={`bdistrict-${leadId}`}
            name="district"
            defaultValue={defaultDistrict}
            required
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor={`bemail-${leadId}`}>Email do dono (Google)</Label>
          <Input
            id={`bemail-${leadId}`}
            name="owner_email"
            type="email"
            defaultValue={defaultEmail}
            placeholder="precisa estar logado pelo Google primeiro"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.businessId && (
        <p className="inline-flex items-center gap-1.5 text-sm text-[color:var(--turtle)]">
          <BadgeCheck className="h-4 w-4" /> Loja criada e dono promovido
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <BadgeCheck className="mr-2 h-3 w-3" />}
        Aprovar e criar loja
      </Button>
    </form>
  );
}
