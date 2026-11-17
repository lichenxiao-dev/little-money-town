const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../engine.js");
function onMonth(month) {
  const s = T.create(); s.calendar.startMonth = month;
  return s;
}

test("each fictional month offers staples plus a distinct stationery and snack pair", () => {
  for (let month = 1; month <= 12; month++) {
    const s = onMonth(month);
    const expected = month === 12 || month <= 2 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
    assert.equal(T.season(s).id, expected);
    for (const good of T.GOODS.filter((g) => !g.legacy)) {
      assert.equal(T.available(s, good.id), !good.month || good.month === month);
    }
    const specials = T.GOODS.filter((g) => g.month && T.available(s, g.id));
    assert.equal(specials.length, 2);
    assert.equal(specials.filter((g) => g.snack).length, 1);
    assert.equal(specials.filter((g) => g.category === "文具").length, 1);
    const nextMonth = onMonth(month % 12 + 1);
    assert.ok(specials.every((g) => !T.available(nextMonth, g.id)));
  }
  assert.equal(T.available(T.create(), "missing"), false);
});

test("off-month purchases reject the whole cart, while wishes and owned snacks survive", () => {
  let s = onMonth(9);
  s = T.act(s, { type: "wish-add", id: "sweet-potato" }).state;
  s = T.act(s, { type: "buy", ids: ["sweet-potato", "sweet-potato"] }).state;
  s.day = 28; s.necessities.paidDay = 28;
  s = T.act(s, { type: "next" }, () => 0.5).state;
  assert.equal(T.month(s), 10);
  assert.equal(T.available(s, "sweet-potato"), false);
  assert.deepEqual(s.wishlist, ["sweet-potato"]);
  const before = structuredClone(s);
  assert.throws(() => T.act(s, { type: "buy", ids: ["pencil", "sweet-potato"] }));
  assert.deepEqual(s, before);
  s = T.act(s, { type: "eat", id: "sweet-potato" }).state;
  assert.deepEqual(s.owned, ["sweet-potato"]);
  assert.equal(s.joy.points, 2);
  assert.equal(T.valid(s), true);
  assert.deepEqual(T.restore(JSON.parse(JSON.stringify(s))), s);
  s = T.act(s, { type: "buy", ids: ["pumpkin-pie"] }).state;
  assert.ok(s.owned.includes("pumpkin-pie"));
});

test("limited snacks use normal quantities, discounts and shared happiness limits", () => {
  let s = onMonth(9);
  s = T.act(s, { type: "buy", ids: ["sweet-potato", "sweet-potato", "sweet-potato", "cookie"] }).state;
  assert.equal(s.cash, 71);
  s = T.act(s, { type: "eat", id: "cookie" }).state;
  s = T.act(s, { type: "eat", id: "sweet-potato" }).state;
  s = T.act(s, { type: "eat", id: "sweet-potato" }).state;
  assert.equal(s.joy.points, 3);
  assert.deepEqual(s.owned, ["sweet-potato"]);
});

test("monthly countdown measures advances to removal, including the year boundary", () => {
  for (let startMonth = 1; startMonth <= 12; startMonth++) {
    const s = onMonth(startMonth);
    assert.equal(T.monthlySpecials(s).daysLeft, 28);
    s.day = 17;
    assert.equal(T.monthlySpecials(s).daysLeft, 12);
    s.day = 28; s.necessities.paidDay = 28;
    assert.equal(T.monthlySpecials(s).daysLeft, 1);
    const next = T.act(s, { type: "next" }, () => 0.5).state;
    assert.equal(T.month(next), startMonth % 12 + 1);
    assert.equal(T.monthlySpecials(next).daysLeft, 28);
    assert.deepEqual(T.monthlySpecials(T.restore(JSON.parse(JSON.stringify(next)))), T.monthlySpecials(next));
  }
});

test("monthly notebooks remain drawable and giftable after their month ends", () => {
  for (const good of T.GOODS.filter((g) => g.month && T.SKETCH_ITEMS.includes(g.id))) {
    let s = T.act(onMonth(good.month), { type: "buy", ids: [good.id] }).state;
    s.day = 28; s.necessities.paidDay = 28;
    s = T.act(s, { type: "next" }, () => 0.5).state;
    const strokes = [{ color: "#74728b", points: [[30, 30], [60, 60]] }];
    s = T.act(s, { type: "sketch-save", id: good.id, strokes }).state;
    s = T.act(s, { type: "gift-sketch", id: good.id, recipient: "朋友" }).state;
    assert.equal(T.valid(s), true);
    assert.deepEqual(T.restore(s).gifts[0].strokes, strokes);
  }
});
