const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const strokes = [{ color: "#74728b", points: [[20, 30], [80, 90], [160, 70]] }];

test("a purchased notebook saves editable drawings without spending money, energy or the item", () => {
  const s = T.create(); s.owned = ["notebook"]; s.cash = 0; s.energy = 0;
  const output = T.act(s, { type: "sketch-save", id: "notebook", strokes });
  assert.deepEqual(output.state.sketches.notebook, strokes);
  assert.equal(output.state.cash, 0);
  assert.equal(output.state.energy, 0);
  assert.deepEqual(output.state.owned, ["notebook"]);
  assert.equal(output.result.joy, 2);
  assert.deepEqual(s.sketches, {});
  const restored = T.restore(JSON.parse(JSON.stringify(output.state)));
  assert.deepEqual(restored, output.state);
  assert.equal(T.valid(restored), true);
  const repeat = T.act(restored, { type: "sketch-save", id: "notebook", strokes });
  assert.equal(repeat.result.joy, 0);
  assert.deepEqual(repeat.state, restored);
  const erased = T.act(restored, { type: "sketch-save", id: "notebook", strokes: [] });
  assert.deepEqual(erased.state.sketches.notebook, []);
  assert.equal(erased.result.joy, 0);
});

test("drawing requires ownership and rejects malformed or excessive strokes atomically", () => {
  const s = T.create();
  assert.throws(() => T.act(s, { type: "sketch-save", id: "notebook", strokes }));
  s.owned = ["notebook"];
  for (const bad of [null, Array(41).fill(strokes[0]), [{ ...strokes[0], color: "invalid" }],
    [{ color: "#74728b", points: [[-1, 4]] }], [{ color: "#74728b", points: [[20, 211]] }],
    [{ color: "#74728b", points: Array(129).fill([1, 1]) }]]) {
    assert.throws(() => T.act(s, { type: "sketch-save", id: "notebook", strokes: bad }));
    assert.equal(T.valid({ ...s, sketches: { notebook: bad } }), false);
  }
  assert.deepEqual(s.sketches, {});
  const legacy = T.create(); delete legacy.sketches;
  assert.equal(T.valid(legacy), true);
  assert.deepEqual(T.restore(legacy).sketches, {});
});
