"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hand, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claimNextDelivery } from "@/app/actions/driver";

export function ClaimNextButton({ available }: { available: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      onClick={() =>
        start(async () => {
          const res = await claimNextDelivery();
          if (res.ok) {
            toast.success(`Corrida #${res.orderCode} aceita`);
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
      disabled={pending || available === 0}
      size="lg"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Hand className="mr-2 h-4 w-4" />
      )}
      Aceitar próxima corrida
      {available > 0 && (
        <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold">
          {available}
        </span>
      )}
    </Button>
  );
}
