import { describe, it, expect } from "vitest";
import { toCsv } from "../csv";

describe("toCsv", () => {
  it("monta header + linhas", () => {
    const rows = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const csv = toCsv(rows, [
      { key: "name", label: "Nome" },
      { key: "age", label: "Idade" },
    ]);
    expect(csv).toBe("Nome,Idade\nAlice,30\nBob,25\n");
  });

  it("escapa vírgulas com aspas", () => {
    const rows = [{ desc: "ok, vai" }];
    const csv = toCsv(rows, [{ key: "desc", label: "desc" }]);
    expect(csv).toBe('desc\n"ok, vai"\n');
  });

  it("escapa aspas duplicando-as", () => {
    const rows = [{ q: 'ela disse "oi"' }];
    const csv = toCsv(rows, [{ key: "q", label: "q" }]);
    expect(csv).toBe('q\n"ela disse ""oi"""\n');
  });

  it("escapa newlines", () => {
    const rows = [{ x: "linha1\nlinha2" }];
    const csv = toCsv(rows, [{ key: "x", label: "x" }]);
    expect(csv).toBe('x\n"linha1\nlinha2"\n');
  });

  it("trata null/undefined como vazio", () => {
    const rows = [{ a: null, b: undefined }];
    const csv = toCsv(rows, [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ]);
    expect(csv).toBe("A,B\n,\n");
  });
});
