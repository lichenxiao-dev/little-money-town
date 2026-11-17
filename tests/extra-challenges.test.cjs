const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../mini-games.js");
const T = require("../engine.js");
const { findChange, findPacking } = require("./puzzle-helpers.cjs");

test("all cashier levels generate solvable bounded change and pay only after three customers", () => {
  for (const level of [1, 2, 3, 4, 5]) {
    for (const random of [0, 0.42, 0.999]) {
      let g = M.create("cashier", level, () => random);
      const original = structuredClone(g);
      g = M.move(g, { type: "give-change" });
      assert.equal(g.round, 0);
      assert.equal(g.mistakes, 1);
      for (let round = 0; round < 3; round++) {
        const order = g.orders[round], counts = findChange(order.paid - order.cost, order.stock);
        assert.ok(counts);
        for (let index = 0; index < counts.length; index++) {
          for (let n = 0; n < counts[index]; n++) g = M.move(g, { type: "coin-add", index });
        }
        assert.equal(g.won, false);
        g = M.move(g, { type: "give-change" });
        assert.equal(g.round, round + 1);
        assert.equal(g.won, round === 2);
      }
      assert.deepEqual(original.selected, [0, 0, 0, 0]);
      assert.deepEqual(M.move(g, { type: "give-change" }), g);
    }
  }
});

test("cashier coins cannot exceed stock and can be returned without losing progress", () => {
  let g = M.create("cashier", 2, () => 0.5);
  const stock = [...g.orders[0].stock];
  for (let i = 0; i < 4; i++) {
    for (let n = 0; n < stock[i] + 2; n++) g = M.move(g, { type: "coin-add", index: i });
    assert.equal(g.selected[i], stock[i]);
    for (let n = 0; n < stock[i] + 2; n++) g = M.move(g, { type: "coin-remove", index: i });
    assert.equal(g.selected[i], 0);
  }
  assert.deepEqual(g.orders[0].stock, stock);
  assert.equal(g.round, 0);
  for (const index of [-1, 4, 0.5, "1"]) assert.deepEqual(M.move(g, { type: "coin-add", index }), g);
});

test("all packing levels are solvable with rotations and require an explicit final check", () => {
  for (const level of [1, 2, 3, 4, 5]) {
    for (const random of [0, 0.42, 0.999]) {
      let g = M.create("packing", level, () => random);
      const original = structuredClone(g);
      const solution = findPacking(g.items, g.columns, g.rows);
      assert.ok(solution);
      for (const placement of solution) {
        g = M.move(g, { type: "pack-select", id: placement.id });
        if (g.items.find((p) => p.id === placement.id).w !== placement.w) g = M.move(g, { type: "pack-rotate" });
        g = M.move(g, { type: "pack-place", index: placement.y * g.columns + placement.x });
        assert.equal(g.error, "");
        assert.equal(g.won, false);
      }
      g = M.move(g, { type: "pack-check" });
      assert.equal(g.won, true);
      assert.deepEqual(M.move(g, { type: "pack-check" }), g);
      assert.deepEqual(original.placements, {});
    }
  }
});

test("packing rejects overlap and overflow, permits taking items out, and cannot duplicate them", () => {
  let g = M.create("packing", 2, () => 0.42);
  const large = g.items.find((item) => item.w * item.h > 1);
  g = M.move(g, { type: "pack-select", id: large.id });
  g = M.move(g, { type: "pack-place", index: g.columns * g.rows - 1 });
  assert.equal(g.error, "outside");
  assert.deepEqual(g.placements, {});
  g = M.move(g, { type: "pack-select", id: large.id });
  const solution = findPacking(g.items, g.columns, g.rows);
  const first = solution[0], second = solution[1];
  g = M.move(g, { type: "pack-select", id: first.id });
  if (g.items.find((p) => p.id === first.id).w !== first.w) g = M.move(g, { type: "pack-rotate" });
  g = M.move(g, { type: "pack-place", index: 0 });
  const removed = M.move(g, { type: "pack-select", id: first.id });
  assert.deepEqual(removed.placements, {});
  assert.equal(removed.selected, first.id);
  assert.equal(removed.mistakes, g.mistakes);
  assert.equal(Object.keys(g.placements).length, 1);
  g = M.move(g, { type: "pack-select", id: second.id });
  if (g.items.find((p) => p.id === second.id).w !== second.w) g = M.move(g, { type: "pack-rotate" });
  g = M.move(g, { type: "pack-place", index: 0 });
  assert.equal(g.error, "overlap");
  assert.equal(Object.keys(g.placements).length, 1);
  const mistakes = g.mistakes;
  g = M.move(g, { type: "pack-select", id: first.id });
  assert.deepEqual(g.placements, {});
  assert.equal(g.selected, first.id);
  assert.equal(g.error, "");
  assert.equal(g.mistakes, mistakes);
  g = M.move(g, { type: "pack-place", index: 0 });
  assert.equal(Object.keys(g.placements).length, 1);
  g = M.move(g, { type: "pack-place", index: 0 });
  assert.deepEqual(g.placements, {});
  assert.equal(g.selected, first.id);
  g = M.move(g, { type: "pack-place", index: 0 });
  assert.equal(Object.keys(g.placements).length, 1);
  g = M.move(g, { type: "pack-check" });
  assert.equal(g.won, false);
  assert.equal(g.error, "missing");
});

test("three-challenge saves retain progress and gain new independent challenges", () => {
  const old = T.create();
  delete old.challengeVersion;
  for (const id of ["cashier", "packing", "catcher", "balloons", "digging"]) { delete old.skills[id]; delete old.challenges[id]; }
  old.skills.parcel = 4; old.challenges.parcel = { level: 4, streak: 1 }; old.cash = 47;
  assert.equal(T.valid(old), true);
  const s = T.restore(old);
  assert.equal(s.skills.parcel, 4);
  assert.deepEqual(s.challenges.parcel, { level: 4, streak: 1 });
  assert.equal(s.cash, 47);
  for (const id of ["cashier", "packing"]) {
    assert.equal(s.skills[id], 0);
    assert.deepEqual(s.challenges[id], { level: 2, streak: 0 });
    const played = T.act(s, { type: "work", id, performance: { level: 2, mistakes: 0, assists: 0 } }).state;
    assert.equal(played.cash, 47 + T.TASKS[id].pay);
    assert.equal(played.energy, 2);
    assert.equal(played.skills[id], 1);
    assert.equal(played.skills.parcel, 4);
    assert.equal(T.dayPlan(played).phase, "choice");
  }
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(s), s);
  assert.equal(T.valid({ ...old, challengeVersion: 2 }), false);
  assert.equal(T.valid({ ...s, challengeVersion: 4 }), false);
  assert.equal(T.dayPlan({ ...s, day: 12 }).task, "cashier");
  assert.equal(T.dayPlan({ ...s, day: 13 }).task, "packing");
});

test("five-challenge saves gain helping games without losing progress, money or difficulty", () => {
  const old = T.create();
  old.challengeVersion = 2; old.cash = 63;
  old.skills.cashier = 5; old.challenges.cashier = { level: 4, streak: 1 };
  for (const id of ["catcher", "balloons", "digging"]) { delete old.skills[id]; delete old.challenges[id]; }
  assert.equal(T.valid(old), true);
  const s = T.restore(old);
  assert.equal(s.cash, 63);
  assert.equal(s.skills.cashier, 5);
  assert.deepEqual(s.challenges.cashier, old.challenges.cashier);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(s), s);
  for (const [index, id] of ["catcher", "balloons", "digging"].entries()) {
    assert.equal(s.skills[id], 0);
    assert.equal(T.dayPlan({ ...s, day: index + 6 }).task, id);
    let played = s;
    for (let n = 0; n < 3; n++) {
      played = T.act(played, { type: "work", id, performance: { level: T.challengeLevel(played, id), mistakes: 0, assists: 0 } }).state;
    }
    assert.equal(played.cash, 63 + 3 * T.TASKS[id].pay);
    assert.equal(played.energy, 0);
    assert.equal(played.skills[id], 3);
    assert.equal(played.challenges[id].level, 3);
    assert.equal(T.dayPlan(played).phase, "choice");
    assert.throws(() => T.act(played, { type: "work", id }));
    assert.equal(T.valid(played), true);
  }
  assert.equal(T.valid({ ...old, challengeVersion: 3 }), false);
});
