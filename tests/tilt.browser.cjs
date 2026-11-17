const { chromium, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const T = require("../engine.js");

async function main() {
  const server = spawn(process.execPath, ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: "4176" }, stdio: ["ignore", "pipe", "pipe"] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
      server.once("error", (error) => { clearTimeout(timer); reject(error); });
      server.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
      server.stdout.once("data", () => { clearTimeout(timer); resolve(); });
    });
    const executablePath = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(fs.existsSync);
    browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { headless: true });
    for (const [touch, permission] of [[true, "granted"], [true, "denied"], [true, "pending"], [false, "granted"]]) {
      const context = await browser.newContext({ hasTouch: touch, isMobile: touch, viewport: { width: 820, height: 1180 } });
      const page = await context.newPage(), errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((permission) => {
        window.permissionCalls = [];
        window.DeviceOrientationEvent = { requestPermission() {
          window.permissionCalls.push(navigator.userActivation.isActive);
          return permission === "pending" ? new Promise((resolve) => { window.resolveTilt = resolve; }) : Promise.resolve(permission);
        } };
      }, permission);
      await page.goto("http://127.0.0.1:4176");
      const saved = T.create(); saved.day = 6; saved.guide.paused = true;
      await page.evaluate((state) => localStorage.setItem("little-money-town-v1", JSON.stringify(state)), saved);
      await page.reload();
      await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
      await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
      assert.deepEqual(await page.evaluate(() => window.permissionCalls), []);
      if (touch) await page.locator("#daily-start").tap();
      else await page.locator("#daily-start").click();
      await expect(page.locator(".arcade-root")).toBeVisible();
      await expect(page.locator(".arcade-board")).toBeFocused();
      await expect(page.locator('.arcade-controls [data-arcade="tilt"]')).toHaveCount(0);
      await expect(page.locator('[data-arcade="tilt"]')).toBeHidden();
      assert.deepEqual(await page.evaluate(() => window.permissionCalls), touch ? [true] : [], "Permission is requested only by starting the game on a touch device");
      const basket = () => page.locator('[data-arcade="basket"]').evaluate((el) => parseFloat(el.style.left));
      const orient = (gamma) => page.evaluate((gamma) => {
        const event = new Event("deviceorientation");
        Object.assign(event, { beta: 0, gamma });
        window.dispatchEvent(event);
      }, gamma);
      if (touch && permission === "granted") {
        await expect(page.locator('[data-arcade="tilt"]')).toHaveAttribute("aria-pressed", "true");
        await orient(0); await orient(10);
        assert.ok(await basket() > 50);
        await page.locator('[data-arcade="pause"]').tap();
        const paused = await basket();
        await orient(-20); await page.clock.runFor(1000);
        assert.equal(await basket(), paused);
        await page.locator('[data-arcade="pause"]').tap();
        await orient(-20);
        assert.equal(await basket(), paused, "Resuming recalibrates without a jump");
        await orient(-30);
        assert.ok(await basket() < paused);
      } else if (permission === "pending") {
        const progress = await page.locator('[data-arcade="delivery"]').getAttribute("style");
        await page.clock.runFor(10000);
        assert.equal(await page.locator('[data-arcade="delivery"]').getAttribute("style"), progress, "The permission dialog cannot consume playing time");
      } else {
        await orient(0); await orient(20);
        assert.equal(await basket(), 50);
        await page.locator('[data-arcade="right"]').click();
        assert.ok(await basket() > 50, "Denied or unavailable tilt leaves manual controls usable");
      }
      if (permission !== "pending") {
        await page.locator(".arcade-board").focus();
        const start = await basket();
        await page.keyboard.press("ArrowLeft");
        assert.equal(await basket(), Math.max(7, start - 8));
        await page.keyboard.press("d");
        const beforeHold = await basket();
        await page.keyboard.down("a");
        await page.clock.runFor(500);
        assert.ok(await basket() < beforeHold, "Holding A moves continuously");
        await page.keyboard.up("a");
        const released = await basket();
        await orient(0); await page.clock.runFor(100);
        assert.equal(await basket(), released, "Releasing stops movement and recalibrates tilt");
        await page.keyboard.press("Space");
        await expect(page.locator(".arcade-root")).toHaveAttribute("data-state", "paused");
        await page.keyboard.press("ArrowRight"); await page.clock.runFor(300);
        assert.equal(await basket(), released);
        await page.keyboard.press("Space");
        await expect(page.locator(".arcade-root")).toHaveAttribute("data-state", "playing");
      }
      await page.locator("#close-modal").click();
      if (permission === "pending") await page.evaluate(() => window.resolveTilt("granted"));
      await orient(0); await orient(20); await page.clock.runFor(10000);
      await expect(page.locator("#modal")).not.toBeVisible();
      await expect(page.locator("#cash")).toHaveText("100");
      if (!touch) {
        await page.locator("#choose-challenge").click();
        await page.locator('[data-action="task"][data-id="balloons"]').click();
        await expect(page.locator("[data-balloon]").first()).toBeFocused();
        await page.clock.runFor(1000);
        const target = page.locator('[data-balloon][aria-disabled="false"]').first();
        const number = await target.getAttribute("data-number");
        const points = Number(await target.getAttribute("data-points"));
        await page.keyboard.press(number);
        await expect(page.locator(".arcade-progress")).toHaveText(`${points} / 18`);
        await page.locator("#close-modal").click();
        await page.locator("#choose-challenge").click();
        await page.locator('[data-action="task"][data-id="digging"]').click();
        await expect(page.locator('[data-cell][data-player="true"]')).toBeFocused();
        const current = Number(await page.locator('[data-player="true"]').getAttribute("data-cell"));
        const next = Number(await page.locator('[data-cell][data-available="true"]').first().getAttribute("data-cell"));
        const key = next === current + 1 ? "ArrowRight" : next === current - 1 ? "ArrowLeft" : next > current ? "ArrowDown" : "ArrowUp";
        await page.keyboard.press(key);
        await expect(page.locator(`[data-cell="${next}"]`)).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.locator(`[data-cell="${next}"]`)).toHaveAttribute("data-player", "true");
        await page.locator("#close-modal").click();
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log("Automatic tablet tilt: start-gesture permission, denial fallback, pause/recalibration and teardown passed.");
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
