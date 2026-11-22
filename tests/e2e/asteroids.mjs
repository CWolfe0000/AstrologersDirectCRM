/**
 * Full asteroid catalog: find an asteroid by name, add it to the practice's
 * list, and see its position (from NASA JPL) on a natal chart.
 *   node tests/e2e/asteroids.mjs   (production server running; needs ssd.jpl.nasa.gov)
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
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (url, init) => page.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });

step("practitioner with sample data");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Ada");
await page.fill("#em", `ast-${Date.now().toString(36)}@example.com`);
await page.fill("#pw", "asteroid-pass-1");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
assert.equal((await call("/api/v1/sample-data", { method: "POST", body: "{}" })).status, 200);

step("the search finds asteroids by name and by number");
const r1 = await call("/api/v1/astro/asteroid-search", { method: "POST", body: JSON.stringify({ q: "eros" }) });
const s1 = r1.body.results;
assert.deepEqual(s1[0], { n: 433, name: "Eros" }, "the exact name comes first");
const s2 = (await call("/api/v1/astro/asteroid-search", { method: "POST", body: JSON.stringify({ q: "chari" }) })).body.results;
assert.ok(s2.some((x) => x.n === 10199 && x.name === "Chariklo"), "partial names match");

step("the position agrees with the Swiss Ephemeris (Ceres)");
const ast = (await call("/api/v1/astro/asteroids", { method: "POST", body: JSON.stringify({ utc: "2023-02-25T00:00:00Z", list: [{ n: 1, name: "Ceres" }], settings: { zodiac: "tropical" } }) })).body.asteroids[0];
assert.ok(Math.abs(ast.lon - 185.35289) < 0.001, `Ceres ${ast.lon}`);

step("add Eros on a natal chart");
const st = (await call("/api/v1/bootstrap?view=app")).body;
const chart = st.charts.find((c) => c.type === "natal" && st.people.find((p) => p.id === c.personIds[0])?.birth.timeAccuracy !== "unknown");
await page.goto(`${BASE}/app/charts/${chart.id}`);
await page.getByRole("tab", { name: "Asteroids" }).click();
await page.getByLabel("Find an Asteroid").fill("eros");
await page.getByRole("listbox", { name: "Asteroids Found" }).getByRole("option", { name: /^Eros \(433\)/ }).click();
const row = page.getByRole("listitem", { name: "Eros (433)" });
await row.waitFor();
await row.getByText(/°.*′/).waitFor({ timeout: 30000 });
if (SHOTS) await page.screenshot({ path: `${SHOTS}/asteroids.png`, fullPage: false });
let s;
for (let i = 0; i < 20; i++) { s = (await call("/api/v1/bootstrap?view=app")).body; if (s.defaults.asteroids?.length) break; await new Promise((r) => setTimeout(r, 300)); }
assert.deepEqual(s.defaults.asteroids, [{ n: 433, name: "Eros" }], "saved with the practice's chart settings");

assert.deepEqual(errors, []);
await browser.close();
console.log("asteroids: all checks passed");
