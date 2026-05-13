export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatPrepTime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function formatDeliveryFee(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "Frete a calcular";
  if (cents === 0) return "Frete grátis";
  return `Frete ${formatCents(cents)}`;
}
