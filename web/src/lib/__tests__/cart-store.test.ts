// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { useCart, buildCartItem, type CartBusiness } from "../cart-store";

const biz1: CartBusiness = {
  id: "b1",
  slug: "salotto",
  name: "Salotto",
  deliveryFeeCents: 500,
  minOrderCents: 2000,
  avgPrepMinutes: 25,
};

const biz2: CartBusiness = {
  id: "b2",
  slug: "varanda",
  name: "Varanda",
  deliveryFeeCents: 800,
  minOrderCents: 3000,
  avgPrepMinutes: 30,
};

describe("buildCartItem", () => {
  it("gera lineId determinístico mesmo com options reordenadas", () => {
    const a = buildCartItem({
      serviceId: "svc1",
      name: "Pizza",
      priceCents: 4500,
      quantity: 1,
      options: [
        { groupId: "g1", groupName: "Massa", optionId: "o1", optionName: "Fina", priceDeltaCents: 0 },
        { groupId: "g2", groupName: "Borda", optionId: "o2", optionName: "Catupiry", priceDeltaCents: 500 },
      ],
    });
    const b = buildCartItem({
      serviceId: "svc1",
      name: "Pizza",
      priceCents: 4500,
      quantity: 1,
      options: [
        { groupId: "g2", groupName: "Borda", optionId: "o2", optionName: "Catupiry", priceDeltaCents: 500 },
        { groupId: "g1", groupName: "Massa", optionId: "o1", optionName: "Fina", priceDeltaCents: 0 },
      ],
    });
    expect(a.lineId).toBe(b.lineId);
  });

  it("lineIds diferentes pra options diferentes", () => {
    const fina = buildCartItem({
      serviceId: "svc1", name: "Pizza", priceCents: 4500, quantity: 1,
      options: [{ groupId: "g1", groupName: "Massa", optionId: "fina", optionName: "Fina", priceDeltaCents: 0 }],
    });
    const grossa = buildCartItem({
      serviceId: "svc1", name: "Pizza", priceCents: 4500, quantity: 1,
      options: [{ groupId: "g1", groupName: "Massa", optionId: "grossa", optionName: "Grossa", priceDeltaCents: 0 }],
    });
    expect(fina.lineId).not.toBe(grossa.lineId);
  });

  it("sem options gera lineId baseado só no serviceId", () => {
    const x = buildCartItem({ serviceId: "svc1", name: "X", priceCents: 1000, quantity: 1 });
    expect(x.lineId).toBe("svc1::");
  });
});

describe("useCart store", () => {
  beforeEach(() => {
    localStorage.clear();
    useCart.getState().clear();
  });

  it("começa vazio", () => {
    const s = useCart.getState();
    expect(s.items).toEqual([]);
    expect(s.business).toBeNull();
    expect(s.itemCount()).toBe(0);
    expect(s.subtotalCents()).toBe(0);
  });

  it("add primeiro item registra business", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    const r = useCart.getState().add(biz1, item);
    expect(r.replaced).toBe(false);
    expect(useCart.getState().business?.id).toBe("b1");
    expect(useCart.getState().itemCount()).toBe(1);
  });

  it("add mesmo item soma quantidade em vez de duplicar", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    useCart.getState().add(biz1, item);
    useCart.getState().add(biz1, item);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(2);
    expect(useCart.getState().subtotalCents()).toBe(9000);
  });

  it("add de outra business substitui o carrinho e retorna replaced=true", () => {
    const pizza = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    const moqueca = buildCartItem({ serviceId: "p2", name: "Moqueca", priceCents: 7000, quantity: 1 });
    useCart.getState().add(biz1, pizza);
    const r = useCart.getState().add(biz2, moqueca);
    expect(r.replaced).toBe(true);
    expect(useCart.getState().business?.id).toBe("b2");
    expect(useCart.getState().items).toEqual([moqueca]);
  });

  it("increment + decrement ajustam quantidade", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    useCart.getState().add(biz1, item);
    useCart.getState().increment(item.lineId);
    expect(useCart.getState().items[0].quantity).toBe(2);
    useCart.getState().decrement(item.lineId);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it("decrement até 0 remove o item", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    useCart.getState().add(biz1, item);
    useCart.getState().decrement(item.lineId);
    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().business).toBeNull();
  });

  it("remove sem itens restantes esvazia business", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    useCart.getState().add(biz1, item);
    useCart.getState().remove(item.lineId);
    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().business).toBeNull();
  });

  it("setNotes anota linha específica", () => {
    const a = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    const b = buildCartItem({ serviceId: "p2", name: "Suco", priceCents: 1200, quantity: 1 });
    useCart.getState().add(biz1, a);
    useCart.getState().add(biz1, b);
    useCart.getState().setNotes(a.lineId, "sem cebola");
    expect(useCart.getState().items.find((i) => i.lineId === a.lineId)?.notes).toBe("sem cebola");
    expect(useCart.getState().items.find((i) => i.lineId === b.lineId)?.notes).toBeUndefined();
  });

  it("replace troca business + items em bulk (usado pelo reorder)", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    useCart.getState().add(biz1, item);
    const novosItens = [
      buildCartItem({ serviceId: "p2", name: "Moqueca", priceCents: 7000, quantity: 2 }),
    ];
    useCart.getState().replace(biz2, novosItens);
    expect(useCart.getState().business?.id).toBe("b2");
    expect(useCart.getState().items).toEqual(novosItens);
  });

  it("subtotalCents soma quantidade × preço de todos os itens", () => {
    const pizza = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 2 });
    const suco = buildCartItem({ serviceId: "p2", name: "Suco", priceCents: 1200, quantity: 3 });
    useCart.getState().add(biz1, pizza);
    useCart.getState().add(biz1, suco);
    expect(useCart.getState().subtotalCents()).toBe(2 * 4500 + 3 * 1200);
    expect(useCart.getState().itemCount()).toBe(5);
  });

  it("clear esvazia tudo", () => {
    const item = buildCartItem({ serviceId: "p1", name: "Pizza", priceCents: 4500, quantity: 1 });
    useCart.getState().add(biz1, item);
    useCart.getState().clear();
    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().business).toBeNull();
  });
});
