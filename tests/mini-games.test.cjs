const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../mini-games.js");

function solveBooks(game) {
  let g = game;
  const books = [...g.books].sort((a, b) => a.pinyin.replaceAll(" ", "").localeCompare(b.pinyin.replaceAll(" ", ""), "en"));
  for (let i = 0; i < g.slots.length; i++) {
    const book = books[i];
    g = M.move(g, { type: "select", id: book.id });
    g = M.move(g, { type: "place", index: i });
  }
  assert.equal(g.won, false, "Placing books alone does not award completion");
  return M.move(g, { type: "check" });
}
test("books require full pinyin order; mistakes are recoverable and books cannot be duplicated", () => {
  let g = M.create("parcel", 1, () => 0.3);
  const original = structuredClone(g);
  const last = [...g.books].sort((a, b) => a.pinyin.localeCompare(b.pinyin, "en")).at(-1).id;
  g = M.move(g, { type: "select", id: last });
  g = M.move(g, { type: "place", index: 0 });
  g = M.move(g, { type: "select", id: last });
  g = M.move(g, { type: "place", index: 1 });
  assert.equal(g.slots[1], null, "A book cannot be duplicated");
  g = M.move(g, { type: "check" });
  assert.equal(g.won, false);
  assert.equal(g.mistakes, 1);
  assert.ok(g.errors.includes(0));
  g = M.move(g, { type: "place", index: 0 });
  g = solveBooks(g);
  assert.equal(g.won, true);
  assert.deepEqual(original.slots, Array(4).fill(null), "Moves do not mutate old state");
  assert.deepEqual(M.move(g, { type: "check" }), g, "Completed games are terminal");
});
test("book progression introduces shared initials, syllables and longer prefixes in shuffled solvable sets", () => {
  for (const random of [0, 0.3, 0.6, 0.999]) {
    for (const level of [1, 2, 3, 4, 5]) {
      const game = M.create("parcel", level, () => random);
      assert.equal(game.books.length, [4, 6, 6, 8, 9][level - 1]);
      assert.equal(new Set(game.books.map((b) => b.title)).size, game.books.length);
      assert.equal(new Set(game.books.map((b) => b.pinyin.replaceAll(" ", ""))).size, game.books.length);
      const firstLetters = game.books.map((b) => b.pinyin[0]);
      if (level === 1) assert.equal(new Set(firstLetters).size, game.books.length);
      else if (level === 2) assert.equal(firstLetters.filter((c) => c === "H").length, 2);
      else assert.ok(game.books.filter((b) => b.pinyin.startsWith("XIAO ")).length >= 3);
      if (level === 5) assert.equal(game.books.filter((b) => b.pinyin.startsWith("AI LI SI ")).length, 2);
      const solved = solveBooks(game);
      assert.equal(solved.won, true);
      assert.notDeepEqual(game.books.map((b) => b.id), solved.slots, "The tray never gives away the answer in order");
    }
  }
});
test("same-prefix titles compare later letters across shelf boundaries, ignoring syllable spaces", () => {
  const titles = ["西游记", "小王子", "小红帽", "爱丽丝梦游仙境", "爱丽丝镜中奇遇", "海底两万里"];
  const game = M.create("parcel", 2);
  game.books = titles.map((title, id) => ({ ...M.BOOKS.find((b) => b.title === title), id, paint: 0 }));
  game.slots = [4, 3, 5, 2, 1, 0];
  assert.equal(M.move(game, { type: "check" }).won, true);
  game.slots = [4, 3, 5, 1, 2, 0];
  const wrong = M.move(game, { type: "check" });
  assert.equal(wrong.won, false);
  assert.deepEqual(wrong.errors, [3, 4]);
  game.books.forEach((b) => { b.pinyin = b.pinyin.replaceAll(" ", "   "); });
  game.slots = [4, 3, 5, 2, 1, 0];
  assert.equal(M.move(game, { type: "check" }).won, true);
});
test("pinyin hints toggle without changing placement, difficulty or rewards", () => {
  let game = M.create("parcel", 3);
  game = M.move(game, { type: "select", id: game.books[0].id });
  const before = structuredClone(game);
  const shown = M.move(game, { type: "pinyin" });
  assert.equal(shown.showPinyin, true);
  assert.deepEqual({ ...shown, showPinyin: false }, before);
  assert.deepEqual(M.move(shown, { type: "pinyin" }), before);
});
test("water is shared and wasted water cannot be reclaimed; all advanced levels are solvable", () => {
  let g = M.create("garden", 2, () => 0.5);
  const capacity = g.tank;
  g = M.move(g, { type: "water", seconds: 100 });
  assert.equal(g.tank, capacity - 100);
  g = M.move(g, { type: "release" });
  assert.equal(g.dry, true);
  assert.equal(g.won, false);
  assert.equal(M.move(g, { type: "water", seconds: 10 }).tank, g.tank);
  for (const level of [2, 3, 4, 5]) {
    let game = M.create("garden", level, () => 0.5);
    for (const target of game.targets) {
      let low = 0, high = 5;
      for (let i = 0; i < 35; i++) {
        const middle = (low + high) / 2;
        const trial = M.move(game, { type: "water", seconds: middle });
        if (trial.water < target - game.drips) low = middle;
        else high = middle;
      }
      game = M.move(game, { type: "water", seconds: (low + high) / 2 });
      game = M.move(game, { type: "release" });
      assert.equal(game.dry, false);
    }
    assert.equal(game.won, true);
  }
});
test("variable water flow is frame-independent and runoff spends water only after pouring", () => {
  const initial = M.create("garden", 3, () => 0.5);
  const start = M.move(initial, { type: "water", seconds: 0.2 });
  const faster = M.move(start, { type: "water", seconds: 0.2 });
  assert.notEqual(start.water, faster.water - start.water);
  const whole = M.move(initial, { type: "water", seconds: 0.7 });
  let sliced = initial;
  for (let i = 0; i < 7; i++) sliced = M.move(sliced, { type: "water", seconds: 0.1 });
  assert.ok(Math.abs(whole.water - sliced.water) < 1e-8);
  const released = M.move(whole, { type: "release" });
  assert.equal(released.lastDrips, initial.drips);
  assert.ok(Math.abs(released.tank - (whole.tank - initial.drips)) < 1e-8);
  assert.equal(M.move(initial, { type: "release" }).lastDrips, 0);
  assert.equal(M.move(released, { type: "release" }).tank, released.tank);
  assert.equal(initial.water, 0);
  assert.equal(initial.holdTime, 0);
});
test("advanced watering must allow for runoff before releasing near the upper limit", () => {
  let g = M.create("garden", 4, () => 0.5);
  const upper = g.targets[0] + g.margin;
  const used = upper - 1;
  g = { ...g, water: used, tank: g.tank - used, holdTime: 1 };
  const stopped = M.move(g, { type: "release" });
  assert.equal(stopped.plant, 0);
  assert.ok(stopped.mistakes > 0);
  assert.equal(stopped.water, 0);
  assert.equal(stopped.lastDrips, 5);
  const practice = M.create("garden", 1, () => 0.5);
  const watered = M.move(practice, { type: "water", seconds: 0.5 });
  assert.equal(watered.water, practice.rate * 0.5);
  assert.equal(M.move(watered, { type: "release" }).tank, watered.tank);
});
test("advanced memory transforms sequences and replay counts toward adaptive support", () => {
  let g = M.create("craft", 3, () => 0.3);
  assert.deepEqual(g.rules, ["reverse", "skip", "forward"]);
  g.patterns = [[0, 1, 2, 3, 0], [1, 0, 1, 2, 3, 1], [3, 0, 1, 2, 3, 0, 1]];
  const answers = [[0, 3, 2, 1, 0], [0, 2, 3], [3, 0, 1, 2, 3, 0, 1]];
  for (const colors of answers) {
    g = M.move(g, { type: "show" });
    g = M.move(g, { type: "listen" });
    for (const color of colors) g = M.move(g, { type: "color", color });
  }
  assert.equal(g.won, true);
  const filtered = M.create("craft", 3, () => 0.3);
  assert.ok(filtered.patterns[1].some((color) => color !== 1), "Filtered rounds always have an answer");
  let replay = M.move(M.create("craft", 2), { type: "show" });
  replay = M.move(replay, { type: "listen" });
  replay = M.move(replay, { type: "show" });
  assert.equal(replay.assists, 1);
});
test("watering needs a controlled hold, not a click; overflow retries one plant", () => {
  let g = M.create("garden", 1, () => 0.5);
  g = M.move(g, { type: "release" });
  assert.equal(g.plant, 0);
  g = M.move(g, { type: "water", seconds: 0.1 });
  g = M.move(g, { type: "release" });
  assert.equal(g.plant, 0);
  assert.ok(g.water > 0);
  g = M.move(g, { type: "water", seconds: 10 });
  g = M.move(g, { type: "release" });
  assert.equal(g.water, 0);
  assert.equal(g.mistakes, 1);
  for (let i = 0; i < g.targets.length; i++) {
    g = M.move(g, { type: "water", seconds: g.targets[g.plant] / g.rate });
    g = M.move(g, { type: "release" });
    assert.equal(g.plant, i + 1);
    assert.equal(g.won, i === 2);
  }
  assert.deepEqual(M.move(g, { type: "release" }), g);
});
test("memory requires watching and recalling all rounds, and retries keep progress", () => {
  let g = M.create("craft", 1, () => 0.1);
  assert.equal(M.move(g, { type: "color", color: 0 }).input.length, 0);
  for (let round = 0; round < 3; round++) {
    const pattern = [...g.patterns[round]];
    g = M.move(g, { type: "show" });
    assert.equal(M.move(g, { type: "color", color: 0 }).input.length, 0);
    g = M.move(g, { type: "listen" });
    g = M.move(g, { type: "color", color: 1 });
    assert.equal(g.phase, "retry");
    assert.equal(g.round, round);
    g = M.move(g, { type: "show" });
    g = M.move(g, { type: "listen" });
    for (const color of pattern) g = M.move(g, { type: "color", color });
    assert.equal(g.round, round + 1);
    assert.equal(g.won, round === 2);
  }
  assert.equal(g.mistakes, 3);
});
