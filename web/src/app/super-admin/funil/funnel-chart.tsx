"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  label: string;
  total: number;
  contacted: number;
  comercio: number;
  motorista: number;
  pousada: number;
  operador: number;
};

export function FunnelChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Sem dados ainda.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="label" fontSize={11} tickMargin={6} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Legend />
          <Bar dataKey="comercio" name="Comércio" stackId="t" fill="#0B7FA8" />
          <Bar dataKey="motorista" name="Motorista" stackId="t" fill="#2BB673" />
          <Bar dataKey="pousada" name="Pousada" stackId="t" fill="#F4B642" />
          <Bar dataKey="operador" name="Operador" stackId="t" fill="#E76F51" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
