const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const act = (s, type, id = "bakery") => T.act(s, { type, id }, () => 0.5).state;

test("same-day shares remain locked across reloads and unlock at the next game day", () => {
  let s = act(T.create(), "invest");
  const before = structuredClone(s);
  assert.equal(T.holdings(s, "bakery").sellable, 0);
  assert.equal(T.assets(s).invested, 10);
  assert.equal(T.assets(s).sellable, 0);
  assert.throws(() => act(s, "sell"), /下一游戏日/);
  assert.deepEqual(s, before);
  s = T.restore(JSON.parse(JSON.stringify(s)));
  assert.throws(() => act(s, "sell"));
  s = act(s, "next");
  assert.equal(T.holdings(s, "bakery").sellable, 1);
  assert.equal(T.holdings(s, "bakery").locked, 0);
  assert.equal(act(s, "sell").shares.bakery.length, 0);
});

test("old shares sell FIFO while today's purchases in both shops stay locked", () => {
  let s = T.create(); s.shares.bakery = [7, 9]; s.cash = 84;
  s = act(s, "invest");
  s = act(s, "invest", "umbrella");
  const first = T.act(s, { type: "sell", id: "bakery" });
  assert.equal(first.result.cost, 7);
  const second = T.act(first.state, { type: "sell", id: "bakery" });
  assert.equal(second.result.cost, 9);
  s = second.state;
  assert.deepEqual(s.shares.bakery, [10]);
  assert.equal(s.shareLocks.bakery, 1);
  assert.equal(s.shareLocks.umbrella, 1);
  assert.throws(() => act(s, "sell"));
  assert.throws(() => act(s, "sell", "umbrella"));
  assert.equal(T.valid(s), true);
});

test("legacy saves recover recent purchase locks from their existing journal without changing costs", () => {
  let old = T.create(); old.shares.bakery = [7]; old.cash = 93;
  old = act(old, "invest");
  delete old.shareLocks;
  assert.equal(T.valid(old), true);
  const s = T.restore(old);
  assert.deepEqual(s.shares.bakery, [7, 10]);
  assert.equal(T.holdings(s, "bakery").sellable, 1);
  assert.equal(s.cash, old.cash);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  assert.equal(act(s, "sell").shareLocks.bakery, 1);
  const partial = structuredClone(old);
  partial.shares.bakery = [10];
  assert.equal(T.restore(partial).shareLocks.bakery, 1);
});

test("invalid lock counts are rejected and today's locked assets do not trap necessary bills", () => {
  let s = T.create(); s.day = 4; s.cash = 10; s.energy = 0;
  s = act(s, "invest");
  assert.equal(T.expense(s).aid, 6);
  s = T.act(s, { type: "expense", choice: 0, aid: true, day: 4 }).state;
  s = act(s, "next");
  assert.equal(T.holdings(s, "bakery").sellable, 1);
  for (const locks of [null, { day: 6, bakery: 0, umbrella: 0 }, { day: 5, bakery: 2, umbrella: 0 }, { day: 5, bakery: -1, umbrella: 0 }]) {
    assert.equal(T.valid({ ...s, shareLocks: locks }), false);
  }
});
