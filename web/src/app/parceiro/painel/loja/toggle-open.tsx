"use client";

import { useTransition } from "react";
import { Loader2, Power } from "lucide-react";
import { toggleBusinessOpen } from "@/app/actions/business";

export function ToggleOpenButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => toggleBusinessOpen(fd))}
      className="inline-block"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="is_active" value={isActive ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
          isActive
            ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
        {isActive ? "Aberta — fechar" : "Fechada — abrir"}
      </button>
    </form>
  );
}
