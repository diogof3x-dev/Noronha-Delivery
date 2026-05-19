import { describe, it, expect } from "vitest";
import { formatCents, formatPrepTime, formatDeliveryFee } from "../format";

// Intl.NumberFormat usa NBSP ( ) entre o símbolo e o número.
const n = (s: string) => s.replace(/ /g, " ");

describe("formatCents", () => {
  it("formata reais com símbolo BRL", () => {
    expect(n(formatCents(0))).toBe("R$ 0,00");
    expect(n(formatCents(100))).toBe("R$ 1,00");
    expect(n(formatCents(12345))).toBe("R$ 123,45");
    expect(n(formatCents(199900))).toBe("R$ 1.999,00");
  });

  it("trata null/undefined como traço", () => {
    expect(formatCents(null)).toBe("—");
    expect(formatCents(undefined)).toBe("—");
  });
});

describe("formatPrepTime", () => {
  it("retorna minutos abaixo de 60", () => {
    expect(formatPrepTime(15)).toBe("15 min");
    expect(formatPrepTime(59)).toBe("59 min");
  });

  it("retorna horas + minutos acima de 60", () => {
    expect(formatPrepTime(60)).toBe("1h");
    expect(formatPrepTime(90)).toBe("1h 30min");
    expect(formatPrepTime(125)).toBe("2h 5min");
  });

  it("trata null/0 como traço", () => {
    expect(formatPrepTime(null)).toBe("—");
    expect(formatPrepTime(0)).toBe("—");
  });
});

describe("formatDeliveryFee", () => {
  it("trata 0 como frete grátis", () => {
    expect(formatDeliveryFee(0)).toBe("Frete grátis");
  });

  it("trata null/undefined como a calcular", () => {
    expect(formatDeliveryFee(null)).toBe("Frete a calcular");
    expect(formatDeliveryFee(undefined)).toBe("Frete a calcular");
  });

  it("formata valor cobrado", () => {
    expect(n(formatDeliveryFee(500))).toBe("Frete R$ 5,00");
    expect(n(formatDeliveryFee(1250))).toBe("Frete R$ 12,50");
  });
});
