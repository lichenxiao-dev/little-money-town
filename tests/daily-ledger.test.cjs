const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const act = (s, action) => T.act(s, action, () => 0.5).state;

test("daily income and spending separate bank transfers and share proceeds", () => {
  let s = act(T.create(), { type: "work", id: "parcel", performance: { level: 2, mistakes: 0, assists: 0, stars: 3 } });
  s = act(s, { type: "buy", ids: ["cookie"] });
  s = act(s, { type: "save", amount: 20 });
  s = act(s, { type: "withdraw", amount: 5 });
  s = act(s, { type: "invest", id: "bakery" });
  const first = T.dailyAccount(s);
  assert.deepEqual([first.income, first.spending, first.net], [10, 4, 6]);
  assert.deepEqual([first.transferOut, first.transferIn, first.capitalOut], [20, 5, 10]);
  s = act(s, { type: "next" });
  s = act(s, { type: "sell", id: "bakery" });
  assert.equal(T.dailyAccount(s).income, 0);
  assert.equal(T.dailyAccount(s).capitalIn, 10);
  assert.equal(T.dailyAccount(s, 1).income, 10);
  assert.deepEqual(T.restore(s), s);
  assert.equal(T.valid(s), true);
});

test("sales and automatic purchases belong to the operating day, with gross receipts and actual payments", () => {
  let s = act(T.create(), { type: "stall", starter: false });
  s = act(s, { type: "stall-menu", id: "warmMilk", enabled: true });
  s = act(s, { type: "stall-auto", rule: { enabled: true, target: 3, budget: 10, reserve: 10 } });
  s = act(s, { type: "next" });
  const yesterday = T.dailyAccount(s, 1), today = T.dailyAccount(s, 2);
  assert.equal(yesterday.income, 12);
  assert.equal(yesterday.spending, 24 + 6 + 2);
  assert.equal(yesterday.net, -20);
  assert.equal(today.income, 0);
  assert.equal(today.spending, 0);
  const sale = yesterday.records.find((e) => e.receipts !== undefined);
  assert.equal(sale.receipts, 12);
  assert.equal(sale.payments, 2);
  assert.equal(sale.date, "game-1-09-01");
  assert.ok(yesterday.records.some((e) => e.text.includes("自动进货")));
  assert.equal(T.valid(s), true);
});

test("a loss-making sale does not hide gross revenue behind net wallet movement", () => {
  let s = act(T.create(), { type: "stall", starter: false });
  s = act(s, { type: "stall-menu", id: "warmMilk", enabled: true });
  s = act(s, { type: "stall-drink-price", id: "warmMilk", price: 1 });
  s = act(s, { type: "stall-stock", ingredient: "milk", quantity: 1 });
  s = act(s, { type: "next" });
  assert.equal(T.dailyAccount(s, 1).income, 1);
  assert.equal(T.dailyAccount(s, 1).spending, 28);
});

test("interest and allowance are income on arrival; direct expense aid is not lost", () => {
  const saved = T.create();
  saved.day = 7; saved.savings = 20; saved.bank.units = 120;
  const next = act(saved, { type: "next" });
  assert.equal(T.dailyAccount(next, 8).income, 21);
  assert.equal(T.dailyAccount(next, 8).date.date, 8);
  const poor = T.create();
  poor.day = 4; poor.cash = 1; poor.energy = 0;
  const paid = act(poor, { type: "expense", day: 4, choice: 0, aid: true });
  assert.equal(T.dailyAccount(paid).income, 5);
  assert.equal(T.dailyAccount(paid).spending, 6);
  assert.equal(T.dailyAccount(paid).net, -1);
});

test("daily totals survive journal truncation, empty days and reloads", () => {
  let s = T.create(); s.cash = 1000; s.finance.opening = 1000;
  for (let i = 0; i < 70; i++) s = act(s, { type: "buy", ids: ["eraser"] });
  assert.equal(s.journal.length, 60);
  assert.equal(T.dailyAccount(s).entries, 70);
  assert.equal(T.dailyAccount(s).spending, 140);
  s = act(s, { type: "next" });
  assert.equal(T.dailyAccount(s).complete, true);
  assert.equal(T.dailyAccount(s).spending, 0);
  const restored = T.restore(JSON.parse(JSON.stringify(s)));
  assert.equal(T.dailyAccount(restored, 1).spending, 140);
  assert.equal(T.dailyAccount(restored, 1).records.length, 60);
  assert.equal(T.valid(restored), true);
});

test("legacy daily totals are explicitly partial and migration never repeats them", () => {
  let s = act(T.create(), { type: "buy", ids: ["cookie"] });
  delete s.dailyLedger;
  assert.equal(T.valid(s), true);
  s = T.restore(s);
  assert.equal(T.dailyAccount(s).complete, false);
  assert.equal(T.dailyAccount(s).spending, 4);
  assert.deepEqual(T.restore(s), s);
  s = act(s, { type: "buy", ids: ["eraser"] });
  assert.equal(T.dailyAccount(s).spending, 6);
  assert.equal(T.dailyAccount(s).complete, false);
  s = act(s, { type: "next" });
  assert.equal(T.dailyAccount(s).complete, true);
  assert.equal(T.dailyAccount(s, 0), null);
  assert.equal(T.dailyAccount(s, 3), null);
});

test("malformed day totals are rejected and a blocked day cannot change them", () => {
  const s = T.create();
  for (const ledger of [null, [], { 1: {} }, { 0: s.dailyLedger[1] }, { 2: s.dailyLedger[1] }, { 1: { ...s.dailyLedger[1], income: -1 } }]) {
    assert.equal(T.valid({ ...s, dailyLedger: ledger }), false);
  }
  s.day = 4;
  const before = structuredClone(s);
  assert.throws(() => act(s, { type: "next" }), /生活支出/);
  assert.deepEqual(s, before);
});
