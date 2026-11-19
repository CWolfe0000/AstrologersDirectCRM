/**
 * Natal promise: the chart page's Promise tab judges all 12 houses with a
 * verdict, a reading and a technical breakdown.
 *   node tests/e2e/promise.mjs   (production server running; SHOTS=dir saves screenshots)
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

step("practitioner with sample data");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Pro");
await page.fill("#em", `pro-${Date.now().toString(36)}@example.com`);
await page.fill("#pw", "promise-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
const state = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const natal = state.charts.find((c) => c.type === "natal");
assert.ok(natal, "a sample natal chart");

step("Promise tab: 12 houses, verdicts, breakdowns");
await page.goto(BASE + `/app/charts/${natal.id}`);
await page.getByRole("tab", { name: "Promise" }).click();
const items = page.locator("li", { hasText: / House · / });
await items.first().waitFor();
assert.equal(await items.count(), 12);
const verdicts = await items.locator("span.rounded-full").allInnerTexts();
assert.ok(verdicts.every((v) => /^(Strong|Good|Mixed|Challenged) [+-]?\d/.test(v)), verdicts.join(" | "));
await items.first().getByText("Technical Breakdown").click();
await items.first().getByText("Ruler Condition").waitFor();
await page.getByText("How the Promise Is Judged").waitFor();
const ws = await page.getByText(/Whole Sign Houses/).count();
assert.equal(ws, 1);
// Chart houses toggle (only offered when the chart isn't already whole sign).
const toggle = page.getByRole("radio", { name: "Chart Houses" }).or(page.getByRole("button", { name: "Chart Houses" }));
if (await toggle.count()) {
  await toggle.first().click();
  await page.getByText(/Chart Houses, With the 5° Rule/).waitFor();
}
if (SHOTS) await page.screenshot({ path: `${SHOTS}/promise.png`, fullPage: true });

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ natal promise");
