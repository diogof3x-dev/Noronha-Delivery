"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCoupon } from "@/app/actions/promotions";

export function CouponForm({ businessId }: { businessId: string }) {
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await createCoupon(fd);
          if (res.ok) {
            toast.success("Cupom criado!");
            (document.getElementById("coupon-reset") as HTMLFormElement | null)?.reset();
          } else {
            toast.error(res.error);
          }
        })
      }
      id="coupon-reset"
      className="grid gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="business_id" value={businessId} />

      <div>
        <Label htmlFor="code" className="text-[10px] uppercase">Código</Label>
        <Input id="code" name="code" required placeholder="VERAO15" maxLength={40} className="font-mono uppercase" />
      </div>

      <div>
        <Label className="text-[10px] uppercase">Tipo de desconto</Label>
        <div className="mt-1 flex gap-2">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-semibold ${
              kind === "percent" ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="discount_kind"
              value="percent"
              checked={kind === "percent"}
              onChange={() => setKind("percent")}
              className="sr-only"
            />
            % OFF
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-semibold ${
              kind === "fixed" ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="discount_kind"
              value="fixed"
              checked={kind === "fixed"}
              onChange={() => setKind("fixed")}
              className="sr-only"
            />
            R$ OFF
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="discount_value" className="text-[10px] uppercase">
          Valor ({kind === "percent" ? "% (1-80)" : "centavos"})
        </Label>
        <Input
          id="discount_value"
          name="discount_value"
          type="number"
          min={1}
          max={kind === "percent" ? 80 : undefined}
          required
          placeholder={kind === "percent" ? "15" : "1000"}
        />
      </div>

      <div>
        <Label htmlFor="min_subtotal_cents" className="text-[10px] uppercase">
          Pedido mínimo (centavos)
        </Label>
        <Input
          id="min_subtotal_cents"
          name="min_subtotal_cents"
          type="number"
          min={0}
          placeholder="0 = sem mínimo"
        />
      </div>

      <div>
        <Label htmlFor="max_uses" className="text-[10px] uppercase">
          Limite total de usos
        </Label>
        <Input id="max_uses" name="max_uses" type="number" min={1} placeholder="vazio = ilimitado" />
      </div>

      <div>
        <Label htmlFor="per_user_limit" className="text-[10px] uppercase">
          Usos por cliente
        </Label>
        <Input id="per_user_limit" name="per_user_limit" type="number" min={1} defaultValue={1} />
      </div>

      <div>
        <Label htmlFor="ends_at" className="text-[10px] uppercase">Expira em</Label>
        <Input id="ends_at" name="ends_at" type="date" />
      </div>

      <label className="flex items-center gap-2 self-end text-xs">
        <input type="checkbox" name="first_order_only" className="h-3.5 w-3.5" />
        Só na primeira compra do cliente
      </label>

      <div className="md:col-span-2">
        <Label htmlFor="description" className="text-[10px] uppercase">
          Descrição (opcional)
        </Label>
        <Textarea id="description" name="description" rows={2} maxLength={160} placeholder="Ex: Cupom de boas-vindas pra novos clientes" />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Criar cupom
        </Button>
      </div>
    </form>
  );
}
