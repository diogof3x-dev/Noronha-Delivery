"use client";

import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

function formatCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function CpfNotaField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">CPF na nota</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">Opcional</span>
      </header>
      <Input
        value={value}
        onChange={(e) => onChange(formatCpf(e.target.value))}
        placeholder="000.000.000-00"
        inputMode="numeric"
        className="mt-2"
      />
    </section>
  );
}
