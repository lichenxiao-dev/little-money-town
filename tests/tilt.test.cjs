const test = require("node:test");
const assert = require("node:assert/strict");
const { screenTilt } = require("../arcade-games.js");

test("tilt follows screen-right in both portrait and landscape orientations", () => {
  for (const [angle, beta, gamma] of [[0, 0, 15], [90, 15, 0], [180, 0, -15], [270, -15, 0], [-90, -15, 0]]) {
    assert.ok(Math.abs(screenTilt(beta, gamma, angle) - 15) < 1e-8);
    assert.ok(Math.abs(screenTilt(-beta, -gamma, angle) + 15) < 1e-8);
  }
});

test("Euler wraparound does not reverse or throw the basket across the screen", () => {
  assert.ok(Math.abs(screenTilt(179, 0, 90) - screenTilt(-179, 0, 90)) < 3);
  for (const angle of [0, 90, 180, 270]) {
    assert.ok(Math.abs(screenTilt(100, 89, angle) - screenTilt(80, -89, angle)) < 1e-8);
  }
});
