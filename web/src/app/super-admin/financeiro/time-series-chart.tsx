"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { day: string; label: string; gmv: number; fee: number; orders: number };

export function TimeSeriesChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Sem dados no período.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0B7FA8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0B7FA8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="feeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2BB673" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2BB673" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="label" fontSize={11} tickMargin={6} />
          <YAxis fontSize={11} tickFormatter={(v) => `R$${v.toLocaleString("pt-BR")}`} width={70} />
          <Tooltip
            formatter={(v, key) =>
              key === "orders"
                ? `${Number(v)} pedidos`
                : `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
            labelFormatter={(label) => `Dia ${label}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="gmv"
            name="GMV"
            stroke="#0B7FA8"
            fill="url(#gmvFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="fee"
            name="Receita plataforma"
            stroke="#2BB673"
            fill="url(#feeFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
