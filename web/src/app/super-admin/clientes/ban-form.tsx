"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { banCustomer } from "@/app/actions/admin-ops";

export function BanForm({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ShieldAlert className="mr-1 h-3 w-3" />
        Banir
      </Button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          if (reason.length < 3) {
            toast.error("Motivo mín. 3 caracteres");
            return;
          }
          const res = await banCustomer(fd);
          if (res.ok) {
            toast.success("Cliente banido");
            setOpen(false);
            setReason("");
          } else {
            toast.error(res.error);
          }
        })
      }
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="customer_id" value={customerId} />
      <Input
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="motivo"
        className="h-8 w-40 text-xs"
        maxLength={280}
      />
      <Button size="sm" variant="destructive" type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        Banir
      </Button>
      <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
        ×
      </Button>
    </form>
  );
}
