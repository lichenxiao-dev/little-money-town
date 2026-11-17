const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
const sizes = { cottage: 14, garden: 17, ocean: 14, space: 13 };

test("all completed coloring templates persist without consuming money, energy or crayons", () => {
  let s = T.create(); s.owned = ["crayons"]; s.cash = 0; s.energy = 0;
  for (const [id, size] of Object.entries(sizes)) {
    const colors = Array(size).fill("#ba9bda");
    s = T.act(s, { type: "coloring-save", id, colors }).state;
    colors[0] = "#ef9e88";
    assert.equal(s.colorings[id][0], "#ba9bda");
  }
  assert.equal(s.cash, 0);
  assert.equal(s.energy, 0);
  assert.equal(s.joy.points, 0);
  assert.deepEqual(s.owned, ["crayons"]);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
});

test("unfinished or invalid coloring cannot be saved; free pencils cannot save colored regions", () => {
  const s = T.create(), before = structuredClone(s);
  for (const [id, colors] of [["missing", Array(14).fill("#74728b")], ["cottage", Array(13).fill("#74728b")],
    ["cottage", Array(14).fill("invalid")], ["cottage", Array(14).fill("#ba9bda")], ["cottage", null]]) {
    assert.throws(() => T.act(s, { type: "coloring-save", id, colors }));
  }
  assert.deepEqual(s, before);
  const saved = T.act(s, { type: "coloring-save", id: "cottage", colors: Array(14).fill("#74728b") }).state;
  assert.equal(T.valid(saved), true);
  const legacy = T.create(); delete legacy.colorings;
  assert.deepEqual(T.restore(legacy).colorings, {});
});

test("coloring gifts preserve snapshots, reject duplicate recipients and survive reloads", () => {
  let s = T.create(); s.owned = ["crayons"];
  assert.throws(() => T.act(s, { type: "gift-sketch", id: "coloring:cottage", recipient: "Teacher" }));
  s = T.act(s, { type: "coloring-save", id: "cottage", colors: Array(14).fill("#ba9bda") }).state;
  s = T.act(s, { type: "gift-sketch", id: "coloring:cottage", recipient: " Teacher " }).state;
  assert.equal(s.gifts[0].recipient, "Teacher");
  assert.equal(s.joy.points, 2);
  assert.throws(() => T.act(s, { type: "gift-sketch", id: "coloring:cottage", recipient: "teacher" }));
  s = T.act(s, { type: "coloring-save", id: "cottage", colors: Array(14).fill("#ef9e88") }).state;
  assert.equal(s.gifts[0].coloring.colors[0], "#ba9bda");
  s = T.act(s, { type: "gift-sketch", id: "coloring:cottage", recipient: "Teacher" }).state;
  assert.equal(s.gifts.length, 2);
  assert.equal(s.gifts[1].coloring.colors[0], "#ef9e88");
  assert.equal(s.joy.points, 3);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
});
