import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  haversineMeters,
  formatDistance,
  etaMinutes,
  parseGeo,
  urgencyFromPlaced,
  minutesSince,
} from "../geo";

describe("haversineMeters", () => {
  it("retorna 0 quando coordenadas iguais", () => {
    const p = { lat: -3.85, lng: -32.42 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it("calcula distância Vila / Praia Cacimba (Fernando de Noronha) ~5km", () => {
    const vila = { lat: -3.8418, lng: -32.4202 };
    const cacimba = { lat: -3.8666, lng: -32.4523 };
    const d = haversineMeters(vila, cacimba);
    expect(d).toBeGreaterThan(3500);
    expect(d).toBeLessThan(5500);
  });
});

describe("formatDistance", () => {
  it("usa metros abaixo de 1000", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("usa km com 1 decimal acima de 1000", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(2500)).toBe("2.5 km");
    expect(formatDistance(10250)).toBe("10.3 km");
  });
});

describe("etaMinutes", () => {
  it("retorna pelo menos 1 minuto", () => {
    expect(etaMinutes(100)).toBe(1);
    expect(etaMinutes(0)).toBe(1);
  });

  it("calcula assumindo 25km/h por padrão", () => {
    // 5km / 25kmh = 0.2h = 12min
    expect(etaMinutes(5000)).toBe(12);
    // 10km / 25kmh = 24min
    expect(etaMinutes(10000)).toBe(24);
  });

  it("aceita velocidade customizada", () => {
    expect(etaMinutes(10000, 50)).toBe(12);
  });
});

describe("parseGeo", () => {
  it("retorna LatLng quando objeto válido", () => {
    expect(parseGeo({ lat: -3.85, lng: -32.42 })).toEqual({
      lat: -3.85,
      lng: -32.42,
    });
  });

  it("retorna null para entradas inválidas", () => {
    expect(parseGeo(null)).toBeNull();
    expect(parseGeo(undefined)).toBeNull();
    expect(parseGeo("string")).toBeNull();
    expect(parseGeo({ lat: "x", lng: 1 })).toBeNull();
    expect(parseGeo({ lat: 1 })).toBeNull();
  });
});

describe("urgencyFromPlaced", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fresh quando null", () => {
    expect(urgencyFromPlaced(null)).toBe("fresh");
  });

  it("fresh < 5 min", () => {
    expect(urgencyFromPlaced("2026-05-18T11:58:00Z")).toBe("fresh");
  });

  it("warm 5–15 min", () => {
    expect(urgencyFromPlaced("2026-05-18T11:50:00Z")).toBe("warm");
  });

  it("cold > 15 min", () => {
    expect(urgencyFromPlaced("2026-05-18T11:30:00Z")).toBe("cold");
  });
});

describe("minutesSince", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 0 quando null", () => {
    expect(minutesSince(null)).toBe(0);
  });

  it("conta minutos desde ISO", () => {
    expect(minutesSince("2026-05-18T11:30:00Z")).toBe(30);
    expect(minutesSince("2026-05-18T11:00:00Z")).toBe(60);
  });
});
