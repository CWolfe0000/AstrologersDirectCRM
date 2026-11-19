/**
 * Rectification benchmark on real AA-rated charts (tests/rectify/cases.json).
 * For each person the recorded time is hidden and searched for in 2-minute
 * steps, two ways:
 *   events     ±2 hours around the recorded time, events alone
 *   sign       the rising sign judged first (assumed judged correctly), then
 *              events across the whole span that sign rises
 * Reports how far off the best candidate is, against chance in the same window.
 *   node tests/rectify/benchmark.mjs   (production server running)
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const STEP = Number(process.env.STEP || 2);
const { cases } = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url)));

const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Bench");
await page.fill("#em", `bench-${Date.now().toString(36)}@example.com`);
await page.fill("#pw", "benchmark-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);

const m = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const hhmm = (x) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
const call = (op, b) => page.evaluate(async ({ op, b }) => (await fetch("/api/v1/astro/" + op, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json(), { op, b });
const settings = { zodiac: "tropical", houseSystem: "placidus" };
for (const mode of ["events", "sign"]) {
console.log(`\n== ${mode === "events" ? "Events alone, ±2 hours" : "Rising sign first (judged correctly), then events across its span"} ==`);
const rows = [];
for (const c of cases) {
  const t = m(c.birth.time);
  const birth = { ...c.birth, timeAccuracy: "exact" };
  let from = Math.max(0, t - 120), to = Math.min(23 * 60 + 58, t + 120), ascSigns;
  if (mode === "sign") {
    const span = (await call("rising", { birth, settings })).rising.find((x) => m(x.from) <= t && t <= m(x.to));
    from = m(span.from); to = m(span.to); ascSigns = [span.sign];
  }
  const body = { birth, events: c.events.map(([date, type, note]) => ({ date, type, note })), from: hhmm(from), to: hhmm(to), stepMin: STEP, settings, ascSigns };
  const r = await call("rectify", body);
  if (!r.rectify) { console.log(c.name, "ERROR", JSON.stringify(r)); continue; }
  const { curve, top } = r.rectify;
  const near = curve.reduce((a, x) => (Math.abs(m(x.time) - t) < Math.abs(m(a.time) - t) ? x : a));
  // Rank of the true time among all candidates, counting a candidate within 4 minutes as the true time.
  const best = Math.max(...curve.filter((x) => Math.abs(m(x.time) - t) <= 4).map((x) => x.score));
  const rank = 1 + new Set(curve.filter((x) => x.score > best && Math.abs(m(x.time) - t) > 4).map((x) => Math.round(m(x.time) / 6))).size;
  const err = m(top[0].time) - t;
  const inTop3 = top.slice(0, 3).some((x) => Math.abs(m(x.time) - t) <= 4);
  // Chance: the average distance from the true time of a time picked at random in the window.
  let chance = 0; for (let x = from; x <= to; x++) chance += Math.abs(x - t); chance /= to - from + 1;
  rows.push({ name: c.name, err, rank, inTop3, chance, best: top[0].time, score: top[0].score, trueScore: near.score });
  console.log(`${c.name.padEnd(26)} window ${hhmm(from)}–${hhmm(to)}  true ${c.birth.time}  best ${top[0].time} (${err >= 0 ? "+" : ""}${err} min)  true-time score ${best.toFixed(2)} vs best ${top[0].score.toFixed(2)}  ${inTop3 ? "in top 3" : ""}`);
}
const within = (n) => rows.filter((r) => Math.abs(r.err) <= n).length;
console.log(`\nBest candidate within 4 min: ${within(4)}/${rows.length} · within 10 min: ${within(10)}/${rows.length} · within 30 min: ${within(30)}/${rows.length} · true time in top 3: ${rows.filter((r) => r.inTop3).length}/${rows.length}`);
const med = (a) => { const v = [...a].sort((x, y) => x - y); return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };
console.log(`Median error: ${med(rows.map((r) => Math.abs(r.err)))} min · by chance in the same windows: ${Math.round(med(rows.map((r) => r.chance)))} min`);
}
await browser.close();
