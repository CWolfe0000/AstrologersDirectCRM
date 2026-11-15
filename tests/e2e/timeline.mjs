/**
 * Convergence timeline: Swiss Ephemeris contacts, busy periods, detail panel,
 * hand-off to a timing chart with a prefilled observation, and API validation.
 *   node tests/e2e/timeline.mjs   (production server running with SWISS_EPHEMERIS_LICENSE=staging)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const step = (s) => console.log("•", s);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

step("sign up and load sample data");
const stamp = Date.now().toString(36);
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Timeline");
await page.fill("#em", `timeline-${stamp}@example.com`);
await page.fill("#pw", "timeline-password-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
assert.equal((await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then((r) => r.status))), 200);

const call = (body) =>
  page.evaluate((b) => fetch("/api/v1/timeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, json: await r.json() })), body);
const boot = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const amelia = boot.people.find((p) => p.id === "c1");

step("API: a year of contacts from Swiss Ephemeris");
const res = await call({ birth: amelia.birth, settings: boot.defaults, from: "2027-01-01", to: "2027-12-31", options: { transitBodies: ["saturn", "jupiter", "pluto"] } });
assert.equal(res.status, 200, JSON.stringify(res.json).slice(0, 300));
const tl = res.json.timeline;
assert.equal(res.json.engine.id, "swiss");
assert.equal(tl.days.length, 365);
assert.ok(tl.contacts.length > 10);
assert.ok(tl.contacts.some((c) => c.technique === "transit") && tl.contacts.some((c) => c.technique === "solar-arc"));
// Every transit hit is inside the range, numbered in order, and inside its window.
for (const c of tl.contacts.filter((x) => x.technique === "transit")) {
  const ex = c.windows.flatMap((w) => w.exacts);
  assert.deepEqual(ex.map((e) => e.pass), ex.map((_, i) => i + 1), c.id);
  for (const w of c.windows) for (const e of w.exacts) assert.ok(e.utc >= w.start && e.utc <= w.end, c.id);
}
// Swiss's eclipse search labels the 2027 eclipses (Feb 6 annular solar, Aug 2 total solar).
const ecl = tl.lunations.filter((l) => l.eclipse);
assert.ok(ecl.some((l) => l.utc.startsWith("2027-02-06") && /annular solar/.test(l.eclipse)), JSON.stringify(ecl));
assert.ok(ecl.some((l) => l.utc.startsWith("2027-08-02") && /total solar/.test(l.eclipse)));
assert.ok(ecl.every((l) => !l.eclipseApproximate));

step("API: validation");
assert.equal((await call({ birth: amelia.birth, settings: boot.defaults, from: "2027-01-01", to: "2031-01-01" })).status, 422);
assert.equal((await call({ birth: amelia.birth, settings: boot.defaults, from: "2027-05-01", to: "2027-01-01" })).status, 422);
assert.equal((await call({ birth: amelia.birth, settings: boot.defaults, from: "2027-01-01", to: "2027-02-01", options: { orbs: { transit: 50, directed: 1, lunation: 1, eclipse: 1 } } })).status, 422);

step("page: strip, busy periods, rows");
await page.goto(BASE + "/app/timeline?client=c1");
await page.getByRole("heading", { name: "Busiest periods" }).waitFor({ timeout: 30000 });
assert.ok(await page.getByRole("img", { name: /Convergence from/ }).isVisible());
const rows = page.locator('li > button[aria-label*="Open details"]');
const total = await rows.count();
assert.ok(total > 20, `rows: ${total}`);

step("page: focusing a busy period filters the rows");
await page.locator("button[aria-pressed]").first().click();
await page.getByText(/^Showing the \d+ contacts in orb/).waitFor();
assert.ok((await rows.count()) < total);
await page.getByRole("button", { name: "Show all", exact: true }).click();

step("page: turning off techniques recalculates");
await page.getByLabel("Progressions").uncheck();
await page.getByLabel("Solar arcs").uncheck();
await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]') && ![...document.querySelectorAll('li > button[aria-label]')].some((b) => /^(Progressed|Solar arc) /.test(b.getAttribute("aria-label") || "")), null, { timeout: 30000 });

step("detail panel → observation on a timing chart");
await page.locator('li > button[aria-label^="Pluto conjunction natal Moon"]').click();
const dialog = page.getByRole("dialog");
await dialog.getByText(/pass 1 of/).first().waitFor();
await dialog.getByRole("button", { name: /Add observation/ }).click();
await page.waitForURL(/\/app\/charts\/[^?]+\?note=1/);
await page.getByText("Pluto conjunction natal Moon").first().waitFor();
await page.getByText(/Belongs to the timing chart/).waitFor();

step("open chart at a date");
await page.goto(BASE + "/app/timeline?client=c1");
await page.getByRole("heading", { name: "Busiest periods" }).waitFor({ timeout: 30000 });
await rows.first().click();
await page.getByRole("dialog").getByRole("button", { name: /Open chart at/ }).click();
await page.waitForURL(/\/app\/charts\/[^?]+\?date=\d{4}-\d{2}-\d{2}/);
const date = new URL(page.url()).searchParams.get("date");
assert.equal(await page.locator('input[type="date"]').first().inputValue(), date);

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ timeline");
