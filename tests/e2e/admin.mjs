/**
 * Platform admin: only ADMIN_EMAILS owners with two-step verification get in;
 * they can change a practice's plan and delete a practice; others get 404.
 *   node tests/e2e/admin.mjs   (server running with ADMIN_EMAILS=admin-e2e@example.com)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN = "admin-e2e@example.com";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);

// The admin address is fixed (it's in the server's ADMIN_EMAILS), so clear an earlier run.
await db.query("delete from practices where id in (select practice_id from users where email=$1)", [ADMIN]);

const browser = await chromium.launch();
async function signUp(email, name) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  page.on("pageerror", (e) => errors.push(`${email}: ${e.message}`));
  await page.goto(BASE + "/auth/signup");
  await page.fill("#fn", name);
  await page.fill("#em", email);
  await page.fill("#pn", `${name} Practice`);
  await page.fill("#pw", "admin-test-pass-1");
  await page.check('input[type="checkbox"][required]');
  await page.click('button[type="submit"]');
  await page.waitForURL(/verify/);
  return page;
}
const status = (page, url, init) =>
  page.evaluate(async ({ url, init }) => (await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined)).status, { url, init });

step("admin needs two-step verification");
const admin = await signUp(ADMIN, "Admin");
assert.equal(await status(admin, "/api/admin/practices"), 403);
await admin.goto(BASE + "/app/admin");
await admin.getByText("Turn on two-step verification").waitFor();
await db.query("update users set totp_enabled_at=now() where email=$1", [ADMIN]);
assert.equal(await status(admin, "/api/admin/practices"), 200);

step("everyone else gets 404");
const otherEmail = `admin-target-${stamp}@example.com`;
const other = await signUp(otherEmail, "Target");
await other.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
assert.equal(await status(other, "/api/admin/practices"), 404);
const { rows: [{ practice_id: targetId }] } = await db.query("select practice_id from users where email=$1", [otherEmail]);
assert.equal(await status(other, `/api/admin/practices/${targetId}`, { method: "PATCH", body: JSON.stringify({ plan: "premium" }) }), 404);
await other.goto(BASE + "/app");
await other.getByText("Dashboard").first().waitFor();
assert.equal(await other.getByRole("link", { name: "Admin", exact: true }).count(), 0, "no admin link for others");

step("admin sees every practice, with counts");
await admin.goto(BASE + "/app/admin");
await admin.getByRole("link", { name: "Admin", exact: true }).waitFor();
await admin.getByPlaceholder("Search by practice, name or email").fill(otherEmail);
const row = admin.getByRole("row").filter({ hasText: otherEmail });
await row.waitFor();
const { rows: [{ n }] } = await db.query("select count(*)::int n from clients where practice_id=$1", [targetId]);
assert.ok(n > 0 && (await row.innerText()).includes(String(n)), "client count shown");

step("change the plan");
const before = (await db.query("select plan from practices where id=$1", [targetId])).rows[0].plan;
const next = before === "premium" ? "standard" : "premium";
await row.getByRole("combobox").selectOption(next);
await admin.getByText("Plan updated").waitFor();
assert.equal((await db.query("select plan from practices where id=$1", [targetId])).rows[0].plan, next);

step("delete a practice (typing the owner's email)");
await row.getByRole("button", { name: /Delete/ }).click();
const dialog = admin.getByRole("dialog");
const del = dialog.getByRole("button", { name: "Delete permanently" });
assert.ok(await del.isDisabled(), "disabled until confirmed");
await dialog.getByLabel(/to confirm/).fill(otherEmail);
await del.click();
await admin.getByText("Practice deleted").waitFor();
assert.equal((await db.query("select count(*)::int n from practices where id=$1", [targetId])).rows[0].n, 0, "practice gone");
assert.equal((await db.query("select count(*)::int n from users where email=$1", [otherEmail])).rows[0].n, 0, "owner gone");
const { rows: events } = await db.query("select action from admin_events where practice_id=$1 order by at", [targetId]);
assert.deepEqual(events.map((e) => e.action), ["plan", "delete"], "both actions logged");

step("the admin can't delete their own practice here");
const { rows: [{ practice_id: adminPractice }] } = await db.query("select practice_id from users where email=$1", [ADMIN]);
assert.equal(await status(admin, `/api/admin/practices/${adminPractice}`, { method: "DELETE", body: JSON.stringify({ confirm: ADMIN }) }), 400);

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ admin");
