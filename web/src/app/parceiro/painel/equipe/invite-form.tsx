"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { inviteMember } from "@/app/actions/team";

export function InviteForm({ businessId }: { businessId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await inviteMember(fd);
          if (res.ok) {
            toast.success("Convite enviado!");
            setEmail("");
          } else {
            toast.error(res.error);
          }
        })
      }
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="business_id" value={businessId} />
      <div className="flex-1 min-w-[180px]">
        <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          E-mail
        </label>
        <Input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Papel
        </label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "manager" | "staff")}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="staff">Balcão</option>
          <option value="manager">Gerente</option>
        </select>
      </div>
      <Button type="submit" disabled={pending || !email}>
        {pending ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <Send className="mr-2 h-3 w-3" />
        )}
        Convidar
      </Button>
    </form>
  );
}
