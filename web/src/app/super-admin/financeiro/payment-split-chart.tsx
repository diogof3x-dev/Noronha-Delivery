"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { label: string; pix: number; card: number };

export function PaymentSplitChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Sem dados no período.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="label" fontSize={11} tickMargin={6} />
          <YAxis fontSize={11} tickFormatter={(v) => `R$${v.toLocaleString("pt-BR")}`} width={70} />
          <Tooltip
            formatter={(v) =>
              `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          />
          <Legend />
          <Bar dataKey="pix" name="PIX" stackId="pay" fill="#2BB673" radius={[4, 4, 0, 0]} />
          <Bar dataKey="card" name="Cartão" stackId="pay" fill="#0B7FA8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
