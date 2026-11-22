/**
 * Exercises the main create/edit flows through the real UI against the server
 * and fails if any background save is rejected (e.g. a validation mismatch).
 *   node tests/e2e/flows.mjs   (server running, sample data loaded per run)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now().toString(36);
const rejected = [];
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", async (r) => {
  if (r.url().includes("/api/v1/") && r.request().method() !== "GET" && r.status() >= 400)
    rejected.push(`${r.request().method()} ${new URL(r.url()).pathname} → ${r.status()} ${await r.text().catch(() => "")}`);
});
const step = (s) => console.log("•", s);
const saved = () => page.getByText("All changes saved").waitFor({ timeout: 10000 });
const state = () => page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));

step("sign up + sample data");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Flow");
await page.fill("#em", `flow-${stamp}@example.com`);
await page.fill("#pw", "flow-password-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));

step("schedule a consultation");
await page.goto(BASE + "/app/consultations?new=1&client=c1");
await page.getByRole("button", { name: "Schedule Consultation" }).click();
await saved();
assert.ok((await state()).consultations.length > 26, "consultation saved");

step("create a task with a checklist");
await page.goto(BASE + "/app/tasks?new=1&client=c2");
const dlg = page.getByRole("dialog");
await dlg.locator("input").first().fill(`Follow-up ${stamp}`);
await dlg.locator("textarea").last().fill("First item\nSecond item");
await page.getByRole("button", { name: "Create Task" }).click();
await saved();
assert.ok((await state()).tasks.some((t) => t.title === `Follow-up ${stamp}` && t.checklist.length === 2), "task saved");

step("write an observation (autosave + revision)");
await page.goto(BASE + "/app/observations?new=1&chart=ch1");
await page.getByPlaceholder("Observation Title").fill(`Moon notes ${stamp}`);
const body = page.locator("[contenteditable=true]").first();
await body.click();
await page.keyboard.type("Tested from the flows script.");
await page.getByPlaceholder("Observation Title").click();
await page.waitForTimeout(1500);
await saved();
const o = (await state()).observations.find((x) => x.title === `Moon notes ${stamp}`);
assert.ok(o, "observation saved");
assert.equal(o.scope, "natal");
assert.ok(o.body.includes("Tested from the flows script"), "observation body saved");

step("deliver an external link to Amelia");
await page.goto(BASE + "/app/delivery?new=1&client=c1");
const d = page.getByRole("dialog");
for (let i = 0; i < 4; i++) {
  if (await d.getByPlaceholder("e.g. Solar Return 2027 — Relocated to Lisbon").count()) break;
  await d.getByRole("button", { name: /Continue/ }).click();
}
await d.getByPlaceholder("e.g. Solar Return 2027 — Relocated to Lisbon").fill(`Link reading ${stamp}`);
await d.getByRole("tab", { name: /External link/ }).click().catch(async () => d.getByText("External link").click());
await d.getByPlaceholder("https://").fill("https://example.com/reading");
for (let i = 0; i < 4 && !(await d.getByRole("button", { name: /Send to Client Portal/ }).count()); i++) await d.getByRole("button", { name: /Continue/ }).click();
await d.getByRole("button", { name: /Send to Client Portal/ }).click();
await saved();
const s = await state();
const r = s.readings.find((x) => x.title === `Link reading ${stamp}`);
assert.ok(r && r.status === "delivered", "reading delivered");
assert.ok(s.portalNotifications.some((n) => n.clientId === "c1" && n.body.includes(`Link reading ${stamp}`)), "client notified in portal");

step("change astrology defaults");
await page.goto(BASE + "/app/settings?section=astrology");
await page.locator('select:visible:has(option[value="whole-sign"])').first().selectOption("whole-sign");
await saved();
assert.equal((await state()).defaults.houseSystem, "whole-sign", "defaults saved");

step("delete a task");
await page.goto(BASE + "/app/tasks?id=t11");
await page.getByRole("button", { name: /Delete/ }).first().click();
const confirmBtn = page.getByRole("button", { name: /Delete task|Delete permanently|Yes, delete/ });
if (await confirmBtn.count()) await confirmBtn.first().click();
await saved();
assert.ok(!(await state()).tasks.some((t) => t.id === "t11"), "task deleted on server");

await browser.close();
if (rejected.length || errors.length) {
  console.error("Rejected saves:\n" + rejected.join("\n") + "\nPage errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("✓ flows passed");
