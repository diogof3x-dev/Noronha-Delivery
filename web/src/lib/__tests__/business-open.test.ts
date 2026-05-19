import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isBusinessOpenNow } from "../business-open";

// 2026-05-18 é uma segunda-feira (dow=1)
const MONDAY_NOON = new Date("2026-05-18T15:00:00Z"); // 12:00 BRT
const MONDAY_LATE = new Date("2026-05-18T05:00:00Z"); // 02:00 BRT

describe("isBusinessOpenNow", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("assume aberto quando opening_hours vazio/null", () => {
    expect(isBusinessOpenNow(null)).toBe(true);
    expect(isBusinessOpenNow([])).toBe(true);
    expect(isBusinessOpenNow(undefined)).toBe(true);
  });

  it("fechado quando dia da semana não consta", () => {
    vi.setSystemTime(MONDAY_NOON);
    // só domingo
    expect(isBusinessOpenNow([{ day: 0, opens: "08:00", closes: "18:00" }])).toBe(
      false,
    );
  });

  it("aberto dentro do horário", () => {
    vi.setSystemTime(MONDAY_NOON);
    expect(
      isBusinessOpenNow([{ day: 1, opens: "08:00", closes: "18:00" }]),
    ).toBe(true);
  });

  it("fechado antes da abertura", () => {
    vi.setSystemTime(new Date("2026-05-18T10:00:00Z")); // 07:00 BRT
    expect(
      isBusinessOpenNow([{ day: 1, opens: "08:00", closes: "18:00" }]),
    ).toBe(false);
  });

  it("suporta horário cruzando meia-noite (bar)", () => {
    vi.setSystemTime(MONDAY_LATE); // segunda 02:00 BRT
    // bar abre 20:00 segunda e fecha 04:00 (domingo→segunda)
    // como dow=segunda, checa slot {day:1, opens:20:00, closes:04:00}
    expect(
      isBusinessOpenNow([{ day: 1, opens: "20:00", closes: "04:00" }]),
    ).toBe(true);
  });
});
