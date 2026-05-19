import { describe, it, expect } from "vitest";
import { getPanelNav } from "../panel-nav";

const labels = (type: string | null) => getPanelNav(type).map((i) => i.label);

describe("getPanelNav", () => {
  it("sempre começa com Visão geral", () => {
    for (const type of [
      "restaurante",
      "mercado",
      "pousada",
      "residencia",
      "operador_passeio",
      "locadora",
      "servico",
      null,
    ]) {
      expect(getPanelNav(type)[0]?.label).toBe("Visão geral");
    }
  });

  it("food verticals usam Pedidos + Cardápio", () => {
    for (const type of ["restaurante", "mercado", "farmacia", "conveniencia", "loja"]) {
      const items = labels(type);
      expect(items).toContain("Pedidos");
      expect(items).toContain("Cardápio");
      expect(items).not.toContain("Quartos");
    }
  });

  it("pousada tem Quartos + Reservas", () => {
    const items = labels("pousada");
    expect(items).toContain("Quartos");
    expect(items).toContain("Reservas");
    expect(items).not.toContain("Cardápio");
  });

  it("residencia tem Minha casa em vez de Quartos", () => {
    const items = labels("residencia");
    expect(items).toContain("Minha casa");
    expect(items).toContain("Reservas");
    expect(items).not.toContain("Quartos");
  });

  it("operador_passeio tem Passeios + Agenda", () => {
    const items = labels("operador_passeio");
    expect(items).toContain("Passeios");
    expect(items).toContain("Agenda");
  });

  it("locadora tem Equipamentos + Locações", () => {
    const items = labels("locadora");
    expect(items).toContain("Equipamentos");
    expect(items).toContain("Locações");
  });

  it("servico tem Serviços + Horários + Agendamentos", () => {
    const items = labels("servico");
    expect(items).toContain("Serviços");
    expect(items).toContain("Horários");
    expect(items).toContain("Agendamentos");
  });

  it("tipo desconhecido cai no fallback de food", () => {
    const items = labels("desconhecido");
    expect(items).toContain("Pedidos");
    expect(items).toContain("Cardápio");
  });

  it("todo type inclui o bloco de cadastro (Minha loja, Equipe, Avaliações)", () => {
    for (const type of ["pousada", "operador_passeio", "locadora", "servico", "restaurante"]) {
      const items = labels(type);
      expect(items).toContain("Minha loja");
      expect(items).toContain("Equipe");
      expect(items).toContain("Avaliações");
      expect(items).toContain("Analytics");
    }
  });
});
