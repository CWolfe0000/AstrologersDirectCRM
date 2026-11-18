/**
 * Create Chart: Person B can be someone new. They're saved to the client's
 * record with their relationship, optionally with their own natal chart, and
 * the relationship chart is created with them.
 *   node tests/e2e/chart-people.mjs   (production server running)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
const state = () => page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));

step("practitioner with sample data");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Pb");
await page.fill("#em", `pb-${stamp}@example.com`);
await page.fill("#pw", "person-b-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));

step("synastry: add a new Person B with a relationship");
await page.goto(BASE + "/app/charts/new?type=synastry&client=c1");
const personB = page.getByLabel(/Person B/);
await personB.waitFor();
await personB.selectOption({ label: "+ Add a New Person…" });
const dialog = page.getByRole("dialog");
await dialog.getByLabel("First Name").fill("Rosa");
await dialog.getByLabel("Last Name").fill(`Hart${stamp}`);
await dialog.getByLabel("Relationship").selectOption("Sibling");
await dialog.getByLabel("Date", { exact: true }).fill("1991-04-02");
await dialog.getByLabel("Time", { exact: true }).fill("08:30");
await dialog.getByPlaceholder("Start typing a town or city…").fill("Par");
await dialog.locator("button", { hasText: "Paris, France" }).first().click();
assert.ok(await dialog.getByRole("checkbox", { name: /natal chart/ }).isChecked(), "saving their natal chart is offered, on by default");
await dialog.getByRole("button", { name: /Add Person/ }).click();
await dialog.waitFor({ state: "detached" });

step("Person B is the new person, and the chart saves with them");
const chosen = await personB.inputValue();
let s = await state();
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await state();
const rosa = s.people.find((p) => p.lastName === `Hart${stamp}`);
assert.ok(rosa, "person saved");
assert.equal(chosen, rosa.id, "selected as Person B");
assert.equal(rosa.clientId, "c1");
assert.equal(rosa.relationship, "Sibling");
assert.ok(s.charts.some((c) => c.type === "natal" && c.personIds[0] === rosa.id && c.clientId === "c1"), "their natal chart saved to the client");
await page.getByRole("button", { name: /Save & Open Workspace/i }).click();
await page.waitForURL(/\/app\/charts\/(?!new)/);
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await state();
assert.ok(s.charts.some((c) => c.type === "synastry" && c.personIds.includes(rosa.id) && c.personIds.includes("c1")), "synastry chart created with Rosa");

step("adding without a natal chart");
await page.goto(BASE + "/app/charts/new?type=composite&client=c1");
await page.getByLabel(/Person B/).selectOption({ label: "+ Add a New Person…" });
await dialog.getByLabel("First Name").fill("Theo");
await dialog.getByLabel("Last Name").fill(`Lane${stamp}`);
await dialog.getByLabel("Relationship").selectOption("Other");
await dialog.getByLabel(/Who Are They to/).fill("godparent");
await dialog.getByLabel("Date", { exact: true }).fill("1988-12-12");
await dialog.getByPlaceholder("Start typing a town or city…").fill("Par");
await dialog.locator("button", { hasText: "Paris, France" }).first().click();
await dialog.getByRole("checkbox", { name: /natal chart/ }).uncheck();
await dialog.getByRole("button", { name: "Add Person", exact: true }).click();
await dialog.waitFor({ state: "detached" });
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await state();
const theo = s.people.find((p) => p.lastName === `Lane${stamp}`);
assert.ok(theo && !s.charts.some((c) => c.personIds[0] === theo.id && c.type === "natal"), "no natal chart when unticked");
assert.equal(theo.relationship, "Godparent", "Other: the typed relationship, capitalized");

assert.deepEqual(errors, []);
await browser.close();
console.log("✓ chart people");
