/**
 * Plans: the standard plan has natal and synastry charts; Premium adds the other
 * techniques and the timeline. Checks the server refuses, and the screens explain.
 *   DATABASE_URL=… node tests/e2e/premium.mjs   (production server running)
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const step = (s) => console.log("•", s);
const setPlan = (email, plan) => execFileSync("node", ["scripts/set-plan.mjs", email, plan], { stdio: "pipe" }).toString();
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

step("sign up, load sample data, switch to the standard plan");
const email = `premium-${Date.now().toString(36)}@example.com`;
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Plan");
await page.fill("#em", email);
await page.fill("#pw", "premium-password-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
assert.match(setPlan(email, "standard"), /now on Standard/);

const boot = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
assert.equal(boot.plan, "standard");
const amelia = boot.people.find((p) => p.id === "c1");
const post = (path, body) => page.evaluate(([p, b]) => fetch(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.status), [path, body]);
const s = boot.defaults;

step("server: natal allowed; timing techniques and the timeline refused (402)");
assert.equal(await post("/api/v1/astro/natal", { birth: amelia.birth, settings: s }), 200);
assert.equal(await post("/api/v1/astro/positions", { utc: "2026-11-15T12:00:00Z", settings: s }), 402);
assert.equal(await post("/api/v1/astro/progressed", { birth: amelia.birth, target: "2026-11-15", settings: s }), 402);
assert.equal(await post("/api/v1/astro/solar-arc", { birth: amelia.birth, target: "2026-11-15", settings: s }), 402);
assert.equal(await post("/api/v1/astro/solar-return", { birth: amelia.birth, year: 2027, settings: s }), 402);
assert.equal(await post("/api/v1/timeline", { birth: amelia.birth, settings: s, from: "2027-01-01", to: "2027-03-31" }), 402);

step("screens: natal and synastry open; transits, composite and the timeline explain Premium");
await page.goto(BASE + "/app/charts/ch1");
await page.locator("svg").filter({ hasText: "MC" }).first().waitFor({ timeout: 20000 });
await page.goto(BASE + "/app/charts/ch3");
await page.locator("svg").filter({ hasText: "MC" }).first().waitFor({ timeout: 20000 });
for (const id of ["ch2", "ch4"]) {
  await page.goto(BASE + "/app/charts/" + id);
  await page.getByRole("heading", { name: /is part of Premium/ }).waitFor({ timeout: 20000 });
}
await page.goto(BASE + "/app/timeline?client=c1");
await page.getByRole("heading", { name: /The convergence timeline is part of Premium/ }).waitFor();
await page.goto(BASE + "/app/charts/new?type=transits&client=c1");
await page.getByText(/Transits charts are part of Premium/).waitFor();
assert.equal(await page.getByRole("button", { name: /Save & open workspace/ }).isDisabled(), true);
await page.goto(BASE + "/app/settings?section=subscription");
await page.getByText("Standard", { exact: true }).waitFor();

step("Premium unlocks them");
assert.match(setPlan(email, "premium"), /now on Premium/);
assert.equal(await post("/api/v1/astro/progressed", { birth: amelia.birth, target: "2026-11-15", settings: s }), 200);
await page.goto(BASE + "/app/timeline?client=c1");
await page.getByRole("heading", { name: "Busiest periods" }).waitFor({ timeout: 30000 });
await page.goto(BASE + "/app/charts/ch2");
await page.locator("svg").filter({ hasText: "MC" }).first().waitFor({ timeout: 20000 });

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ premium");
