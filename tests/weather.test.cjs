const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");

test("published rain chances determine tomorrow's weather without guaranteeing it", () => {
  for (const chance of [20, 50, 80]) {
    let rainyDays = 0;
    for (let draw = 0; draw < 100; draw++) {
      const state = T.create();
      state.forecast = { rainChance: chance };
      let calls = 0;
      const next = T.act(state, { type: "next" }, () => calls++ === 0 ? (draw + 0.5) / 100 : 0.5).state;
      rainyDays += next.weather === "rain" ? 1 : 0;
      assert.equal(T.valid(next), true);
    }
    assert.equal(rainyDays, chance);
  }
});

test("forecasts survive reloads and financial actions; old saves receive a neutral forecast", () => {
  const state = T.create();
  state.forecast = { rainChance: 80 };
  const restored = T.restore(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.forecast, state.forecast);
  const saved = T.act(restored, { type: "save", amount: 10 }, () => { throw new Error("No reroll"); }).state;
  assert.deepEqual(saved.forecast, state.forecast);
  const legacy = T.create();
  delete legacy.forecast;
  assert.equal(T.valid(legacy), true);
  assert.deepEqual(T.restore(legacy).forecast, { rainChance: 50 });
  for (const forecast of [null, {}, { rainChance: 100 }, { rainChance: "80" }]) {
    assert.equal(T.valid({ ...state, forecast }), false);
  }
});

test("new forecasts are issued only after a successful day advance", () => {
  const state = T.create();
  state.forecast = { rainChance: 80 };
  const next = T.act(state, { type: "next" }, () => 0.1).state;
  assert.equal(next.weather, "sun", "A rainy forecast can be wrong");
  assert.deepEqual(next.forecast, { rainChance: 20 });
  assert.deepEqual(state.forecast, { rainChance: 80 }, "Advancing does not mutate input");
  const blocked = { ...state, day: 4 };
  assert.throws(() => T.act(blocked, { type: "next" }, () => { throw new Error("Unexpected weather draw"); }), /生活支出/);
  assert.deepEqual(blocked.forecast, { rainChance: 80 });
});

test("stall settlement uses today's actual weather, not tomorrow's forecast or outcome", () => {
  let state = T.act(T.create(), { type: "stall" }).state;
  state.forecast = { rainChance: 80 };
  const next = T.act(state, { type: "next" }, () => 0.9);
  assert.equal(next.state.weather, "rain");
  assert.equal(next.result.stall.weather, "sun");
  assert.equal(next.result.stall.visitors, 6);
});
