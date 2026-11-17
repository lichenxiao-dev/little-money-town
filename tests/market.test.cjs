const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");

function next(weather, bakeryEvent, bakeryNoise, umbrellaEvent, umbrellaNoise, state = T.create()) {
  const rolls = [weather, bakeryEvent, bakeryNoise, 0.5, umbrellaEvent, umbrellaNoise, 0.5, 0.5];
  return T.act(state, { type: "next" }, () => {
    assert.ok(rolls.length, "Only day advancement draws market randomness");
    return rolls.shift();
  }).state;
}

test("weather and every shop event change prices while other conditions stay equal", () => {
  const sunny = next(0, 0.5, 0.5, 0.5, 0.5);
  const rainy = next(0.9, 0.5, 0.5, 0.5, 0.5);
  assert.equal(rainy.prices.umbrella, sunny.prices.umbrella + 1);
  assert.equal(rainy.prices.bakery, sunny.prices.bakery);
  assert.match(T.marketInfo(rainy, "umbrella").factors[0].text, /雨伞/);
  for (const [roll, effect] of [[0, -2], [0.2, -1], [0.4, 0], [0.6, 1], [0.8, 2]]) {
    const s = next(0, roll, 0.5, roll, 0.5);
    assert.equal(s.prices.bakery, 10 + effect);
    assert.equal(s.prices.umbrella, 15 + effect);
    assert.equal(T.valid(s), true);
  }
});

test("good news can coincide with losses and bad news with gains for both shops", () => {
  const good = next(0.9, 0.99, 0, 0.99, 0);
  const bad = next(0, 0, 0.99, 0, 0.99);
  for (const id of Object.keys(T.SHOPS)) {
    const goodInfo = T.marketInfo(good, id), badInfo = T.marketInfo(bad, id);
    assert.ok(goodInfo.factors.some((f) => f.effect > 0));
    assert.ok(goodInfo.change < 0);
    assert.ok(badInfo.factors.some((f) => f.effect < 0));
    assert.ok(badInfo.change > 0);
    assert.equal(goodInfo.price, goodInfo.old + goodInfo.factors.reduce((sum, f) => sum + f.effect, 0) + goodInfo.noise);
  }
});

test("daily observations survive reloads and trades, and update only on the next game day", () => {
  let s = next(0.9, 0.99, 0, 0.99, 0);
  const market = structuredClone(s.market);
  const neverRandom = () => { throw new Error("Trading must not redraw news"); };
  s = T.restore(JSON.parse(JSON.stringify(s)));
  s = T.act(s, { type: "invest", id: "umbrella" }, neverRandom).state;
  assert.throws(() => T.act(s, { type: "sell", id: "umbrella" }, neverRandom));
  assert.deepEqual(s.market, market);
  assert.equal(T.valid(s), true);
  const tomorrow = next(0, 0, 0.5, 0, 0.5, s);
  assert.equal(tomorrow.market.day, market.day + 1);
  assert.equal(tomorrow.market.weather, "sun");
  for (const id of Object.keys(T.SHOPS)) {
    assert.equal(T.marketInfo(tomorrow, id).old, market.shops[id].price);
  }
  assert.deepEqual(T.act(tomorrow, { type: "sell", id: "umbrella" }, neverRandom).state.market, tomorrow.market);
  const owned = T.act(T.create(), { type: "invest", id: "umbrella" }).state;
  assert.deepEqual(next(0.9, 0.99, 0, 0.99, 0, owned).market, market, "Owning shares does not influence events");
});

test("old saves do not invent explanations; malformed new observations are rejected", () => {
  const old = next(0.9, 0.99, 0, 0.99, 0);
  delete old.market;
  assert.equal(T.valid(old), true);
  const restored = T.restore(old);
  assert.equal(T.marketInfo(restored, "bakery"), null);
  assert.deepEqual(restored.prices, old.prices);
  assert.equal(restored.cash, old.cash);
  assert.deepEqual(restored.finance, old.finance);
  const current = next(0.9, 0.99, 0, 0.99, 0);
  for (const modify of [
    (s) => { s.market.day--; },
    (s) => { s.market.weather = "sun"; },
    (s) => { delete s.market.shops.bakery; },
    (s) => { s.market.shops.bakery.event = 9; },
    (s) => { s.market.shops.bakery.noise = 5; },
    (s) => { s.market.shops.bakery.price++; }
  ]) {
    const malformed = structuredClone(current);
    modify(malformed);
    assert.equal(T.valid(malformed), false);
  }
});

test("prices stay nonnegative and positive events cannot revive a closed shop", () => {
  const low = T.create(); low.prices.bakery = 1; low.prices.umbrella = 1;
  let s = T.act(low, { type: "next" }, () => 0).state;
  assert.deepEqual(s.prices, { bakery: 0, umbrella: 0 });
  assert.equal(T.valid(s), true);
  s = T.act(s, { type: "next" }, () => 0.99).state;
  assert.deepEqual(s.prices, { bakery: 0, umbrella: 0 });
  assert.equal(T.valid(s), true);
  assert.throws(() => T.act(s, { type: "invest", id: "bakery" }));
});
