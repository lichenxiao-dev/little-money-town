const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const act = (s, type, extra = {}) => T.act(s, { type, ...extra }).state;
function day(s, customers = 0.99, repair = 0.5, weather = 0) {
  const rolls = [weather, customers, repair];
  return T.act(s, { type: "next" }, () => rolls.length ? rolls.shift() : 0.5);
}
function balances(s) {
  assert.equal(T.valid(s), true);
  assert.equal(T.assets(s).total, s.finance.opening + s.finance.income - s.finance.spending + s.finance.realized + T.assets(s).unrealized);
}

test("upfront investment takes multiple profitable days to recover", () => {
  let s = act(T.create(), "stall");
  assert.equal(s.cash, 64);
  assert.equal(s.energy, 2);
  assert.equal(T.assets(s).materials, 12);
  assert.deepEqual(T.stallTotals(s), { profit: 0, net: -24, remaining: 24 });
  assert.throws(() => act(s, "stall"));
  balances(s);
  for (let n = 1; n <= 3; n++) {
    if (n > 1) s = act(s, "stall-stock", { quantity: 6 });
    const output = day(s);
    s = output.state;
    assert.equal(output.result.stall.profit, 10);
    assert.equal(s.stall.setupCost, 24, "No repeated setup charge");
    assert.equal(s.stall.days, n);
    assert.equal(T.stallTotals(s).profit, n * 10);
    balances(s);
  }
  assert.equal(T.stallTotals(s).net, 6);
  assert.equal(s.cash, 106);
  assert.equal(s.stall.history.length, 3);
});

test("overpricing can lose operating fees, unsold supplies persist, and pause costs nothing", () => {
  let s = act(T.create(), "stall", { price: 8 });
  s = day(s, 0).state;
  assert.equal(s.stall.stock, 6);
  assert.equal(s.cash, 62);
  assert.deepEqual(T.stallTotals(s), { profit: -2, net: -26, remaining: 26 });
  s = day(s, 0).state;
  assert.equal(T.stallTotals(s).remaining, 28);
  s = act(s, "stall-pause");
  const shop = structuredClone(s.stall), cash = s.cash;
  s = day(s).state;
  assert.deepEqual(s.stall, shop);
  assert.equal(s.cash, cash);
  balances(s);
});

test("stock, pause, repairs, resume and closure remain child-controlled and atomic", () => {
  let s = day(act(T.create(), "stall"), 0.3, 0).state;
  assert.equal(T.stallStatus(s), "repair");
  assert.equal(s.stall.repairCost, 0);
  const cash = s.cash, stock = s.stall.stock;
  s = day(s).state;
  assert.equal(s.cash, cash);
  assert.equal(s.stall.stock, stock);
  s = act(s, "stall-pause");
  s = act(s, "stall-stock", { quantity: 3 });
  assert.equal(s.stall.status, "paused");
  assert.throws(() => act(s, "stall-resume"));
  s = act(s, "stall-repair");
  assert.equal(s.stall.status, "paused");
  assert.equal(s.stall.repairCost, 8);
  assert.throws(() => act(s, "stall-repair"));
  s = act(s, "stall-resume");
  const before = structuredClone(s);
  for (const quantity of [0, -3, "3", 5, 24]) assert.throws(() => act(s, "stall-stock", { quantity }));
  assert.throws(() => act(act(s, "stall-stock", { quantity: 12 }), "stall-stock", { quantity: 3 }));
  assert.deepEqual(s, before);
  const assets = T.assets(s).total;
  s = act(s, "stall-close");
  assert.equal(T.assets(s).total, assets, "Refund converts unused supplies to cash, not income");
  assert.equal(s.stall.stock, 0);
  assert.equal(s.stall.status, "closed");
  assert.equal(s.finance.income, 0);
  assert.throws(() => act(s, "stall-close"));
  assert.throws(() => act(s, "stall-stock", { quantity: 3 }));
  balances(s);
  const reopened = act(s, "stall");
  assert.equal(reopened.stall.setupCost, 48);
  assert.equal(reopened.stall.history.length, s.stall.history.length);
  balances(reopened);
});

test("empty supplies and insufficient cash never create debt or secretly restock", () => {
  let s = day(act(T.create(), "stall")).state;
  assert.equal(T.stallStatus(s), "empty");
  const cash = s.cash;
  const empty = day(s);
  assert.equal(empty.result.stall.status, "empty");
  assert.equal(empty.state.cash, cash);
  s = act(s, "stall-stock", { quantity: 6 });
  s.cash = 1;
  const blocked = day(s);
  assert.equal(blocked.state.cash, 1);
  assert.equal(blocked.state.stall.status, "paused");
  assert.equal(blocked.result.stall.status, "funds");
  assert.throws(() => act(blocked.state, "stall-resume"));
});

test("sales use the weather of the operating day, not tomorrow's weather", () => {
  const sun = act(T.create(), "stall");
  const rain = structuredClone(sun); rain.weather = "rain";
  const sunnyResult = day(sun, 0.99, 0.5, 0.99);
  const rainyResult = day(rain, 0.99, 0.5, 0);
  assert.equal(sunnyResult.result.stall.cups, 6);
  assert.equal(sunnyResult.result.stall.weather, "sun");
  assert.equal(rainyResult.result.stall.cups, 5);
  assert.equal(rainyResult.result.stall.weather, "rain");
});

test("shop accounts survive reloads and reject malformed inventory or histories", () => {
  const s = day(act(T.create(), "stall"), 0.3).state;
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  balances(s);
  for (const modify of [
    (x) => { x.stall.stock++; },
    (x) => { x.stall.revenue++; },
    (x) => { x.stall.history[0].profit++; },
    (x) => { x.stall.status = "closed"; },
    (x) => { x.pending = true; }
  ]) {
    const copy = structuredClone(s); modify(copy);
    assert.equal(T.valid(copy), false);
  }
});

test("refundable stock is available money before requesting emergency bill aid", () => {
  let s = act(T.create(), "stall");
  s.day = 4; s.cash = 0; s.energy = 0;
  assert.equal(T.expense(s).aid, 0);
  assert.throws(() => act(s, "expense", { day: 4, choice: 0, aid: true }));
  s = act(s, "stall-close");
  assert.equal(s.cash, 12);
  s = act(s, "expense", { day: 4, choice: 0 });
  assert.equal(s.cash, 6);
  assert.equal(s.finance.income, 0);
});

test("child-selected prices affect buyers, receipts and profit, without guaranteeing a return", () => {
  const results = [1, 4, 6, 8].map((price) => day(act(T.create(), "stall", { price })));
  assert.deepEqual(results.map((r) => r.result.stall.cups), [6, 6, 6, 0]);
  assert.deepEqual(results.map((r) => r.result.stall.revenue), [6, 24, 36, 0]);
  assert.deepEqual(results.map((r) => r.result.stall.profit), [-8, 10, 22, -2]);
  for (const output of results) balances(output.state);
  const emptyDay = day(act(T.create(), "stall", { price: 1 }), 0);
  assert.equal(emptyDay.result.stall.cups, 4, "Ordinary footfall exists even on a quiet day");
  assert.equal(emptyDay.result.stall.profit, -6, "Selling below ingredient cost still loses money");
});

test("repricing is free, persists, and never changes prior sales or resumes a paused shop", () => {
  let s = day(act(T.create(), "stall"), 0.5).state;
  const prior = structuredClone(s.stall.history[0]), cash = s.cash, energy = s.energy;
  s = act(s, "stall-price", { price: 5 });
  assert.equal(s.cash, cash);
  assert.equal(s.energy, energy);
  assert.deepEqual(s.stall.history[0], prior);
  assert.equal(T.restore(JSON.parse(JSON.stringify(s))).stall.price, 5);
  s = day(s, 0.5).state;
  assert.equal(s.stall.revenue, 20 + 5);
  assert.deepEqual(s.stall.history.map((r) => r.price), [5, 4]);
  balances(s);
  s = act(s, "stall-pause");
  s = act(s, "stall-price", { price: 2 });
  assert.equal(s.stall.status, "paused");
  const before = structuredClone(s);
  for (const price of [0, 9, 2.5, "4", null]) {
    assert.throws(() => act(s, "stall-price", { price }));
    assert.throws(() => act(T.create(), "stall", { price }));
    assert.equal(T.valid({ ...s, stall: { ...s.stall, price } }), false);
  }
  assert.deepEqual(s, before);
  const closed = act(s, "stall-close");
  assert.throws(() => act(closed, "stall-price", { price: 4 }));
  const reopened = act(closed, "stall", { price: 7 });
  assert.equal(reopened.stall.price, 7);
  balances(reopened);
});

test("fixed-price stall saves keep balances and historical four-coin sales", () => {
  const old = day(act(T.create(), "stall"), 0.5).state;
  delete old.stall.price;
  for (const report of old.stall.history) { delete report.price; delete report.visitors; }
  delete old.lastReport.stall.price;
  assert.equal(T.valid(old), true);
  const restored = T.restore(old);
  assert.equal(restored.cash, old.cash);
  assert.equal(restored.stall.price, 4);
  assert.equal(restored.stall.history[0].price, 4);
  assert.deepEqual(restored.finance, old.finance);
  balances(restored);
  assert.deepEqual(T.restore(restored), restored);
});
