const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const act = (s, action) => T.act(s, action, () => 0.5);

test("snacks give visible diminishing joy, not extra money or energy; price gives no advantage", () => {
  for (const id of ["cookie", "cake"]) {
    const s = T.create();
    s.owned = [id];
    const output = act(s, { type: "eat", id });
    assert.equal(output.result.joy, 2);
    assert.equal(output.state.joy.points, 2);
    assert.equal(output.state.cash, s.cash);
    assert.equal(output.state.energy, s.energy);
    assert.deepEqual(output.state.finance, s.finance);
    assert.deepEqual(output.state.owned, []);
    assert.equal(s.owned.length, 1);
  }
  let s = T.create();
  s.owned = ["cookie", "cake", "milk", "cookie"];
  for (const [id, gain] of [["cookie", 2], ["cake", 1], ["milk", 0], ["cookie", 0]]) {
    const output = act(s, { type: "eat", id });
    assert.equal(output.result.joy, gain);
    s = output.state;
  }
  assert.equal(s.joy.points, 3);
  assert.equal(s.joy.moments.length, 2);
  assert.deepEqual(s.owned, []);
  const before = structuredClone(s);
  assert.throws(() => act(s, { type: "eat", id: "cookie" }));
  assert.deepEqual(s, before);
});

test("free activities work with no money or energy; toy ownership and per-activity rewards are enforced", () => {
  let s = T.create(); s.cash = 0; s.energy = 0;
  for (const id of ["draw"]) {
    for (const gain of [2, 1, 0]) {
      const output = act(s, { type: "enjoy", id });
      assert.equal(output.result.joy, gain);
      s = output.state;
    }
  }
  assert.equal(s.joy.points, 3);
  assert.equal(s.cash, 0);
  assert.equal(s.energy, 0);
  assert.equal(s.day, 1);
  for (const id of ["ball", "stars", "bubbles", "missing", "__proto__"]) assert.throws(() => act(s, { type: "enjoy", id }));
  s.owned = ["ball", "telescope"];
  for (const id of ["ball", "stars"]) s = act(s, { type: "enjoy", id }).state;
  assert.equal(s.joy.points, 7);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  s.energy = 3;
  const worked = act(s, { type: "work", id: "parcel" }).state;
  assert.equal(worked.cash, 10);
  assert.equal(worked.energy, 2);
  assert.equal(worked.joy.points, s.joy.points + 2);
  assert.equal(worked.joy.counts.help, 1);
  assert.deepEqual(worked.joy.moments.slice(0, -1), s.joy.moments);
});

test("free and paid celebrations give equal joy and cannot be claimed twice", () => {
  for (const choice of ["card", "party"]) {
    const s = T.create(); s.day = 93;
    const output = act(s, { type: "event", choice });
    assert.equal(output.result.joy, 3);
    assert.equal(output.state.joy.points, 3);
    assert.equal(output.state.cash, choice === "card" ? 100 : 85);
    assert.throws(() => act(output.state, { type: "event", choice }));
  }
});

test("finishing different helping tasks shares a daily joy allowance and resets the next day", () => {
  let s = T.create();
  for (const [id, gain] of [["parcel", 2], ["garden", 1], ["cashier", 0]]) {
    const output = act(s, { type: "work", id });
    assert.equal(output.result.joy, gain);
    s = output.state;
    assert.equal(T.valid(s), true);
  }
  assert.equal(s.joy.points, 3);
  assert.equal(s.joy.moments.length, 2);
  const before = structuredClone(s);
  assert.throws(() => act(s, { type: "work", id: "parcel" }));
  assert.deepEqual(s, before);
  s = act(s, { type: "next" }).state;
  assert.equal(s.joy.memories[0].points, 3);
  assert.equal(act(s, { type: "work", id: "parcel" }).result.joy, 2);
});

test("sharing a real drawing gives independent joy and preserves the friend's copy", () => {
  let s = T.create(); s.cash = 0; s.energy = 0; s.owned = ["notebook"];
  const strokes = [{ color: "#74728b", points: [[20, 20], [100, 100]] }];
  const before = structuredClone(s);
  assert.throws(() => act(s, { type: "gift-sketch", id: "notebook", recipient: "妈妈" }));
  assert.deepEqual(s, before);
  s = act(s, { type: "sketch-save", id: "notebook", strokes }).state;
  for (const [recipient, gain] of [["妈妈", 2], ["老师", 1]]) {
    const output = act(s, { type: "gift-sketch", id: "notebook", recipient });
    assert.equal(output.result.joy, gain);
    s = output.state;
    assert.throws(() => act(s, { type: "gift-sketch", id: "notebook", recipient }));
  }
  assert.equal(s.joy.points, 5);
  assert.equal(s.cash, 0); assert.equal(s.energy, 0);
  assert.deepEqual(s.owned, ["notebook"]);
  const newDrawing = [{ ...strokes[0], points: [[30, 30], [120, 100]] }];
  s = act(s, { type: "sketch-save", id: "notebook", strokes: newDrawing }).state;
  const third = act(s, { type: "gift-sketch", id: "notebook", recipient: "妈妈" });
  assert.equal(third.result.joy, 0);
  s = act(third.state, { type: "sketch-save", id: "notebook", strokes: [] }).state;
  assert.deepEqual(s.gifts[0].strokes, strokes);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  assert.equal(T.valid(s), true);
  assert.equal(T.valid({ ...s, gifts: [{ ...s.gifts[0], recipient: "" }] }), false);
  assert.equal(T.valid({ ...s, gifts: [{ ...s.gifts[0], strokes: [] }] }), false);
  const legacy = T.create(); delete legacy.gifts;
  assert.equal(T.valid(legacy), true);
  assert.deepEqual(T.restore(legacy).gifts, []);
});

test("gift names are validated and old animal-recipient gifts retain their artwork", () => {
  const s = T.create(); s.owned = ["notebook"];
  s.sketches.notebook = [{ color: "#74728b", points: [[1, 1], [10, 10]] }];
  for (const recipient of ["", "   ", "\n", "a\nb", "a".repeat(21), null, 12]) {
    assert.throws(() => act(s, { type: "gift-sketch", id: "notebook", recipient }));
  }
  const gift = act(s, { type: "gift-sketch", id: "notebook", recipient: "  Teacher  " }).state;
  assert.equal(gift.gifts[0].recipient, "Teacher");
  assert.throws(() => act(gift, { type: "gift-sketch", id: "notebook", recipient: "teacher" }));
  const legacy = structuredClone(s);
  legacy.gifts = [{ day: 1, item: "notebook", friend: "deer", strokes: s.sketches.notebook }];
  assert.equal(T.valid(legacy), true);
  const restored = T.restore(legacy);
  assert.equal(restored.gifts[0].recipient, "小鹿");
  assert.equal(restored.gifts[0].friend, undefined);
  assert.deepEqual(restored.gifts[0].strokes, s.sketches.notebook);
  assert.equal(T.valid(restored), true);
  assert.deepEqual(T.restore(restored), restored);
});

test("daily memories preserve experiences, reset rewards only on advancing, and retain seven days", () => {
  let s = T.create(); s.day = 93;
  s.owned = ["cookie", "cookie", "cookie", "cookie", "ball", "telescope"];
  for (let i = 0; i < 3; i++) s = act(s, { type: "eat", id: "cookie" }).state;
  for (const id of Object.keys(T.PASTIMES)) {
    for (let i = 0; i < 3; i++) s = act(s, { type: "enjoy", id }).state;
  }
  s = act(s, { type: "event", choice: "card" }).state;
  assert.equal(s.joy.points, 15);
  assert.equal(s.joy.moments.length, 9);
  assert.equal(T.valid(s), true);
  const output = act(s, { type: "next" });
  assert.equal(output.result.joy.points, 15);
  assert.deepEqual(output.result.joy.moments, s.joy.moments);
  s = output.state;
  assert.equal(s.joy.points, 0);
  assert.deepEqual(s.joy.counts, {});
  assert.deepEqual(s.joy.moments, []);
  assert.equal(s.joy.memories[0].day, 93);
  const snack = act(s, { type: "eat", id: "cookie" });
  assert.equal(snack.result.joy, 2);
  s = snack.state;
  for (let i = 0; i < 8; i++) {
    if (T.expense(s).due) s = act(s, { type: "expense", choice: 0 }).state;
    s = act(s, { type: "next" }).state;
  }
  assert.equal(s.joy.memories.length, 7);
  assert.equal(s.joy.memories[0].day, s.day - 7);
  assert.equal(s.joy.memories.at(-1).points, 0);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(s), s);
  s.day += (4 - s.day % 4) % 4;
  const before = structuredClone(s);
  assert.throws(() => act(s, { type: "next" }));
  assert.deepEqual(s, before);
});

test("legacy saves gain a blank joy record without backdating, and corrupt joy data is rejected", () => {
  const old = T.create(); delete old.joy;
  old.cash = 42; old.savings = 10; old.owned = ["cookie"];
  assert.equal(T.valid(old), true);
  const s = T.restore(old);
  assert.equal(s.joy.points, 0);
  assert.deepEqual(s.joy.memories, []);
  const { joy, ...rest } = s;
  assert.deepEqual(rest, old);
  assert.deepEqual(T.restore(s), s);
  for (const bad of [null, { ...joy, points: 2 }, { ...joy, counts: { missing: 1 } }, { ...joy, moments: [null] },
    { ...joy, memories: [{ day: 1, date: "game-1-09-01", points: 0, moments: [] }] }]) {
    assert.equal(T.valid({ ...s, joy: bad }), false);
  }
});

test("retired bubble rewards and memories remain readable but cannot earn more points", () => {
  const old = T.create(); old.day = 2; old.shareLocks.day = 2; old.cash = 104;
  const moments = ["snack", "draw", "bubbles", "ball", "stars"].flatMap((label) => [{ label, icon: "😊", gain: 2 }, { label, icon: "😊", gain: 1 }]);
  moments.push({ label: "生日", icon: "🎂", gain: 3 });
  old.joy = {
    points: 18, counts: { snack: 2, draw: 2, bubbles: 2, ball: 2, stars: 2, event: 1 }, moments,
    memories: [{ day: 1, date: "game-1-09-01", points: 18, moments: structuredClone(moments) }]
  };
  assert.equal(T.valid(old), true);
  assert.deepEqual(T.restore(old), old);
  assert.throws(() => act(old, { type: "enjoy", id: "bubbles" }));
  assert.throws(() => T.joyReward(old, "bubbles"));
  const next = act(old, { type: "next" });
  assert.equal(next.result.joy.points, 18);
  assert.equal(next.state.cash, 104);
  assert.equal(next.state.joy.points, 0);
  assert.equal(next.state.joy.memories.length, 2);
  assert.equal(T.valid(next.state), true);
});
