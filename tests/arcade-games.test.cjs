const test = require("node:test");
const assert = require("node:assert/strict");
const { META, create, move } = require("../arcade-games.js");

function rng(seed = 91) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function ticks(game, duration) {
  for (let elapsed = 0; elapsed < duration && !game.won && !game.lost; elapsed += 100) {
    game = move(game, { type: "tick", ms: Math.min(100, duration - elapsed) });
  }
  return game;
}
function catchAll(game) {
  while (!game.won && !game.lost) {
    const item = game.deliveries[game.item];
    const x = item.kind === "damaged" ? item.x < 50 ? 93 : 7 : item.x;
    game = move(game, { type: "basket", x });
    game = ticks(game, game.duration);
  }
  return game;
}
function popAll(game) {
  while (!game.won && !game.lost) {
    game = ticks(game, 100);
    for (const balloon of game.balloons) {
      const fraction = (game.elapsed - balloon.start) / balloon.flight;
      if (!balloon.popped && fraction >= 0.2 && fraction < 0.8) game = move(game, { type: "pop", id: balloon.id });
    }
  }
  return game;
}
function digAll(game) {
  for (const index of game.path.slice(1)) game = move(game, { type: "dig", index });
  assert.equal(game.won, false, "Seeds must be delivered back to the entrance");
  for (const index of game.path.slice(0, -1).reverse()) game = move(game, { type: "dig", index });
  return game;
}
const solve = { catcher: catchAll, balloons: popAll, digging: digAll };

test("all five levels are deterministic, serializable and achievable across seeds", () => {
  for (const id of Object.keys(META)) {
    for (let level = 1; level <= 5; level++) {
      for (let seed = 0; seed < 12; seed++) {
        const game = create(id, level, rng(seed));
        assert.deepEqual(game, create(id, level, rng(seed)));
        assert.deepEqual(JSON.parse(JSON.stringify(game)), game);
        const result = solve[id](game);
        assert.equal(result.won, true, `${id} level ${level} seed ${seed}`);
        assert.equal(result.lost, false);
        assert.equal(result.mistakes, 0);
      }
    }
  }
});

test("move clones inputs, rejects invalid controls and keeps terminal wins inert", () => {
  const invalid = [
    null, {}, { type: "tick", ms: -1 }, { type: "tick", ms: NaN },
    { type: "basket", x: Infinity }, { type: "basket", x: "20" }, { type: "basket", x: 101 },
    { type: "step", direction: 0 }, { type: "pop", id: "missing" },
    { type: "dig", index: -1 }, { type: "dig", index: 0.5 }
  ];
  for (const id of Object.keys(META)) {
    const game = create(id, 3, rng());
    const before = structuredClone(game);
    for (const action of invalid) assert.deepEqual(move(game, action), before);
    const won = solve[id](game);
    for (const action of [...invalid, { type: "tick", ms: 100 }, { type: "scan" }, { type: "basket", x: 10 }]) {
      const result = move(won, action);
      assert.deepEqual(result, won);
      assert.notEqual(result, won);
    }
    assert.deepEqual(game, before);
  }
  assert.throws(() => create("missing", 1), RangeError);
  for (const level of [0, 6, 1.2, "1", NaN]) assert.throws(() => create("catcher", level), RangeError);
  assert.throws(() => create("digging", 1, () => 1), RangeError);
});

test("delivery misses and damaged parcels matter; opportunities are finite", () => {
  let game = create("catcher", 1, rng());
  while (!game.lost) {
    const item = game.deliveries[game.item];
    const x = item.kind === "damaged" ? item.x : item.x < 50 ? 93 : 7;
    game = move(game, { type: "basket", x });
    game = ticks(game, game.duration);
  }
  assert.equal(game.won, false);
  assert.equal(game.score, 0);
  assert.ok(game.mistakes > 0);
  assert.equal(game.item, game.deliveries.length);
  assert.deepEqual(move(game, { type: "basket", x: 50 }), game);
  game = create("catcher", 5, rng());
  while (!game.lost) {
    const item = game.deliveries[game.item];
    game = move(game, { type: "basket", x: item.kind === "damaged" ? item.x : item.x < 50 ? 93 : 7 });
    game = ticks(game, game.duration);
  }
  assert.equal(game.lives, 0);
  assert.ok(game.item < game.deliveries.length);
});

test("higher-value balloons fly faster and idle play loses only when the timer ends", () => {
  for (let level = 1; level <= 5; level++) {
    let game = create("balloons", level, () => 0);
    const flights = [1, 2, 3].map((points) => game.balloons.find((b) => b.points === points).flight);
    assert.ok(flights[0] > flights[1] && flights[1] > flights[2]);
    const future = game.balloons.find((b) => b.start > 0);
    assert.deepEqual(move(game, { type: "pop", id: future.id }), game);
    game = ticks(game, game.duration - 1);
    assert.equal(game.lost, false);
    game = ticks(game, 1);
    assert.equal(game.lost, true);
    assert.equal(game.score, 0);
    assert.deepEqual(move(game, { type: "pop", id: game.balloons[0].id }), game);
  }
});

test("balloons award their own value once, reject departed targets and judge the final total", () => {
  let game = create("balloons", 1, rng());
  game = ticks(game, 1000);
  const balloon = game.balloons[0];
  const before = structuredClone(game);
  game = move(game, { type: "pop", id: balloon.id });
  assert.equal(game.score, balloon.points);
  assert.equal(before.balloons[0].popped, false);
  assert.deepEqual(move(game, { type: "pop", id: balloon.id }), game);
  const departed = ticks(before, balloon.flight);
  assert.deepEqual(move(departed, { type: "pop", id: balloon.id }), departed);
  while (game.score < game.goal) {
    game = ticks(game, 100);
    for (const b of game.balloons) {
      const fraction = (game.elapsed - b.start) / b.flight;
      if (fraction >= 0.2 && fraction < 0.8) game = move(game, { type: "pop", id: b.id });
    }
  }
  assert.equal(game.won, false, "Reaching the target early leaves time to improve the score");
  game = ticks(game, game.duration - game.elapsed);
  assert.equal(game.won, true);
});

test("digging clues form a connected affordable route, scanning is finite, and off-route work costs budget", () => {
  for (let level = 1; level <= 5; level++) {
    let game = create("digging", level, rng());
    assert.ok(game.budget >= game.path.length - 1);
    assert.equal(game.cells.filter((c) => c.seed).length, game.goal);
    const before = structuredClone(game);
    game = move(game, { type: "scan" });
    assert.equal(game.scanned, level === 1);
    if (level > 1) assert.ok(Number.isInteger(game.hint));
    assert.equal(game.assists, level === 1 ? 0 : 1);
    assert.equal(game.budget, before.budget);
    assert.deepEqual(move(game, { type: "scan" }), game);
    assert.deepEqual(move(game, { type: "dig", index: game.entry }), game);
    assert.deepEqual(move(game, { type: "dig", index: game.path.at(-1) }), game);
    assert.deepEqual(move(game, { type: "dig", index: game.cells.length }), game);
  }
  let foundLoss = false;
  for (let seed = 0; seed < 50 && !foundLoss; seed++) {
    let game = create("digging", 5, rng(seed));
    while (!game.lost && !game.won) {
      const available = game.cells.map((cell, index) => ({ cell, index })).filter(({ cell, index }) => {
        if (cell.rock || cell.seed) return false;
        const w = game.width;
        return [index % w ? index - 1 : -1, index % w < w - 1 ? index + 1 : -1, index - w, index + w]
          .some((n) => n === game.position);
      });
      if (!available.length) break;
      const index = available.find((a) => !game.path.includes(a.index))?.index ?? available[0].index;
      const previous = game;
      game = move(game, { type: "dig", index });
      const cost = previous.cells[index].open ? 1 : previous.cells[index].hardness;
      assert.equal(game.budget, cost <= previous.budget ? previous.budget - cost : previous.budget);
    }
    if (game.lost) {
      foundLoss = true;
      assert.ok(game.budget < 2);
      assert.ok(game.mistakes > 0);
      assert.deepEqual(move(game, { type: "scan" }), game);
    }
  }
  assert.equal(foundLoss, true, "wasting digs can exhaust the budget");
});

test("large background frame deltas are capped, and challenge settings increase across five levels", () => {
  for (const id of ["catcher", "balloons"]) {
    const game = create(id, 1, rng());
    const next = move(game, { type: "tick", ms: 600000 });
    assert.equal(next.elapsed, 100);
    assert.equal(game.elapsed, 0);
    for (let level = 2; level <= 5; level++) {
      const previous = create(id, level - 1, rng());
      const current = create(id, level, rng());
      assert.ok(current.goal > previous.goal);
      if (id === "catcher") assert.ok(current.duration < previous.duration);
      else assert.ok(current.balloons.find((b) => b.points === 1).flight < previous.balloons.find((b) => b.points === 1).flight);
    }
  }
  const difficulties = Array.from({ length: 5 }, (_, index) => create("digging", index + 1, rng()));
  for (let i = 1; i < difficulties.length; i++) {
    assert.ok(difficulties[i].width >= difficulties[i - 1].width);
    assert.ok(difficulties[i].goal >= difficulties[i - 1].goal);
    assert.ok(difficulties[i].budget - 2 * (difficulties[i].path.length - 1) < difficulties[i - 1].budget - 2 * (difficulties[i - 1].path.length - 1));
  }
});
