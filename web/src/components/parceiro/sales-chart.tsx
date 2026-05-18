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

type Point = { label: string; gmv: number; fee: number; orders: number };

export function SalesChart({ data, compact = false }: { data: Point[]; compact?: boolean }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem vendas no período ainda.
      </div>
    );
  }

  return (
    <div className={compact ? "h-48 w-full" : "h-64 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bizGmv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0B7FA8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0B7FA8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bizFee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2BB673" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2BB673" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="label" fontSize={10} tickMargin={4} />
          <YAxis
            fontSize={10}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip
            formatter={(v, key) =>
              key === "orders"
                ? `${Number(v)} pedidos`
                : `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          />
          {!compact && <Legend />}
          <Area
            type="monotone"
            dataKey="gmv"
            name="Vendas"
            stroke="#0B7FA8"
            fill="url(#bizGmv)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="fee"
            name="Taxa plataforma"
            stroke="#2BB673"
            fill="url(#bizFee)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
