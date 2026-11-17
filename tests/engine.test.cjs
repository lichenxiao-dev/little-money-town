const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const act = (s, action, rng) => T.act(s, action, rng).state;

test("discount threshold shows extra purchases can increase actual spending", () => {
  assert.deepEqual([T.quote(["ball"]).due, T.quote(["ball", "flowers"]).due, T.quote(["ball", "bread"]).due], [20, 28, 25]);
  assert.equal(T.quote(["telescope", "ball"]).discount, 5);
  assert.equal(T.quote(["ball", "ball"]).due, 35);
});

test("purchases are atomic and cannot overspend", () => {
  const initial = T.create();
  const s = act(initial, { type: "buy", ids: ["telescope"] });
  assert.equal(s.cash, 25);
  assert.equal(initial.cash, 100);
  assert.deepEqual(s.owned, ["telescope"]);
  assert.throws(() => act(s, { type: "buy", ids: ["bunny"] }));
  assert.throws(() => act(s, { type: "buy", ids: ["telescope"] }));
  assert.equal(s.cash, 25);
});

test("quantity pricing aggregates unit subtotals and applies the basket discount once", () => {
  const mixed = T.quote(["pencil", "notebook", "pencil"]);
  assert.equal(mixed.subtotal, 11);
  assert.deepEqual(mixed.items.map((g) => [g.id, g.quantity, g.lineTotal]), [["pencil", 2, 6], ["notebook", 1, 5]]);
  assert.equal(T.quote(Array(9).fill("pencil")).due, 27);
  const ten = T.quote(Array(10).fill("pencil"));
  assert.deepEqual([ten.subtotal, ten.discount, ten.due], [30, 5, 25]);
  assert.equal(T.quote(Array(20).fill("pencil")).discount, 5);
  for (const ids of [[], null, ["pencil", "missing"], ["pencil", 2]]) assert.throws(() => T.quote(ids));
});

test("multiple units and later purchases accumulate inventory without duplicate charges", () => {
  let s = act(T.create(), { type: "buy", ids: Array(10).fill("pencil") });
  assert.equal(s.cash, 75);
  assert.equal(s.owned.filter((id) => id === "pencil").length, 10);
  assert.equal(s.finance.spending, 25);
  assert.match(s.journal[0].text, /铅笔 × 10支/);
  s = act(s, { type: "buy", ids: ["pencil", "pencil", "pencil"] });
  assert.equal(s.cash, 66);
  assert.equal(s.finance.spending, 34);
  assert.equal(s.owned.length, 13);
  const before = structuredClone(s);
  assert.throws(() => act(s, { type: "buy", ids: Array(4).fill("telescope") }));
  assert.throws(() => act(s, { type: "buy", ids: ["pencil", "missing"] }));
  assert.deepEqual(s, before);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
});

test("eating removes exactly one purchased unit and allows replenishment", () => {
  let s = act(T.create(), { type: "buy", ids: ["cookie", "cookie", "cookie", "pencil"] });
  assert.equal(s.cash, 85);
  s = act(s, { type: "eat", id: "cookie" });
  assert.equal(s.owned.filter((id) => id === "cookie").length, 2);
  assert.equal(s.cash, 85);
  s = act(s, { type: "buy", ids: ["cookie"] });
  assert.equal(s.cash, 81);
  for (let i = 0; i < 3; i++) s = act(s, { type: "eat", id: "cookie" });
  assert.deepEqual(s.owned, ["pencil"]);
  assert.equal(s.cash, 81);
  assert.equal(s.finance.spending, 19);
  assert.throws(() => act(s, { type: "eat", id: "cookie" }));
});

test("old pencil packs become two units once without changing money or other belongings", () => {
  const old = T.create();
  delete old.inventoryVersion;
  old.owned = ["pencil", "cookie", "notebook"];
  old.cash = 42; old.savings = 20;
  assert.equal(T.valid(old), true);
  const s = T.restore(old);
  assert.deepEqual(s.owned, ["pencil", "pencil", "cookie", "notebook"]);
  assert.equal(s.cash, 42);
  assert.equal(s.savings, 20);
  assert.deepEqual(s.finance, old.finance);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  assert.equal(T.valid(s), true);
  assert.equal(T.valid({ ...s, inventoryVersion: 3 }), false);
  assert.equal(T.valid({ ...s, inventoryVersion: undefined }), false);
  const bought = act(old, { type: "buy", ids: ["pencil"] });
  assert.equal(bought.owned.filter((id) => id === "pencil").length, 3);
  assert.equal(bought.cash, 39);
});

test("savings transfers conserve money and reject invalid amounts", () => {
  let s = act(T.create(), { type: "save", amount: 80 });
  assert.equal(s.cash + s.savings, 100);
  assert.throws(() => act(s, { type: "withdraw", amount: 81 }));
  for (const amount of [-1, 0, 0.5, NaN, Infinity, "10"]) assert.throws(() => act(s, { type: "save", amount }));
  s = act(s, { type: "withdraw", amount: 80 });
  assert.equal(s.cash, 100);
  assert.equal(s.savings, 0);
});

test("children choose wishes from every price range without spending money or adding purchases", () => {
  const initial = T.create();
  assert.deepEqual(initial.wishlist, []);
  let s = initial;
  for (const id of ["pencil", "diary", "cake", "telescope", "diary"]) s = act(s, { type: "wish-add", id });
  assert.deepEqual(s.wishlist, ["pencil", "diary", "cake", "telescope"]);
  assert.deepEqual(initial.wishlist, []);
  assert.deepEqual({ ...s, wishlist: [] }, initial);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  s = act(s, { type: "wish-remove", id: "diary" });
  s = act(s, { type: "wish-remove", id: "diary" });
  assert.deepEqual(s.wishlist, ["pencil", "cake", "telescope"]);
  const before = structuredClone(s);
  for (const type of ["wish-add", "wish-remove"]) assert.throws(() => act(s, { type, id: "missing" }));
  assert.deepEqual(s, before);
  for (const wishlist of [null, {}, ["missing"], ["pencil", "pencil"]]) assert.equal(T.valid({ ...s, wishlist }), false);
  s = act(s, { type: "buy", ids: ["cake", "cake", "diary"] });
  assert.equal(s.cash, 1);
  assert.deepEqual(s.wishlist, before.wishlist);
  s = act(s, { type: "eat", id: "cake" });
  assert.deepEqual(s.owned, ["cake", "diary"]);
  assert.equal(s.cash, 1);
});

test("legacy single wishes migrate once and removed wishes never reappear", () => {
  const old = T.create();
  delete old.wishlist;
  old.goal = "cookie";
  old.cash = 42; old.savings = 30;
  assert.equal(T.valid(old), true);
  let s = T.restore(old);
  assert.deepEqual(s.wishlist, ["cookie"]);
  assert.equal(s.goal, undefined);
  assert.equal(s.cash, 42);
  assert.equal(s.savings, 30);
  assert.deepEqual(T.restore(s), s);
  s = act(s, { type: "wish-remove", id: "cookie" });
  assert.deepEqual(T.restore(s).wishlist, []);
  assert.equal(T.valid({ ...old, goal: "missing" }), false);
});

test("work consumes energy; advancing restores it without charging cash", () => {
  let s = T.create();
  for (let i = 0; i < 3; i++) s = act(s, { type: "work", id: "garden" });
  assert.equal(s.cash, 124);
  assert.equal(s.energy, 0);
  assert.throws(() => act(s, { type: "work", id: "garden" }));
  s = act(s, { type: "next" }, () => 0.5);
  assert.equal(s.energy, 3);
  assert.equal(s.cash, 124);
});

test("legacy one-day stall settles its paid materials once without opening a new shop", () => {
  for (const [random, revenue, profit] of [[0, 0, -12], [0.5, 12, 0], [0.999, 24, 12]]) {
    const s = T.create(); delete s.stall; s.pending = true; s.cash = 88; s.energy = 2;
    assert.equal(s.cash, 88);
    assert.throws(() => act(s, { type: "stall" }));
    const output = T.act(s, { type: "next" }, () => random);
    assert.equal(output.result.stall.revenue, revenue);
    assert.equal(output.result.stall.profit, profit);
    assert.equal(output.state.cash, 100 + profit);
    const next = T.act(output.state, { type: "next" }, () => random);
    assert.equal(next.result.stall, null);
    assert.equal(next.state.cash, 100 + profit);
  }
});

test("share sale uses oldest cost, returns proceeds not profit twice", () => {
  let s = act(T.create(), { type: "invest", id: "bakery" });
  s.day += 1;
  s.prices.bakery = 14;
  s = act(s, { type: "invest", id: "bakery" });
  assert.deepEqual(T.holdings(s, "bakery"), { count: 2, cost: 24, value: 28, locked: 1, sellable: 1 });
  s.prices.bakery = 7;
  const output = T.act(s, { type: "sell", id: "bakery" });
  assert.deepEqual(output.result, { cost: 10, revenue: 7, profit: -3 });
  assert.equal(output.state.cash, 83);
  assert.deepEqual(output.state.shares.bakery, [14]);
});

test("prices can rise, fall or reach zero; no free shares in a failed shop", () => {
  let s = act(T.create(), { type: "invest", id: "bakery" });
  assert.ok(act(s, { type: "next" }, () => 0.99).prices.bakery > 10);
  s.prices.bakery = 3;
  s = act(s, { type: "next" }, () => 0);
  assert.equal(s.prices.bakery, 0);
  assert.throws(() => act(s, { type: "invest", id: "bakery" }));
  const output = T.act(s, { type: "sell", id: "bakery" });
  assert.equal(output.result.profit, -10);
  assert.equal(output.state.cash, 90);
  assert.equal(act(s, { type: "next" }, () => 0.99).prices.bakery, 0);
});

test("dividends apply to owned shares only and are not guaranteed", () => {
  const s = act(T.create(), { type: "invest", id: "bakery" });
  assert.equal(act(s, { type: "next" }, () => 0).cash, 91);
  assert.equal(act(s, { type: "next" }, () => 0.9).cash, 90);
  assert.equal(act(T.create(), { type: "next" }, () => 0).cash, 100);
});

test("allowance and recurring calendar events cannot be repeatedly claimed", () => {
  let s = T.create();
  s.calendar.startMonth = 12; s.calendar.startDay = 3;
  s.day = 7;
  s = act(s, { type: "event", choice: "card" });
  assert.equal(s.cash, 100);
  assert.throws(() => act(s, { type: "event", choice: "party" }));
  s = act(s, { type: "next" }, () => 0.5);
  assert.equal(s.cash, 120);
  s.calendar.startMonth = 1; s.calendar.startDay = 1; s.day = 21;
  s = act(s, { type: "event", choice: "join" });
  assert.equal(s.cash, 150);
  assert.throws(() => act(s, { type: "event", choice: "join" }));
  s.day = 357;
  s = act(s, { type: "event", choice: "join" });
  assert.equal(s.cash, 180);
  assert.equal(T.month(s), 1);
  assert.equal(T.dayOfMonth(s), 21);
});

test("zero money remains playable and birthday has a free alternative", () => {
  let s = T.create();
  s.cash = 0; s.day = 9; s.calendar.startMonth = 12;
  assert.throws(() => act(s, { type: "event", choice: "party" }));
  s = act(s, { type: "event", choice: "card" });
  s = act(s, { type: "work", id: "parcel" });
  assert.equal(s.cash, 10);
});

test("save validation rejects broken economic state", () => {
  assert.equal(T.valid(T.create()), true);
  for (const change of [{ cash: -1 }, { energy: 7 }, { owned: ["invalid"] }, { day: 0 }, { shares: null }, { journal: [{}] }, { prices: { bakery: -10, umbrella: 15 } }]) {
    assert.equal(T.valid({ ...T.create(), ...change }), false);
  }
  let s = T.create();
  for (let i = 0; i < 60; i++) {
    s = act(s, { type: "work", id: "garden" });
    if (T.expense(s).due) s = act(s, { type: "expense", choice: 0 });
    s = act(s, { type: "next" });
    assert.equal(T.valid(JSON.parse(JSON.stringify(s))), true);
    assert.ok(s.cash >= 0);
  }
});

test("guided route advances only on its current successful action", () => {
  let s = act(T.create(), { type: "guide-start" });
  assert.equal(s.guide.step, 1);
  assert.throws(() => act(s, { type: "buy", ids: ["missing"] }));
  assert.equal(s.guide.step, 1);
  s = act(s, { type: "save", amount: 10 });
  assert.equal(s.guide.step, 1);
  s = act(s, { type: "work", id: "parcel" });
  assert.equal(s.guide.step, 2);
  s = act(s, { type: "buy", ids: ["pencil", "eraser"] });
  assert.equal(s.guide.step, 3);
  s = act(s, { type: "save", amount: 10 });
  assert.equal(s.guide.step, 4);
  s = act(s, { type: "next" }, () => 0.5);
  assert.equal(s.guide.step, 5);
});

test("guide can be skipped without spending and pause resumes at the same step", () => {
  let s = act(T.create(), { type: "guide-start" });
  s = act(s, { type: "guide-skip" });
  assert.equal(s.cash, 100);
  assert.equal(s.guide.step, 2);
  s = act(s, { type: "guide-pause" });
  s = act(s, { type: "work", id: "garden" });
  assert.deepEqual(s.guide, { step: 2, paused: true, flow: 2 });
  s = act(s, { type: "guide-start" });
  assert.deepEqual(s.guide, { step: 2, paused: false, flow: 2 });
  for (let i = 0; i < 3; i++) s = act(s, { type: "guide-skip" });
  assert.equal(s.guide.step, 5);
  assert.equal(s.cash, 108);
  assert.equal(s.day, 1);
});

test("snacks are consumed once without new charges and can be bought again", () => {
  let s = act(T.create(), { type: "buy", ids: ["cookie", "pencil"] });
  assert.equal(s.cash, 93);
  s = act(s, { type: "eat", id: "cookie" });
  assert.equal(s.cash, 93);
  assert.equal(s.owned.includes("cookie"), false);
  assert.equal(s.owned.includes("pencil"), true);
  assert.throws(() => act(s, { type: "eat", id: "cookie" }));
  assert.throws(() => act(s, { type: "eat", id: "pencil" }));
  s = act(s, { type: "buy", ids: ["cookie"] });
  assert.equal(s.cash, 89);
  assert.equal(s.owned.includes("cookie"), true);
});

test("old saves keep money, legacy belongings and wish during guide upgrade", () => {
  const old = T.create();
  delete old.guide;
  delete old.wishlist;
  old.cash = 42; old.owned = ["bunny", "flowers", "telescope"]; old.goal = "flowers";
  assert.equal(T.valid(old), true);
  const s = act(old, { type: "guide-start" });
  assert.equal(s.cash, 42);
  assert.deepEqual(s.owned, old.owned);
  assert.deepEqual(s.wishlist, ["flowers"]);
  assert.deepEqual(s.guide, { step: 1, paused: false, flow: 2 });
  for (const guide of [null, { step: -1, paused: false }, { step: 6, paused: false }, { step: 1, paused: "false" }]) {
    assert.equal(T.valid({ ...old, guide }), false);
  }
});

test("old guide positions migrate while balances and skills are preserved", () => {
  const old = T.create();
  old.guide = { step: 1, paused: true };
  delete old.skills;
  old.cash = 47;
  const s = T.restore(old);
  assert.deepEqual(s.guide, { step: 2, paused: true, flow: 2 });
  assert.deepEqual(s.skills, { garden: 0, parcel: 0, craft: 0, cashier: 0, packing: 0, catcher: 0, balloons: 0, digging: 0 });
  assert.equal(s.cash, 47);
  assert.deepEqual(T.restore(s), s);
});
test("ordinary days keep the play, choice and next-day loop", () => {
  let s = T.create();
  assert.equal(T.dayPlan(s).phase, "play");
  s = act(s, { type: "work", id: "parcel" });
  assert.equal(s.skills.parcel, 1);
  assert.equal(T.dayPlan(s).phase, "choice");
  s = act(s, { type: "keep-money" });
  assert.equal(s.cash, 110);
  assert.equal(T.dayPlan(s).phase, "done");
  s = act(s, { type: "next" }, () => 0.5);
  assert.equal(T.dayPlan(s).phase, "play");
  assert.equal(T.dayPlan(s).task, "garden");
  assert.equal(s.skills.parcel, 1);
});

function advanceDays(s, days) {
  for (let i = 0; i < days; i++) {
    if (T.expense(s).due) s = act(s, { type: "expense", choice: 0 });
    s = act(s, { type: "next" }, () => 0.5);
  }
  return s;
}

test("bank interest uses held coin-days, settles weekly once and survives reloads", () => {
  let s = act(T.create(), { type: "save", amount: 20 });
  assert.equal(T.bankStatus(s).forecast, 1);
  s = advanceDays(s, 6);
  assert.equal(s.savings, 20);
  assert.equal(s.bank.units, 120);
  const saved = JSON.stringify(s);
  s = advanceDays(T.restore(JSON.parse(saved)), 1);
  assert.equal(s.savings, 21);
  assert.equal(s.bank.earned, 1);
  assert.equal(s.lastReport.bank.interest, 1);
  assert.equal(s.bank.units, 0);
  assert.equal(s.journal.find((e) => e.bankAmount === 1).amount, 0);
  const reload = T.restore(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(reload, s);
  s = advanceDays(s, 1);
  assert.equal(s.savings, 21);
  assert.equal(s.bank.earned, 1);
  assert.equal(s.bank.units, 21);
});

test("late deposits and withdrawals do not get a full week; fractions carry over", () => {
  let s = T.create();
  for (let i = 0; i < 3; i++) {
    s = act(s, { type: "save", amount: 20 });
    s = act(s, { type: "withdraw", amount: 20 });
  }
  assert.equal(s.bank.units, 0);
  s = advanceDays(s, 6);
  s = act(s, { type: "save", amount: 20 });
  s = advanceDays(s, 1);
  assert.equal(s.bank.earned, 0);
  assert.equal(s.bank.units, 20);
  s = act(s, { type: "withdraw", amount: 20 });
  s = advanceDays(s, 7);
  assert.equal(s.bank.units, 20, "Withdrawing retains the already accrued fraction but earns no new interest");
  s = act(s, { type: "save", amount: 20 });
  s = advanceDays(s, 7);
  assert.equal(s.bank.earned, 1);
  assert.equal(s.bank.units, 20);
});

test("adaptive progression responds to performance, supports practice and caps levels", () => {
  let s = T.create();
  const work = (level, mistakes = 0, assists = 0) => {
    s.energy = 3;
    s = act(s, { type: "work", id: "parcel", performance: { level, mistakes, assists } });
  };
  assert.equal(T.challengeLevel(s, "parcel"), 2);
  work(2); assert.equal(T.challengeLevel(s, "parcel"), 2);
  s = T.restore(JSON.parse(JSON.stringify(s)));
  work(2); assert.equal(T.challengeLevel(s, "parcel"), 3);
  work(3, 4); assert.equal(T.challengeLevel(s, "parcel"), 2);
  work(2, 0, 3); assert.equal(T.challengeLevel(s, "parcel"), 1);
  work(1, 8); assert.equal(T.challengeLevel(s, "parcel"), 1);
  work(5); work(5); assert.equal(T.challengeLevel(s, "parcel"), 5);
  work(5); work(1); assert.equal(T.challengeLevel(s, "parcel"), 1, "Manual easier practice starts its own streak");
  const cash = s.cash;
  assert.throws(() => act(s, { type: "work", id: "parcel", performance: { level: 99, mistakes: 0, assists: 0 } }));
  assert.equal(s.cash, cash);
});

test("necessary spending is announced, cannot be skipped or paid twice, and consumes no energy", () => {
  let s = T.create();
  s.day = 3;
  assert.equal(T.expense(s).days, 1);
  s = advanceDays(s, 1);
  assert.equal(T.dayPlan(s).phase, "bill");
  assert.throws(() => act(s, { type: "next" }));
  assert.throws(() => act(s, { type: "expense", choice: 0, day: 8 }));
  const before = structuredClone(s);
  s = act(s, { type: "expense", choice: 1 });
  assert.equal(s.cash, before.cash - 9);
  assert.equal(s.energy, before.energy);
  assert.equal(s.finance.spending, 9);
  assert.equal(T.expense(s).days, 4);
  assert.throws(() => act(s, { type: "expense", choice: 0 }));
  assert.equal(T.act(s, { type: "next" }).state.day, 5);
  assert.equal(T.expense(s).title, "补充学习用品");
  s = T.restore(JSON.parse(JSON.stringify(s)));
  assert.equal(T.expense(s).due, false);
});

test("emergency support only covers the basic shortfall and never gives spendable cash", () => {
  let s = T.create(); s.day = 4; s.cash = 2; s.energy = 0;
  assert.equal(T.expense(s).aid, 4);
  assert.throws(() => act(s, { type: "expense", choice: 1, aid: true }));
  const output = T.act(s, { type: "expense", choice: 0, aid: true });
  assert.deepEqual(output.result, { price: 6, aid: 4 });
  assert.equal(output.state.cash, 0);
  assert.equal(output.state.finance.income, 4);
  assert.equal(output.state.finance.spending, 6);
  assert.equal(output.state.necessities.paidDay, 4);
  assert.throws(() => act(output.state, { type: "expense", choice: 0, aid: true }));
  for (const change of [{ energy: 1 }, { savings: 1 }, { cash: 6 }, { shares: { bakery: [10], umbrella: [] } }]) {
    assert.throws(() => act({ ...s, ...change }, { type: "expense", choice: 0, aid: true }));
  }
  s.shares.bakery = [10]; s.prices.bakery = 0;
  assert.equal(T.expense(s).aid, 4, "Worthless shares do not block emergency support");
});

test("asset totals include the bank, market values and pending materials without double counting", () => {
  let s = act(T.create(), { type: "save", amount: 20 });
  s = act(s, { type: "invest", id: "bakery" });
  s.cash -= 12; s.pending = true; delete s.stall;
  assert.equal(T.assets(s).total, 100);
  assert.deepEqual([T.assets(s).cash, T.assets(s).savings, T.assets(s).invested, T.assets(s).materials], [58, 20, 10, 12]);
  assert.equal(s.finance.spending, 0);
  s.prices.bakery = 6;
  assert.equal(T.assets(s).unrealized, -4);
  assert.equal(T.assets(s).total, 96);
  s.day += 1;
  s = act(s, { type: "sell", id: "bakery" });
  assert.equal(s.finance.realized, -4);
  assert.equal(s.finance.income, 0);
  assert.equal(T.assets(s).total, 96);
  s = act(s, { type: "next" }, () => 0);
  assert.equal(s.finance.realized, -16);
  assert.equal(T.assets(s).materials, 0);
  assert.equal(T.assets(s).total, 84);
  s = act(s, { type: "buy", ids: ["pencil", "eraser"] });
  assert.equal(s.finance.spending, 5);
  assert.equal(T.assets(s).total, 79);
  for (let i = 0; i < 65; i++) s = act(s, { type: "keep-money" });
  assert.equal(s.journal.length, 60);
  assert.equal(s.finance.spending, 5, "Cumulative totals outlive the displayed ledger");
});

test("legacy upgrade preserves assets and memories without inventing backdated interest", () => {
  const old = T.create();
  for (const key of ["bank", "finance", "necessities", "challenges", "calendar"]) delete old[key];
  old.day = 40; old.cash = 32; old.savings = 20; old.shares.bakery = [8]; old.events = ["1-7"];
  assert.equal(T.valid(old), true);
  const s = T.restore(old);
  assert.equal(T.assets(s).total, 62);
  assert.equal(s.finance.opening, 62);
  assert.equal(s.finance.migrated, true);
  assert.deepEqual(s.bank, { units: 0, earned: 0 });
  assert.deepEqual([T.dateInfo(s).month, T.dateInfo(s).date], [2, 12]);
  assert.equal(T.eventMemory(s, "1-7").icon, "🎂");
  assert.deepEqual(T.restore(s), s);
  for (const change of [{ bank: { units: -1, earned: 0 } }, { finance: { ...s.finance, spending: -1 } }, { calendar: { ...s.calendar, startDay: 29 } }, { challenges: { ...s.challenges, craft: { level: 6, streak: 0 } } }]) assert.equal(T.valid({ ...s, ...change }), false);
  old.day = 21; old.events = ["1-21"];
  const alreadyClaimed = T.restore(old);
  assert.throws(() => act(alreadyClaimed, { type: "event", choice: "join" }), "Migrated New Year gifts cannot be claimed a second time");
  assert.equal(alreadyClaimed.events.length, 1);
});

test("fictional calendar keeps 28-day months, annual birthdays and independent game time", () => {
  let s = T.create();
  assert.deepEqual([T.dateInfo(s).month, T.dateInfo(s).date], [9, 1]);
  assert.equal(T.eventOn(s, 11).id, "sports");
  assert.equal(T.eventOn(s, 45).id, "outing");
  s.day = 93;
  assert.equal(T.eventOn(s).id, "birthday");
  s = act(s, { type: "event", choice: "card" });
  assert.throws(() => act(s, { type: "event", choice: "card" }));
  s.day += 336;
  assert.equal(T.eventOn(s).id, "birthday");
  s = act(s, { type: "event", choice: "card" });
  assert.equal(s.events.length, 2);
  assert.equal(T.eventMemory(s, s.events[0]).name, "你的生日");
  const newYear = T.create(); newYear.day = 113;
  assert.deepEqual([T.dateInfo(newYear).year, T.month(newYear), T.dayOfMonth(newYear)], [2, 1, 1]);
  assert.equal(T.eventOn(newYear).id, "new-year");
  assert.deepEqual(T.dateInfo(T.restore(JSON.parse(JSON.stringify(s)))), T.dateInfo(s), "Reloading never follows the wall clock");
});
