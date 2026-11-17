const { chromium, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const T = require("../engine.js");

async function main() {
  const server = spawn(process.execPath, ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: "4177" }, stdio: ["ignore", "pipe", "pipe"] });
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
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4177");
    let s = T.create(); s.guide.paused = true;
    const act = (action) => { s = T.act(s, action, () => 0.5).state; };
    act({ type: "work", id: "parcel", performance: { level: 2, mistakes: 0, assists: 0, stars: 3 } });
    act({ type: "buy", ids: ["cookie"] });
    act({ type: "save", amount: 20 });
    act({ type: "invest", id: "bakery" });
    act({ type: "stall", starter: false });
    act({ type: "stall-menu", id: "warmMilk", enabled: true });
    act({ type: "stall-stock", ingredient: "milk", quantity: 3 });
    act({ type: "next" });
    await page.evaluate((state) => localStorage.setItem("little-money-town-v1", JSON.stringify(state)), s);
    await page.reload();
    for (const viewport of [{ width: 320, height: 740 }, { width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
      await page.setViewportSize(viewport);
      await page.locator(".journal-shortcut").click();
      await expect(page.locator("#daily-ledger")).toBeVisible();
      await expect(page.locator("#daily-income")).toHaveText("0");
      await expect(page.locator('[data-action="journal-day"][data-day="3"]')).toBeDisabled();
      await page.locator('[data-action="journal-day"][data-day="1"]').click();
      await expect(page.locator(".ledger-day-nav")).toContainText("9 月 1 日");
      await expect(page.locator("#daily-income")).toHaveText("22");
      await expect(page.locator("#daily-spending")).toHaveText("36");
      await expect(page.locator("#daily-net")).toHaveText("-14");
      await expect(page.locator('[data-action="journal-day"][data-day="0"]')).toBeDisabled();
      assert.ok(await page.locator("#modal").evaluate((el) => el.scrollWidth <= el.clientWidth + 1), "Ledger fits each viewport");
      await page.locator("#daily-transactions > summary").click();
      await expect(page.locator("#daily-transactions")).toContainText("收入 12 · 花销 2");
      await page.locator("#daily-money-moves > summary").click();
      await expect(page.locator("#daily-money-moves")).toContainText("存入银行 20 币");
      await expect(page.locator("#daily-money-moves")).toContainText("买入股份 10 币");
      await page.locator('[data-action="journal-tab"][data-tab="assets"]').click();
      await expect(page.locator("#asset-total")).toBeVisible();
      await expect(page.locator("#daily-ledger")).toBeHidden();
      await page.locator("#scene-back").click();
      await expect(page.locator("#modal")).not.toBeVisible();
    }
    await page.reload();
    await page.locator(".journal-shortcut").click();
    await page.locator('[data-action="journal-day"][data-day="1"]').click();
    await expect(page.locator("#daily-income")).toHaveText("22");
    await page.locator("#scene-back").click();
    delete s.dailyLedger;
    await page.evaluate((state) => localStorage.setItem("little-money-town-v1", JSON.stringify(state)), s);
    await page.reload();
    await page.locator(".journal-shortcut").click();
    await expect(page.locator("#daily-incomplete")).toBeVisible();
    assert.deepEqual(errors, []);
    console.log("Daily ledger browser checks passed.");
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
