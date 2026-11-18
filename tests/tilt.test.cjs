const test = require("node:test");
const assert = require("node:assert/strict");
const { tiltOffset } = require("../arcade-games.js");
const zero = { alpha: 0, beta: 0, gamma: 0 };

test("tilt follows screen-right in both portrait and landscape orientations", () => {
  for (const [angle, beta, gamma] of [[0, 0, 15], [90, 15, 0], [180, 0, -15], [270, -15, 0], [-90, -15, 0]]) {
    assert.ok(Math.abs(tiltOffset(zero, { alpha: 0, beta, gamma }, angle) - 15) < 1e-8);
    assert.ok(Math.abs(tiltOffset(zero, { alpha: 0, beta: -beta, gamma: -gamma }, angle) + 15) < 1e-8);
  }
});

test("small left and right movements stay symmetric with flat or upright holding poses", () => {
  for (const beta of [0, 45, 70, 85, 90, 110]) {
    for (const gamma of [-30, 0, 30]) {
      const center = { alpha: 25, beta, gamma };
      for (const delta of [-12, -5, 5, 12]) {
        assert.ok(Math.abs(tiltOffset(center, { ...center, gamma: gamma + delta }, 0) - delta) < 1e-8);
      }
    }
  }
});

test("landscape movement is relative to the tablet, not flattened by its holding angle", () => {
  const center = { alpha: 0, beta: 0, gamma: 60 };
  for (const degrees of [-12, -5, 5, 12]) {
    const d = degrees * Math.PI / 180, pitch = Math.PI / 3;
    const current = {
      alpha: Math.atan2(-Math.sin(pitch) * Math.sin(d), Math.cos(d)) * 180 / Math.PI,
      beta: Math.asin(Math.cos(pitch) * Math.sin(d)) * 180 / Math.PI,
      gamma: Math.atan2(Math.sin(pitch), Math.cos(pitch) * Math.cos(d)) * 180 / Math.PI
    };
    assert.ok(Math.abs(tiltOffset(center, current, 90) - degrees) < 1e-8);
  }
});

test("heading and pitch wraparound take the short relative rotation", () => {
  assert.ok(Math.abs(tiltOffset({ ...zero, beta: 179 }, { ...zero, beta: -179 }, 90) - 2) < 1e-8);
  assert.ok(Math.abs(tiltOffset({ ...zero, alpha: 359, beta: 90 }, { ...zero, alpha: 1, beta: 90 }, 0) - 2) < 1e-8);
});
