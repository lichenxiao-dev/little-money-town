const { chromium, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const T = require("../engine.js");

async function main() {
  const server = spawn(process.execPath, ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: "4178" }, stdio: ["ignore", "pipe", "pipe"] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
      server.once("error", (error) => { clearTimeout(timeout); reject(error); });
      server.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
      server.stdout.once("data", () => { clearTimeout(timeout); resolve(); });
    });
    const executablePath = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(fs.existsSync);
    browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4178");
    async function load(energy) {
      const state = T.create(); state.energy = energy; state.guide.paused = true;
      await page.evaluate((s) => localStorage.setItem("little-money-town-v1", JSON.stringify(s)), state);
      await page.reload();
    }
    for (const width of [320, 390, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const energy of [3, 2, 1, 0]) {
        await load(energy);
        await expect(page.locator("#energy-card")).toBeInViewport();
        await expect(page.locator("#energy-card")).toContainText("精力");
        await expect(page.locator("#energy")).toHaveText(`${energy}/3`);
        await expect(page.locator("#energy")).toHaveAttribute("aria-label", `精力 ${energy}，最多 3`);
        await expect(page.locator(".energy-track .filled")).toHaveCount(energy);
        await expect(page.locator("#energy-hint")).toHaveText(energy ? "明天补满" : "用完啦 · 明天恢复");
        assert.ok(await page.locator("#energy-card").evaluate((el) => el.scrollWidth <= el.clientWidth), "Energy card must not overflow");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Page must fit viewport");
      }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await load(1);
    await page.locator("#more-places").click();
    await page.locator('[data-destination="stall"]').click();
    await page.locator('[data-action="stall"]').click();
    await page.locator('[data-action="confirm"]').click();
    await page.locator("#close-modal").click();
    await expect(page.locator("#energy")).toHaveText("0/3");
    await expect(page.locator(".energy-track .filled")).toHaveCount(0);
    await expect(page.locator("#energy-hint")).toHaveText("用完啦 · 明天恢复");
    await page.locator("#next-day").click();
    await page.locator('[data-action="confirm"]').click();
    await page.locator("#close-modal").click();
    await expect(page.locator("#energy")).toHaveText("3/3");
    await expect(page.locator(".energy-track .filled")).toHaveCount(3);
    await page.reload();
    await expect(page.locator("#energy")).toHaveText("3/3");
    assert.deepEqual(errors, []);
    console.log("Energy visibility browser checks passed.");
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
