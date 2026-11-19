/**
 * Horary charts and astrocartography: created from Create Chart, calculated
 * with Swiss Ephemeris, shown in the workspace, and Premium-only.
 *   node tests/e2e/horary-acg.mjs   (production server running; SHOTS=dir saves screenshots)
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
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
const post = (url, body) => page.evaluate(async ({ url, body }) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, body });
const state = () => page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));

step("practitioner with sample data (Premium)");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Hor");
await page.fill("#em", `hor-${stamp}@example.com`);
await page.fill("#pw", "horary-pass-12345");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await post("/api/v1/sample-data", {});

step("the astrocartography calculation is right");
const settings = (await state()).defaults;
// 2000-01-01 12:00 UTC: GST ≈ 280.46°; the Sun (RA ≈ 281.3°) culminates near 0.8°E.
const acg = await post("/api/v1/astro/acg", { birth: { date: "2000-01-01", time: "12:00", timeAccuracy: "exact", place: "Greenwich", lat: 51.48, lon: 0, tz: "UTC" }, settings });
assert.equal(acg.status, 200);
assert.ok(Math.abs(acg.body.acg.gst - 280.46) < 0.05, `GST ${acg.body.acg.gst}`);
const sun = acg.body.acg.bodies.find((b) => b.id === "sun");
assert.ok(Math.abs(sun.ra - 281.29) < 0.05 && Math.abs(sun.dec + 23.03) < 0.05, `Sun RA ${sun.ra} dec ${sun.dec}`);

step("create a horary chart");
await page.goto(BASE + "/app/charts/new?client=c1");
await page.getByRole("button", { name: /^Horary/ }).click();
await page.getByLabel("Question").fill("Will I get the job I interviewed for?");
await page.getByLabel("Date Asked").fill("2026-11-10");
await page.getByLabel("Time Asked").fill("14:20");
await page.locator("#horary-place").fill("Par");
await page.locator("button", { hasText: "Paris, France" }).first().click();
assert.equal(await page.getByLabel("House System").inputValue(), "regiomontanus", "Regiomontanus by default");
assert.match(await page.getByLabel("Chart Title").inputValue(), /Horary: Will I get the job I interviewed for\?/);
await page.getByRole("button", { name: /Save & Open Workspace/i }).click();
await page.waitForURL(/\/app\/charts\/(?!new)/);
await page.getByText("Considerations Before Judgment").waitFor({ timeout: 20000 });
await page.getByText("“Will I get the job I interviewed for?”").waitFor();
await page.getByText(/on a day ruled by Mars/).waitFor();

step("judgment: significators, perfection, strength, radicality; then the log");
await page.getByLabel("The Question Is About").selectOption("10");
await page.getByText(/Quesited: the 10th House/).waitFor();
await page.getByText("Following the planets forward…").waitFor({ state: "detached", timeout: 30000 });
await page.getByText(/Ruler of the Ascendant/).waitFor();
await page.getByText(/Asked in the hour of/).waitFor();
await page.getByText(/^Leans (Yes|No)|^Unclear/).first().waitFor();
await page.getByText(/Confidence$/).first().waitFor();
assert.ok(await page.getByRole("cell", { name: /Moon/ }).count(), "strength table lists the Moon");
await page.getByLabel("Whose Matter").selectOption("7");
await page.getByText(/Quesited: the 4th House \(the 10th from the 7th\)/).waitFor();
await page.getByLabel("Whose Matter").selectOption("1");
await page.getByLabel("Your Judgment").fill("Yes, within weeks: the Moon applies to the 10th ruler.");
await page.getByLabel("Outcome").selectOption("yes");
await page.getByRole("button", { name: "Save", exact: true }).click();
if (SHOTS) { await page.waitForTimeout(500); await page.locator("text=Considerations Before Judgment").locator("..").locator("..").screenshot({ path: `${SHOTS}/horary-judgment.png` }); }
if (SHOTS) await page.screenshot({ path: `${SHOTS}/horary.png`, fullPage: true });
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
let s = await state();
const h = s.charts.find((c) => c.type === "horary");
assert.deepEqual({ q: h.horary.question, at: h.horary.at, tz: h.horary.tz, p: h.personIds }, { q: "Will I get the job I interviewed for?", at: "2026-11-10T14:20", tz: "Europe/Paris", p: ["c1"] });
assert.equal(h.horary.topicHouse, 10);
assert.equal(h.horary.outcome, "yes");
assert.match(h.horary.judgment, /within weeks/);
assert.ok(h.horary.outcomeAt, "outcome date recorded");
assert.deepEqual(h.settings.aspects, ["conjunction", "sextile", "square", "trine", "opposition"], "Ptolemaic aspects for horary");
await page.goto(BASE + "/app/clients/c1?tab=charts");
await page.getByText(/1 Outcome Recorded \(1 Yes, 0 No, 0 Partly\)/).waitFor();

step("create an astrocartography map");
await page.goto(BASE + "/app/charts/new?client=c1");
await page.getByRole("button", { name: /^Astrocartography/ }).click();
assert.equal(await page.getByLabel("House System").count(), 0, "no house settings for a map");
await page.locator('svg[aria-label^="Astrocartography map"]').waitFor();
await page.getByRole("button", { name: /Save & Open Workspace/i }).click();
await page.waitForURL(/\/app\/charts\/(?!new)/);
const map = page.locator('svg[aria-label^="Astrocartography map"]');
await map.waitFor({ timeout: 20000 });
await page.waitForFunction(() => document.querySelectorAll('svg[aria-label^="Astrocartography map"] path[stroke-linecap="round"]').length > 20, null, { timeout: 20000 });
await page.locator("#acg-place").fill("Par");
await page.locator("button", { hasText: "Paris, France" }).first().click();
await page.getByText(/km$/).first().waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/acg.png`, fullPage: true });
await page.getByRole("button", { name: /Mars/ }).click(); // hide Mars lines
assert.equal(await page.getByRole("button", { name: /Mars/ }).getAttribute("aria-pressed"), "false");

step("both are Premium");
await page.evaluate(() => fetch("/api/v1/practice", { method: "GET" }));
const { Client } = require("pg");
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
await db.query("update practices set plan='standard' where id=(select practice_id from users where email=$1)", [`hor-${stamp}@example.com`]);
assert.equal((await post("/api/v1/astro/acg", { birth: { date: "2000-01-01", time: "12:00", timeAccuracy: "exact", place: "Greenwich", lat: 51.48, lon: 0, tz: "UTC" }, settings })).status, 402);
await page.goto(BASE + "/app/charts/new?client=c1&type=horary");
await page.getByText(/Horary charts are part of Premium/).waitFor({ timeout: 20000 });
await db.end();

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ horary and astrocartography");
