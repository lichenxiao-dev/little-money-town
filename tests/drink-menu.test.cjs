const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const act = (s, type, extra = {}) => T.act(s, { type, ...extra }).state;
const stock = (s, ingredient, quantity = 3) => act(s, "stall-stock", { ingredient, quantity });

test("shared ingredients serve only selected recipes and sales are not charged twice", () => {
  let s = act(T.create(), "stall");
  s = act(s, "stall-menu", { id: "lemonade", enabled: false });
  s = act(s, "stall-menu", { id: "milkTea", enabled: true });
  s = stock(stock(s, "milk"), "tea");
  const cash = s.cash;
  const output = T.act(s, { type: "next" }, () => 0.5);
  assert.deepEqual(output.result.stall.drinks, [{ id: "milkTea", price: 5, cups: 3, revenue: 15, cost: 9 }]);
  assert.equal(output.state.cash, cash + 15 - 2);
  assert.equal(output.state.stall.ingredients.lemon, 6);
  assert.equal(output.state.stall.ingredients.milk, 0);
  assert.equal(output.state.stall.consumedCost, 9);
  assert.equal(T.stallTotals(output.state).profit, 4);
  assert.equal(T.valid(output.state), true);
  assert.deepEqual(T.restore(output.state), output.state);
});

test("menus, independent prices and purchases preserve child choices and paused state", () => {
  let s = act(T.create(), "stall");
  s = act(s, "stall-pause");
  s = stock(s, "milk");
  s = act(s, "stall-menu", { id: "warmMilk", enabled: true });
  s = act(s, "stall-drink-price", { id: "warmMilk", price: 6 });
  assert.equal(s.stall.menu.lemonade.price, 4);
  assert.equal(s.stall.menu.warmMilk.price, 6);
  assert.equal(s.stall.status, "paused");
  assert.equal(T.restore(s).stall.menu.warmMilk.enabled, true);
  for (const action of [
    { type: "stall-stock", ingredient: "missing", quantity: 3 },
    { type: "stall-stock", ingredient: "milk", quantity: -1 },
    { type: "stall-menu", id: "missing", enabled: true },
    { type: "stall-drink-price", id: "warmMilk", price: 9 }
  ]) assert.throws(() => T.act(s, action));
});

test("all-off menus cost nothing and non-lemon ingredients remain refundable assets", () => {
  let s = stock(act(T.create(), "stall"), "milk", 1);
  s = act(s, "stall-menu", { id: "lemonade", enabled: false });
  assert.equal(T.stallStatus(s), "menu");
  const next = T.act(s, { type: "next" }, () => 0.5);
  assert.equal(next.state.cash, s.cash);
  assert.equal(next.result.stall.status, "menu");
  const assets = T.assets(s).total, inventory = T.inventoryValue(s.stall), cash = s.cash;
  s = act(s, "stall-close");
  assert.equal(s.cash, cash + inventory);
  assert.equal(T.assets(s).total, assets);
  assert.equal(T.inventoryValue(s.stall), 0);
  assert.equal(T.valid(s), true);
});

test("old lemon stock, investments and histories migrate without financial changes", () => {
  const s = act(T.create(), "stall");
  delete s.stall.ingredients; delete s.stall.menu; delete s.stall.consumedCost;
  assert.equal(T.valid(s), true);
  const restored = T.restore(s);
  assert.equal(restored.cash, s.cash);
  assert.equal(restored.stall.ingredients.lemon, 6);
  assert.equal(restored.stall.ingredients.sugar, 6);
  assert.equal(T.inventoryValue(restored.stall), 12);
  assert.deepEqual(T.stallTotals(restored), T.stallTotals(s));
  assert.equal(T.valid(restored), true);
});

test("ordinary prices attract buyers in rain, but high prices and repairs still carry risk", () => {
  for (const weather of ["sun", "rain"]) {
    for (const roll of [0, 0.25, 0.5, 0.99]) {
      const s = act(T.create(), "stall"); s.weather = weather;
      let calls = 0;
      const output = T.act(s, { type: "next" }, () => ++calls === 2 ? roll : 0.5);
      assert.ok(output.result.stall.cups >= 3);
      assert.ok(output.result.stall.profit >= 4);
      assert.equal(T.valid(output.state), true);
    }
  }
  const expensive = T.act(act(T.create(), "stall", { price: 8 }), { type: "next" }, () => 0.5);
  assert.equal(expensive.result.stall.cups, 0);
  assert.equal(expensive.result.stall.profit, -2);
});

test("a blank new shop charges only equipment and waits for menu and ingredients", () => {
  const s = act(T.create(), "stall", { starter: false });
  assert.equal(s.cash, 76);
  assert.equal(T.inventoryValue(s.stall), 0);
  assert.equal(T.stallStatus(s), "menu");
  assert.ok(Object.values(s.stall.menu).every((item) => !item.enabled));
  assert.equal(T.act(s, { type: "next" }, () => 0.5).state.cash, 76);
  assert.equal(T.valid(s), true);
});

test("automatic restocking caps spending, reserves cash and buys complete affordable recipes", () => {
  let s = act(T.create(), "stall", { starter: false });
  s = act(s, "stall-menu", { id: "milkTea", enabled: true });
  s = act(s, "stall-menu", { id: "warmMilk", enabled: true });
  s = act(s, "stall-auto", { rule: { enabled: true, target: 3, budget: 8, reserve: 10 } });
  const result = T.act(s, { type: "next" }, () => 0.5);
  assert.ok(result.result.stall.autoStock.spent <= 8);
  assert.equal(result.result.stall.autoStock.spent, 7);
  assert.equal(result.state.stall.suppliesCost, 7);
  assert.equal(T.valid(result.state), true);
  assert.deepEqual(T.restore(result.state), result.state);
  s.cash = 13;
  const constrained = T.act(s, { type: "next" }, () => 0.5);
  assert.equal(constrained.result.stall.autoStock.spent, 0, "Cannot afford a complete recipe while reserving 10 plus the operating fee");
  assert.equal(constrained.state.cash, 13);
});

test("automatic stock never runs for paused or broken shops or nonprofitable recipes", () => {
  let s = act(T.create(), "stall", { starter: false });
  s = act(s, "stall-menu", { id: "lemonade", enabled: true });
  s = act(s, "stall-auto", { rule: { enabled: true, target: 3, budget: 20, reserve: 10 } });
  for (const variant of [
    act(s, "stall-pause"),
    { ...s, stall: { ...s.stall, needsRepair: true } },
    act(s, "stall-price", { price: 2 })
  ]) {
    const next = T.act(variant, { type: "next" }, () => 0.5).state;
    assert.equal(next.cash, variant.cash);
    assert.equal(T.inventoryValue(next.stall), 0);
  }
  for (const rule of [{ enabled: true, target: 4, budget: 20, reserve: 10 }, { enabled: true, target: 3, budget: -1, reserve: 10 }]) {
    assert.throws(() => act(s, "stall-auto", { rule }));
  }
});
