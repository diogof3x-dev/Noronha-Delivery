"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { setBusinessTakeRate } from "@/app/actions/admin-ops";

export function TakeRateForm({
  businessId,
  currentBps,
}: {
  businessId: string;
  currentBps: number | null;
}) {
  const [pending, start] = useTransition();
  const [pct, setPct] = useState((currentBps ?? 1000) / 100);
  const [note, setNote] = useState("");

  return (
    <form
      action={(fd) =>
        start(async () => {
          fd.set("bps", String(Math.round(pct * 100)));
          fd.set("note", note);
          const res = await setBusinessTakeRate(fd);
          if (res.ok) toast.success("Take rate atualizada");
          else toast.error(res.error);
        })
      }
      className="mt-3 grid gap-2 md:grid-cols-[auto,1fr,auto]"
    >
      <input type="hidden" name="business_id" value={businessId} />
      <div>
        <Label htmlFor="pct" className="text-xs">
          Take rate (%)
        </Label>
        <Input
          id="pct"
          type="number"
          step={0.01}
          min={0}
          max={50}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-24"
        />
      </div>
      <div>
        <Label htmlFor="note" className="text-xs">
          Nota (opcional)
        </Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ex. acordo verbal 8% até fim do verão"
          maxLength={120}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-end">
        {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Aplicar
      </Button>
    </form>
  );
}
