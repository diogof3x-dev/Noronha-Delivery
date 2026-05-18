export type LatLng = { lat: number; lng: number };

/** Distância em metros entre 2 coordenadas (Haversine) */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** ETA simples assumindo média 25 km/h em ilha (bike/scooter elétrica) */
export function etaMinutes(meters: number, kmh = 25): number {
  const hours = meters / 1000 / kmh;
  return Math.max(1, Math.round(hours * 60));
}

export function parseGeo(value: unknown): LatLng | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.lat === "number" && typeof v.lng === "number") {
    return { lat: v.lat, lng: v.lng };
  }
  return null;
}

/** Urgência: tempo desde a criação do pedido */
export type Urgency = "fresh" | "warm" | "cold";
export function urgencyFromPlaced(placedAt: string | null | undefined): Urgency {
  if (!placedAt) return "fresh";
  const ms = Date.now() - new Date(placedAt).getTime();
  const min = ms / 60000;
  if (min < 5) return "fresh";
  if (min < 15) return "warm";
  return "cold";
}

export function minutesSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}
