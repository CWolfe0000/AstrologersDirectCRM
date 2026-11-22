/**
 * Share Cards: Big Three, chart wheel, Moon phase and this week's aspects,
 * downloaded as PNGs at Instagram sizes with the astrologer's footer.
 *   node tests/e2e/share-cards.mjs   (production server running)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const errors = [];
const step = (s) => console.log("•", s);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (url, init) => page.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });
const pngSize = (path) => { const b = readFileSync(path); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

step("practitioner with sample data and a live booking page");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Sol");
await page.fill("#em", `sc-${Date.now().toString(36)}@example.com`);
await page.fill("#pw", "share-cards-pass-1");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
assert.equal((await call("/api/v1/sample-data", { method: "POST", body: "{}" })).status, 200);
const prof = (await call("/api/v1/booking")).body.profile;
await call("/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, enabled: true }) });
const st = (await call("/api/v1/bootstrap?view=app")).body;
const chart = st.charts.find((c) => c.type === "natal" && st.people.find((p) => p.id === c.personIds[0])?.birth.timeAccuracy !== "unknown");

step("from the chart menu: a Big Three card");
await page.goto(`${BASE}/app/charts/${chart.id}`);
await page.getByRole("button", { name: "Chart Actions" }).click();
await page.getByRole("menuitem", { name: "Make a Share Card" }).click();
await page.waitForURL(/\/app\/share\?chart=/);
const dl = page.getByRole("button", { name: "Download PNG" });
await dl.waitFor();
await page.waitForFunction(() => !document.querySelector("button[disabled]")?.textContent?.includes("Download PNG"), null, { timeout: 30000 });
await page.getByText(/Footer: .*\/book\//).waitFor();

async function save(name, w, h) {
  const [d] = await Promise.all([page.waitForEvent("download"), dl.click()]);
  const path = await d.path();
  assert.deepEqual(pngSize(path), [w, h], name);
  if (SHOTS) await d.saveAs(`${SHOTS}/card-${name}.png`);
}
await save("big-three", 1080, 1080);

step("chart wheel, portrait");
await page.getByLabel("Card", { exact: true }).selectOption("wheel");
await page.getByLabel("Size", { exact: true }).selectOption("portrait");
await page.waitForTimeout(1500);
await save("wheel", 1080, 1350);

step("Moon phase and this week's sky, as stories");
await page.getByLabel("Card", { exact: true }).selectOption("moon");
await page.getByLabel("Size", { exact: true }).selectOption("story");
await page.getByRole("tab", { name: "Dusk" }).click();
await page.waitForFunction(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.includes("Download PNG")); return b && !b.disabled; }, null, { timeout: 60000 });
await page.waitForTimeout(800);
await save("moon", 1080, 1920);
await page.getByLabel("Card", { exact: true }).selectOption("transits");
await page.getByRole("tab", { name: "Paper" }).click();
await page.waitForTimeout(800);
await save("week", 1080, 1920);

assert.deepEqual(errors, []);
await browser.close();
console.log("share cards: all checks passed");
