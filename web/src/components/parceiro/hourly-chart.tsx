"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { hour: string; orders: number };

export function HourlyChart({ data }: { data: Point[] }) {
  if (data.length === 0 || data.every((d) => d.orders === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem dados de horário ainda.
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="hour" fontSize={10} interval={1} />
          <YAxis fontSize={10} allowDecimals={false} width={28} />
          <Tooltip formatter={(v) => `${Number(v)} pedidos`} />
          <Bar dataKey="orders" fill="#0B7FA8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
