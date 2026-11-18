/**
 * Electional astrology: search a range for the best moments by traditional
 * rules (Swiss Ephemeris), pick one, save it as an election chart.
 *   node tests/e2e/elect.mjs   (production server running; SHOTS=dir saves screenshots)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1200 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
const post = (url, body) => page.evaluate(async ({ url, body }) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, body });
const state = () => page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));

step("practitioner with sample data (Premium)");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Ele");
await page.fill("#em", `ele-${stamp}@example.com`);
await page.fill("#pw", "election-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await post("/api/v1/sample-data", {});
const settings = (await state()).defaults;

step("the search ranks real moments and never picks a void Moon");
const body = { from: "2026-12-01", to: "2026-12-14", dailyFrom: "09:00", dailyTo: "17:00", stepMin: 30, place: { lat: 51.5074, lon: -0.1278, tz: "Europe/London" }, settings: { ...settings, houseSystem: "regiomontanus" }, checks: ["moon-voc", "via-combusta", "moon-waxing", "moon-benefic", "moon-malefic", "mercury-direct", "malefic-angular", "asc-ruler", "eclipse"] };
const r = await post("/api/v1/astro/elect", body);
assert.equal(r.status, 200, JSON.stringify(r.body));
const w = r.body.windows;
assert.ok(w.length > 0 && w.length <= 12);
for (let i = 1; i < w.length; i++) assert.ok(w[i - 1].percent >= w[i].percent, "best first");
for (const x of w) {
  assert.ok(x.start >= "2026-12-01T09:00" && x.end <= "2026-12-14T17:00" && x.best >= x.start && x.best <= x.end, "inside the range");
  assert.ok(x.results.find((c) => c.id === "moon-voc").ok, "never void of course");
}
assert.equal((await post("/api/v1/astro/elect", { ...body, to: "2027-06-01" })).status, 422, "range limited");

step("Create Chart → Electional → Find Times → pick → save");
await page.goto(BASE + "/app/charts/new?client=c1");
await page.getByRole("button", { name: /^Electional/ }).click();
await page.getByLabel("Event").selectOption("contract");
await page.getByLabel(/What It’s For/).fill("Signing the studio lease");
await page.getByLabel("From", { exact: true }).fill("2026-12-01");
await page.getByLabel("To", { exact: true }).fill("2026-12-10");
await page.getByLabel("Check Every").selectOption("30");
await page.locator("#election-place").fill("Par");
await page.locator("button", { hasText: "Paris, France" }).first().click();
await page.getByRole("button", { name: "Find Times" }).click();
const results = page.getByRole("list", { name: "Best times" });
await results.waitFor({ timeout: 60000 });
await results.getByRole("button").first().click();
await page.getByText("Signing the studio lease").first().waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/elect-find.png`, fullPage: true });
await page.getByRole("button", { name: /Save & Open Workspace/i }).click();
await page.waitForURL(/\/app\/charts\/(?!new)/);
await page.getByText(/Elected Moment · Signing & Contracts/i).waitFor({ timeout: 20000 });
await page.getByText("Mercury direct").first().waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/elect-chart.png`, fullPage: true });
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
const s = await state();
const e = s.charts.find((c) => c.type === "election");
assert.equal(e.election.purpose, "Signing the studio lease");
assert.equal(e.election.event, "contract");
assert.equal(e.election.tz, "Europe/Paris");
assert.ok(e.election.at >= "2026-12-01" && e.election.at <= "2026-12-10T18:00");
assert.ok(e.election.checks.includes("mercury-direct"));

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ elective astrology");
