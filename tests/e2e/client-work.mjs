/**
 * Between-session work: the practitioner shares an assignment, the client sees
 * it in their portal and responds, the practitioner sees the response. Drafts
 * and archived work never reach the client; clients can't respond to them, and
 * practitioners can't change a client's responses.
 *   node tests/e2e/client-work.mjs   (production server running; reads invite links from the outbox)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);

async function lastLink(to, path) {
  for (let i = 0; i < 20; i++) {
    const { rows } = await db.query('select body from outbox where "to"=$1 order by created_at desc limit 1', [to]);
    const m = rows[0]?.body.match(new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_-]+`));
    if (m) return m[0].replace(/^https?:\/\/[^/]+/, BASE);
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No ${path} email for ${to}`);
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));

step("practitioner signs up and loads sample data");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Work");
await page.fill("#em", `work-${stamp}@example.com`);
await page.fill("#pw", "work-password-12345");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
const boot = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
assert.equal(boot.clientWork.length, 4);
assert.equal(boot.workResponses.length, 4);
const { rows: sealed } = await db.query("select data, sealed from client_work where id='w1' order by created_at desc limit 1");
assert.equal(sealed[0].data.instructions, undefined, "instructions are encrypted, not stored in plain data");

step("practitioner shares an assignment from the client's Between Sessions tab");
await page.goto(BASE + "/app/clients/c1?tab=work");
await page.getByRole("heading", { name: /Shared with Amelia/ }).waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "New", exact: true }).click();
const dialog = page.getByRole("dialog");
await dialog.getByText("Journaling prompt").click();
await dialog.getByRole("textbox", { name: "Title" }).fill("Where do you feel at home?");
await dialog.getByRole("textbox", { name: "Prompt" }).fill("Write about a place where you felt completely at ease.");
await dialog.getByRole("button", { name: /Share with Amelia/ }).click();
await page.getByText("Where do you feel at home?").waitFor();
await page.waitForTimeout(1500);
await page.waitForFunction(() => document.body.innerText.includes("All changes saved"), null, { timeout: 15000 });
const after = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const mine = after.clientWork.find((w) => w.title === "Where do you feel at home?");
assert.equal(mine.status, "shared");
assert.ok(mine.sharedAt);

step("invite Amelia; she sees shared work but not the draft");
const ameliaEmail = `amelia-work-${stamp}@example.com`;
await page.evaluate(async ({ email }) => {
  const s = await fetch("/api/v1/bootstrap?view=app").then((r) => r.json());
  const c = s.clients.find((x) => x.id === "c1");
  await fetch("/api/v1/records/clients/c1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, email }) });
  const r = await fetch("/api/v1/portal/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "c1" }) });
  if (!r.ok) throw new Error("invite failed " + (await r.text()));
}, { email: ameliaEmail });
const cpage = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
cpage.on("pageerror", (e) => errors.push("portal: " + e.message));
await cpage.goto(await lastLink(ameliaEmail, "/auth/invite"));
await cpage.fill("#pw", "amelia-password-123");
await cpage.click('button[type="submit"]');
await cpage.waitForURL(/\/portal/);
const pv = await cpage.evaluate(() => fetch("/api/v1/bootstrap?view=portal").then((r) => r.json()));
const bare = (id) => id.slice(id.lastIndexOf("~") + 1);
assert.deepEqual(pv.clientWork.map((w) => bare(w.id)).sort(), ["w1", "w2", "w3", mine.id].sort(), "only shared work");
const pfx = pv.clientWork[0].id.slice(0, pv.clientWork[0].id.lastIndexOf("~") + 1);
assert.ok(pfx && pv.clientWork.every((w) => w.id.startsWith(pfx) && w.clientId === "me"), "portal ids are scoped by practice");
assert.ok(!JSON.stringify(pv).includes("Track your energy around the full moon"), "draft never reaches the portal");

step("server refuses responses to a draft, and practitioner edits to client responses");
const draftStatus = await cpage.evaluate((pfx) =>
  fetch(`/api/v1/portal/work/${encodeURIComponent(pfx + "w4")}/responses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "wr_x", type: "entry", text: "hi", createdAt: "2026-01-01" }) }).then((r) => r.status),
pfx);
assert.equal(draftStatus, 404);
const forge = await page.evaluate(() =>
  fetch("/api/v1/records/workResponses/wr1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "wr1", workId: "w1", clientId: "c1", type: "entry", text: "edited", createdAt: "2026-01-01" }) }).then((r) => r.status),
);
assert.equal(forge, 403);

step("Amelia responds in her portal and marks it done");
await cpage.goto(BASE + "/portal/work");
await cpage.getByRole("heading", { name: "Between Sessions" }).waitFor();
await cpage.getByText("Where do you feel at home?").click();
await cpage.waitForURL(/\/portal\/work\//);
await cpage.getByLabel("Add a journal entry").fill("My grandmother's kitchen in Porto.");
await cpage.getByRole("button", { name: "Add a journal entry" }).click();
await cpage.getByText("My grandmother's kitchen in Porto.").waitFor();
await cpage.getByRole("button", { name: "Mark as done" }).click();
await cpage.getByRole("button", { name: "Not done yet" }).waitFor({ timeout: 10000 }).catch(async (e) => { await cpage.screenshot({ path: "/tmp/claude-0/-home-user/b88cb96c-5176-5059-96be-13468fee106f/scratchpad/work-fail.png", fullPage: true }); throw e; });
await cpage.waitForTimeout(2500);

step("practitioner sees the response, the done mark and a notification");
const final = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const resp = final.workResponses.filter((r) => r.workId === mine.id);
assert.deepEqual(resp.map((r) => r.type).sort(), ["done", "entry"]);
assert.equal(resp.find((r) => r.type === "entry").text, "My grandmother's kitchen in Porto.");
assert.ok(final.notifications.some((n) => n.title === "New client response" && n.href.includes(mine.id)));
await page.goto(BASE + `/app/clients/c1?tab=work&work=${mine.id}`);
await page.getByText("My grandmother's kitchen in Porto.").waitFor({ timeout: 20000 });
await page.getByText("Done by Amelia").first().waitFor();

step("archived work disappears from the portal");
await page.getByRole("button", { name: "Archive" }).first().click();
await page.waitForTimeout(1500);
await page.waitForFunction(() => document.body.innerText.includes("All changes saved"), null, { timeout: 15000 });
const pv2 = await cpage.evaluate(() => fetch("/api/v1/bootstrap?view=portal").then((r) => r.json()));
assert.ok(!pv2.clientWork.some((w) => bare(w.id) === mine.id), "archived work hidden from the client");

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ client work");
