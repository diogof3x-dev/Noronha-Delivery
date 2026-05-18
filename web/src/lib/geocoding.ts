// Geocoding via Nominatim (OpenStreetMap) — free, sem chave. Use uma chamada
// por endereço; respeita o User-Agent rule da Nominatim ToS.

export type Geo = { lat: number; lng: number };

export async function geocodeAddress(address: string): Promise<Geo | null> {
  if (!address || address.length < 3) return null;

  const query = encodeURIComponent(`${address.trim()}, Fernando de Noronha, PE, Brazil`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=0`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NoronhaDelivery/1.0 (pedidos@noronhadelivery.com)",
        "Accept-Language": "pt-BR",
      },
      signal: AbortSignal.timeout(5_000),
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 * 30 }, // 30 dias — endereços não mudam
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = data[0];
    if (!first) return null;
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    // sanity: Fernando de Noronha fica em -3.8/-32.4 aprox.
    // se a Nominatim devolveu algo absurdo, ignora
    if (Math.abs(lat - -3.85) > 0.5 || Math.abs(lng - -32.42) > 0.5) {
      return null;
    }
    return { lat, lng };
  } catch {
    return null;
  }
}
