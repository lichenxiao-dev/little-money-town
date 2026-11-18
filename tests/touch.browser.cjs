const { chromium, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const T = require("../engine.js");

async function main() {
  const server = spawn(process.execPath, ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: "4179" }, stdio: ["ignore", "pipe", "pipe"] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
      server.once("error", (e) => { clearTimeout(timer); reject(e); });
      server.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
      server.stdout.once("data", () => { clearTimeout(timer); resolve(); });
    });
    const executablePath = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(fs.existsSync);
    browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { headless: true });
    for (const viewport of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
      const page = await context.newPage(), errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const cdp = await context.newCDPSession(page);
      await page.goto("http://127.0.0.1:4179");
      const load = async (state) => {
        state.guide.paused = true;
        await page.evaluate((state) => localStorage.setItem("little-money-town-v1", JSON.stringify(state)), state);
        await page.reload();
      };
      const swipe = async (x, y, dx, dy) => {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
        for (let i = 1; i <= 12; i++) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / 12, y: y + dy * i / 12, id: 1 }] });
          await page.waitForTimeout(20);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForTimeout(450);
      };
      const sketch = T.create(); sketch.owned = ["notebook", "crayons", "eraser"];
      await load(sketch);
      await page.locator(".bag-shortcut").tap();
      const homeScroll = await page.evaluate(() => -parseFloat(document.documentElement.style.getPropertyValue("--scene-top")));
      await page.locator('[data-action="sketch"]').tap();
      const paper = page.locator("#sketch-paper");
      await paper.scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => ({ page: scrollY, modal: document.querySelector("#modal").scrollTop }));
      const box = await paper.boundingBox();
      const x = box.x + box.width * .35, y = box.y + box.height * .25;
      await swipe(x, y, box.width * .2, box.height * .45);
      await expect(paper.locator("path")).toHaveCount(1);
      const originalPath = await paper.locator("path").elementHandle();
      await swipe(x, y, -box.width * .15, box.height * .4);
      await expect(paper.locator("path")).toHaveCount(2);
      assert.ok(await originalPath.evaluate((el) => el.isConnected), "Existing stroke stays attached when drawing over it");
      assert.deepEqual(await page.evaluate(() => ({ page: scrollY, modal: document.querySelector("#modal").scrollTop })), before, "Drawing never scrolls either page or dialog");
      await page.locator('[data-sketch="save"]').tap();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("little-money-town-v1")));
      assert.equal(saved.sketches.notebook.length, 2);
      assert.ok(saved.sketches.notebook.every((stroke) => stroke.points.length >= 8), "Both touch strokes remain continuous");
      await page.locator("#close-modal").tap();
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - homeScroll) <= 1, "Closing restores home scroll position");
      await expect(page.locator("html")).not.toHaveClass(/scene-open/);

      let shop = T.act(T.create(), { type: "stall", starter: false }).state;
      for (const id of Object.keys(T.DRINKS)) shop = T.act(shop, { type: "stall-menu", id, enabled: true }).state;
      await load(shop);
      await page.locator("#more-places").tap();
      await page.locator('[data-destination="stall"]').tap();
      const scroller = page.locator("#modal-body"), header = page.locator(".modal-top");
      const headerY = (await header.boundingBox()).y;
      const scrollBox = await scroller.boundingBox();
      const startX = scrollBox.x + scrollBox.width * .5;
      const startY = scrollBox.y + scrollBox.height * .8;
      const delta = scrollBox.height * .5;
      let previous = 0;
      for (let i = 0; i < 4; i++) {
        await swipe(startX, startY, 0, -delta);
        const next = await scroller.evaluate((el) => el.scrollTop);
        assert.ok(next > previous + 40, "Each upward swipe continues through the drink menu");
        previous = next;
      }
      await swipe(startX, startY - delta, 0, delta);
      assert.ok(await scroller.evaluate((el) => el.scrollTop) < previous - 40, "Reversing the gesture scrolls back immediately");
      assert.ok(Math.abs((await header.boundingBox()).y - headerY) <= 1, "Header remains stationary");
      assert.equal(await page.locator("#modal").evaluate((el) => el.scrollTop), 0);
      assert.equal(await page.evaluate(() => scrollY), 0, "Background stays locked");
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("little-money-town-v1")).stall.menu), shop.stall.menu, "Swiping across controls does not change the menu or prices");
      await page.locator('[data-drink="milkTea"] [data-action="stall-drink-price"][data-change="1"]').scrollIntoViewIfNeeded();
      const priceScroll = await scroller.evaluate((el) => el.scrollTop);
      await page.locator('[data-drink="milkTea"] [data-action="stall-drink-price"][data-change="1"]').tap();
      assert.ok(Math.abs(await scroller.evaluate((el) => el.scrollTop) - priceScroll) <= 1, "Changing a price preserves menu position");
      await page.locator("#close-modal").tap();
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log("Tablet touch drawing and drink-menu scrolling passed.");
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
