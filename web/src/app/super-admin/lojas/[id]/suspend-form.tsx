"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { suspendBusiness } from "@/app/actions/admin-ops";

export function SuspendForm({ businessId }: { businessId: string }) {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState("");

  return (
    <form
      action={(fd) =>
        start(async () => {
          if (reason.length < 3) {
            toast.error("Escreva o motivo (mín. 3 caracteres)");
            return;
          }
          const res = await suspendBusiness(fd);
          if (res.ok) toast.success("Loja suspensa");
          else toast.error(res.error);
        })
      }
      className="mt-3 space-y-2"
    >
      <input type="hidden" name="business_id" value={businessId} />
      <Textarea
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo da suspensão (cliente recebe esse texto se reclamar)"
        rows={2}
        maxLength={280}
      />
      <Button type="submit" variant="destructive" disabled={pending || reason.length < 3}>
        {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Suspender
      </Button>
    </form>
  );
}
