/**
 * One portal per client: a client who sees two astrologers has one login and
 * one portal showing both. Ids are scoped by practice, each astrologer only
 * sees what the client does for them, and when one astrologer removes access
 * (or deletes their practice) the client keeps the other.
 *   node tests/e2e/multi-practice.mjs   (production server running; reads links from the outbox)
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
const clientEmail = `shared-client-${stamp}@example.com`;

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
const json = (p, url, init) =>
  p.evaluate(async ({ url, init }) => {
    const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined);
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { url, init });

/** A practitioner with sample data whose client Amelia (c1) uses the shared email, invited to the portal. */
async function practice(first, practiceName) {
  const page = await (await browser.newContext()).newPage();
  page.on("pageerror", (e) => errors.push(`${first}: ${e.message}`));
  await page.goto(BASE + "/auth/signup");
  await page.fill("#fn", first);
  await page.fill("#em", `${first.toLowerCase()}-${stamp}@example.com`);
  await page.fill("#pn", practiceName);
  await page.fill("#pw", "multi-practice-pass-1");
  await page.check('input[type="checkbox"][required]');
  await page.click('button[type="submit"]');
  await page.waitForURL(/verify/);
  await json(page, "/api/v1/sample-data", { method: "POST", body: "{}" });
  const s = (await json(page, "/api/v1/bootstrap?view=app")).body;
  const c1 = s.clients.find((c) => c.id === "c1");
  assert.equal((await json(page, "/api/v1/records/clients/c1", { method: "PUT", body: JSON.stringify({ ...c1, email: clientEmail }) })).status, 200);
  const inv = await json(page, "/api/v1/portal/invite", { method: "POST", body: JSON.stringify({ clientId: "c1" }) });
  assert.equal(inv.status, 200, `invite from ${first}: ${JSON.stringify(inv.body)}`);
  const { rows } = await db.query("select practice_id from users where email=$1", [`${first.toLowerCase()}-${stamp}@example.com`]);
  return { page, practiceId: rows[0].practice_id };
}

step("astrologer A invites the client; the client accepts");
const A = await practice("Maya", "Maya Astrology");
const cctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const cp = await cctx.newPage();
cp.on("pageerror", (e) => errors.push("portal: " + e.message));
await cp.goto(await lastLink(clientEmail, "/auth/invite"));
await cp.fill("#pw", "client-own-password-1");
await cp.click('button[type="submit"]');
await cp.waitForURL(/\/portal/);
const { rows: [{ password_hash: hash1 }] } = await db.query("select password_hash from users where email=$1", [clientEmail]);

step("astrologer B invites the same email: one login, no new password");
const B = await practice("Leo", "Leo Charts");
const { rows: users } = await db.query("select id from users where email=$1", [clientEmail]);
assert.equal(users.length, 1, "still one login");
const { rows: links } = await db.query("select practice_id from client_access where user_id=$1", [users[0].id]);
assert.deepEqual(links.map((l) => l.practice_id).sort(), [A.practiceId, B.practiceId].sort(), "linked to both practices");
await cp.goto(await lastLink(clientEmail, "/auth/invite"));
await cp.getByText("You already have a portal with another astrologer").waitFor();
assert.equal(await cp.locator("#pw").count(), 0, "no password field for a login that has one");
await cp.click('button[type="submit"]');
await cp.waitForURL(/\/portal/);
const { rows: [{ password_hash: hash2 }] } = await db.query("select password_hash from users where email=$1", [clientEmail]);
assert.equal(hash2, hash1, "password unchanged");

step("the portal shows both astrologers, with ids scoped by practice");
const pv = (await json(cp, "/api/v1/bootstrap?view=portal")).body;
assert.deepEqual(pv.practices.map((p) => p.id).sort(), [A.practiceId, B.practiceId].sort());
const ids = pv.readings.map((r) => r.id);
assert.equal(new Set(ids).size, ids.length, "no id collisions across practices");
for (const coll of ["readings", "clientWork", "consultations", "files", "workResponses"])
  assert.ok(pv[coll].every((r) => r.clientId === "me" && r.id.startsWith(`${r.practiceId}~`)), `${coll} scoped`);
assert.ok(pv.readings.some((r) => r.practiceId === A.practiceId) && pv.readings.some((r) => r.practiceId === B.practiceId), "readings from both");
await cp.goto(BASE + "/portal");
await cp.getByText("Your astrologer").nth(1).waitFor();
await cp.goto(BASE + "/portal/work");
const filter = cp.getByRole("group", { name: "Filter by astrologer" });
await filter.waitFor();
const before = await cp.locator('a[href^="/portal/work/"]').count();
await filter.getByRole("button").nth(1).click();
const after = await cp.locator('a[href^="/portal/work/"]').count();
assert.ok(after > 0 && after < before, "filtering by astrologer narrows the list");

step("the client responds to B's work; only B sees it");
const bWork = pv.clientWork.find((w) => w.practiceId === B.practiceId && w.status === "shared");
await cp.goto(BASE + `/portal/work/${bWork.id}`);
await cp.getByLabel("Add a journal entry").fill("For Leo only.");
await cp.getByRole("button", { name: "Add a journal entry" }).click();
await cp.getByText("For Leo only.").waitFor();
await cp.waitForTimeout(2500);
const bState = (await json(B.page, "/api/v1/bootstrap?view=app")).body;
assert.ok(bState.workResponses.some((r) => r.text === "For Leo only." && r.workId === bWork.id.split("~").pop() && r.clientId === "c1"), "stored unscoped in B's practice");
assert.ok(bState.notifications.some((n) => n.title === "New client response"));
const aState = (await json(A.page, "/api/v1/bootstrap?view=app")).body;
assert.ok(!JSON.stringify(aState).includes("For Leo only."), "A never sees it");

step("a forged practice prefix is refused");
const other = (await json(cp, `/api/v1/portal/work/${encodeURIComponent(`prc_notmine~w1`)}/responses`, { method: "POST", body: JSON.stringify({ id: "x", type: "done", createdAt: "2026-01-01" }) })).status;
assert.equal(other, 404);

step("A turns portal access off: the client keeps B");
const c1 = aState.clients.find((c) => c.id === "c1");
await json(A.page, "/api/v1/records/clients/c1", { method: "PUT", body: JSON.stringify({ ...c1, portalAccess: "none" }) });
const pv2 = await json(cp, "/api/v1/bootstrap?view=portal");
assert.equal(pv2.status, 200, "still signed in");
assert.deepEqual(pv2.body.practices.map((p) => p.id), [B.practiceId]);
assert.ok(pv2.body.readings.every((r) => r.practiceId === B.practiceId), "A's readings are gone");

step("B deletes their practice: the client's login goes with it");
const del = await json(B.page, "/api/v1/account", { method: "DELETE", body: JSON.stringify({ password: "multi-practice-pass-1", confirm: "DELETE" }) });
assert.ok(del.status === 200, `account delete: ${JSON.stringify(del.body)}`);
const { rows: gone } = await db.query("select id from users where email=$1", [clientEmail]);
assert.equal(gone.length, 0, "no practices left, so no login");
assert.equal((await json(cp, "/api/v1/bootstrap?view=portal")).status, 401);

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ multi-practice portal");
