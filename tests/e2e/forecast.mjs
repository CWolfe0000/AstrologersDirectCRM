/**
 * Midpoints, fixed stars and forecast windows (one person and a couple), and
 * the handoff from a window to the elections finder.
 *   node tests/e2e/forecast.mjs   (production server running; SHOTS=dir saves screenshots)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const errors = [];
const step = (s) => console.log("•", s);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1200 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
const post = (url, body) => page.evaluate(async ({ url, body }) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, body });

step("practitioner with sample data (Premium)");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Fc");
await page.fill("#em", `fc-${Date.now().toString(36)}@example.com`);
await page.fill("#pw", "forecast-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await post("/api/v1/sample-data", {});
const state = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const natal = state.charts.find((c) => c.type === "natal" && c.personIds[0] === "c1") ?? state.charts.find((c) => c.type === "natal");
const c1 = state.people.find((p) => p.id === "c1");
const other = state.people.find((p) => p.id !== "c1" && p.birth?.date && p.birth.timeAccuracy !== "unknown");
assert.ok(natal && c1 && other);

step("API: stars, forecast and couple forecast");
const settings = { zodiac: "tropical", houseSystem: "placidus" };
const stars = await post("/api/v1/astro/stars", { utc: "1989-03-15T15:18:00Z", settings });
assert.equal(stars.status, 200);
const vega = stars.body.stars.find((s) => s.name === "Vega");
assert.ok(vega && Math.abs(vega.lon - 285.15) < 0.05, JSON.stringify(vega)); // 15°09′ Capricorn in 1989
const me = { date: "1989-03-15", time: "08:18", timeAccuracy: "exact", place: "Caldwell", lat: 43.6629, lon: -116.6874, tz: "America/Boise" };
const f = await post("/api/v1/astro/forecast", { birth: me, settings, from: "2026-11-20", years: 3, themes: ["money", "love"] });
assert.equal(f.status, 200, JSON.stringify(f.body));
assert.ok(f.body.forecast.events.some((e) => /Solar Arc Venus Opposite Descendant/.test(e.text) && e.date.startsWith("2028-09")));
assert.ok(f.body.forecast.scores.love.windows.some((w) => w.from <= "2028-09" && w.to >= "2028-09"));
assert.ok(f.body.forecast.retrogrades.some((r) => r.planet === "Venus" && r.start.startsWith("2028-05")));
const kh = { date: "1983-01-27", time: "00:22", timeAccuracy: "exact", place: "Milwaukee", lat: 43.0389, lon: -87.9065, tz: "America/Chicago" };
const cf = await post("/api/v1/astro/couple-forecast", { a: me, b: kh, settings, from: "2026-11-20", years: 2, themes: ["home"] });
assert.equal(cf.status, 200);
assert.ok(cf.body.forecast.events.some((e) => e.chart === "Composite" && /Saturn Conjunct IC/.test(e.text) && e.date.startsWith("2027-08")));
assert.ok(cf.body.forecast.scores.home.windows.some((w) => w.from <= "2027-08" && w.to >= "2027-08" && w.charts >= 3));
assert.equal((await post("/api/v1/astro/forecast", { birth: me, settings, from: "2026-11-20", years: 9, themes: ["money"] })).status, 422);

step("chart: Midpoints tab and Fixed Stars");
await page.goto(BASE + `/app/charts/${natal.id}`);
await page.getByRole("tab", { name: "Midpoints" }).click();
await page.getByRole("heading", { name: "Midpoint Pictures" }).waitFor();
assert.ok((await page.locator("li", { hasText: "=" }).count()) > 0);
await page.getByRole("group", { name: "90 degree dial" }).waitFor();
await page.getByRole("button", { name: /^Sun .* on the dial$/ }).click();
await page.getByRole("tab", { name: "Traditional" }).click();
await page.getByRole("heading", { name: "Fixed Stars" }).waitFor();
await page.waitForFunction(() => !document.body.innerText.includes("Finding star positions"), null, { timeout: 30000 });
assert.ok(!(await page.getByText("Star positions couldn’t be calculated").count()));

step("forecast page: one person, then a couple, then pick a date");
await page.goto(BASE + "/app/clients/c1/forecast");
await page.getByRole("button", { name: "Find Windows" }).click();
await page.getByRole("heading", { name: "Love & Marriage" }).waitFor({ timeout: 60000 });
await page.getByRole("heading", { name: "Dates to Avoid for Signing and Commitments" }).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/forecast.png`, fullPage: true });
await page.getByLabel("Together With (Optional)").selectOption(other.id);
await page.getByRole("button", { name: "Find Windows" }).click();
await page.getByText(/of 4 Charts/).first().waitFor({ timeout: 60000 });
const pick = page.getByRole("link", { name: "Pick a Date in This Window" }).first();
if (await pick.count()) {
  const href = await pick.getAttribute("href");
  assert.match(href, /type=election&client=c1&event=(contract|launch|move|relationship)&from=\d{4}-\d\d-\d\d&to=\d{4}-\d\d-\d\d/);
  const [, ev, from, to] = href.match(/event=(\w+)&from=([\d-]+)&to=([\d-]+)/);
  assert.ok((Date.parse(to) - Date.parse(from)) / 86400000 <= 119);
  await pick.click();
  await page.waitForURL(/charts\/new/);
  await page.waitForFunction((v) => [...document.querySelectorAll("input[type=date]")].some((i) => i.value === v), from, { timeout: 20000 });
  void ev;
}
assert.deepEqual(errors, []);
await browser.close();
console.log("✓ forecast, midpoints and fixed stars");
