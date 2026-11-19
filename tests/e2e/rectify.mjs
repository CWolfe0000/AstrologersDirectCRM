/**
 * Birth-time rectification: a known-answer check. The events are dates when
 * solar arcs hit the angles of a chart born at 07:42; searching 05:42–09:42
 * should rank 07:42 first. Then the UI: enter events, run, use the time.
 *   node tests/e2e/rectify.mjs   (production server running; SHOTS=dir saves screenshots)
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
await page.fill("#fn", "Rec");
await page.fill("#em", `rec-${stamp}@example.com`);
await page.fill("#pw", "rectify-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await post("/api/v1/sample-data", {});

step("known answer: 07:42 ranks first");
const birth = { date: "1988-03-14", time: "07:42", timeAccuracy: "exact", place: "Portland", lat: 45.52, lon: -122.68, tz: "America/Los_Angeles" };
const events = [
  { date: "1990-09-12", type: "move" }, { date: "1992-04-20", type: "career" }, { date: "1998-07-17", type: "marriage" },
  { date: "2001-06-25", type: "career" }, { date: "2022-10-30", type: "health" },
];
const extra = [{ date: "2005-01-10", type: "legal" }, { date: "2008-05-02", type: "incarceration" }, { date: "2012-08-19", type: "long-move" }
];
const r = await post("/api/v1/astro/rectify", { birth, events, from: "05:42", to: "09:42", stepMin: 1, settings: { zodiac: "tropical", houseSystem: "placidus" } });
assert.equal(r.status, 200, JSON.stringify(r.body));
const { top, curve } = r.body.rectify;
const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
console.log("  ", top.map((t) => `${t.time} ${t.score}`).join(" | "));
assert.ok(Math.abs(mins(top[0].time) - mins("07:42")) <= 4, `best ${top[0].time}`);
assert.equal(curve.length, 241);
assert.ok(top[0].hits.every((h) => h.points >= 0 && h.orb <= 1));
// The new event types are accepted.
assert.equal((await post("/api/v1/astro/rectify", { birth, events: [...events, ...extra], from: "07:00", to: "08:00", stepMin: 5, settings: { zodiac: "tropical", houseSystem: "placidus" } })).status, 200);
assert.equal((await post("/api/v1/astro/rectify", { birth, events: [], from: "05:42", to: "09:42", stepMin: 1, settings: { zodiac: "tropical", houseSystem: "placidus" } })).status, 422);

step("rising signs: the day is covered; a chosen sign limits the search");
const rising = (await post("/api/v1/astro/rising", { birth, settings: { zodiac: "tropical", houseSystem: "placidus" } })).body.rising;
assert.equal(rising[0].from, "00:00");
assert.equal(rising.at(-1).to, "23:59");
assert.ok(rising.length >= 12 && rising.length <= 14);
for (let i = 1; i < rising.length; i++) assert.equal(mins(rising[i].from), mins(rising[i - 1].to) + 1);
const own = rising.find((x) => x.from <= "07:42" && "07:42" <= x.to);
const only = (await post("/api/v1/astro/rectify", { birth, events, from: "05:42", to: "09:42", stepMin: 1, settings: { zodiac: "tropical", houseSystem: "placidus" }, ascSigns: [own.sign] })).body.rectify;
assert.ok(only.curve.every((x) => Math.floor(x.asc / 30) === own.sign));
assert.ok(only.curve.length < 241);

step("UI: rising sign chosen, events saved, search run, time applied");
await page.goto(BASE + "/app/clients/c1/rectify");
await page.getByRole("button", { name: /\(Recorded Time\)/ }).click();
assert.equal(await page.getByRole("button", { name: /\(Recorded Time\)/ }).getAttribute("aria-pressed"), "true");
await page.getByText(/Only times with .* rising are tested/).waitFor();
for (const e of events.slice(0, 3)) {
  await page.getByLabel("Event date").fill(e.date);
  await page.getByLabel("Event type").selectOption(e.type);
  await page.getByRole("button", { name: "Add Event" }).click();
}
await page.getByRole("button", { name: /Test .* Candidate Times/ }).click();
await page.getByRole("heading", { name: "Best Candidates" }).waitFor({ timeout: 60000 });
await page.getByText("Technical Breakdown").first().waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/rectify.png`, fullPage: true });
const [, hh, mm, ap] = (await page.locator("tr", { hasText: "Use This Time" }).first().innerText()).match(/(\d{1,2}):(\d\d)\s*([AP]M)?/i);
const chosen = `${String((Number(hh) % 12) + (/p/i.test(ap ?? "") ? 12 : ap ? 0 : Number(hh) >= 12 ? 12 : 0)).padStart(2, "0")}:${mm}`;
await page.getByRole("button", { name: "Use This Time" }).first().click();
await page.waitForTimeout(1500);
const c1 = (await state()).people.find((p) => p.id === "c1");
assert.equal(c1.lifeEvents.length, 3);
assert.equal(c1.birth.time, chosen);
assert.equal(c1.birth.timeAccuracy, "exact");
assert.ok(c1.birth.rectifiedFrom && c1.birth.rectifiedAt);

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ rectification");
