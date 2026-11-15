/**
 * End-to-end smoke test against a running server (npm run build && npm start).
 *   BASE_URL=http://localhost:3000 DATABASE_URL=... node tests/e2e/smoke.mjs
 * Reads emailed links from the outbox table (development email delivery).
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
const owner = { first: "Test", last: "Astrologer", email: `owner-${stamp}@example.com`, password: "correct-horse-battery" };
const errors = [];

async function lastLink(to, path) {
  for (let i = 0; i < 20; i++) {
    const { rows } = await db.query("select body from outbox where \"to\"=$1 order by created_at desc limit 1", [to]);
    const m = rows[0]?.body.match(new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_-]+`));
    if (m) return m[0].replace(/^https?:\/\/[^/]+/, BASE);
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No ${path} email for ${to}`);
}
const step = (s) => console.log("•", s);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));

step("signed-out /app redirects to login");
await page.goto(BASE + "/app");
await page.waitForURL(/\/auth\/login/);

step("sign up");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", owner.first);
await page.fill("#ln", owner.last);
await page.fill("#em", owner.email);
await page.fill("#pn", "Test Practice");
await page.fill("#pw", owner.password);
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/\/auth\/verify/);

step("verify email from outbox link");
await page.goto(await lastLink(owner.email, "/auth/verify"));
await page.getByText("Email confirmed").waitFor();

step("empty workspace loads");
await page.goto(BASE + "/app");
await page.getByText("Load sample data").waitFor({ timeout: 15000 });

step("load sample data");
await page.getByText("Load sample data").click();
await page.getByText("Sample data added").waitFor({ timeout: 30000 });
await page.goto(BASE + "/app/clients");
await page.getByText("Amelia Hart").first().waitFor();

step("an edit is saved to the server and survives reload");
await page.goto(BASE + "/app/tasks");
const before = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const openTask = before.tasks.find((t) => t.status !== "done");
await page.getByText(openTask.title).first().waitFor();
const row = page.locator("li", { hasText: openTask.title }).first();
await row.locator('input[type="checkbox"]').first().click();
await page.getByText("All changes saved").waitFor({ timeout: 10000 });
await page.reload();
const after = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
assert.equal(after.tasks.find((t) => t.id === openTask.id).status, "done", "task completion persisted");

step("new-client wizard creates a client and natal chart on the server");
await page.goto(BASE + "/app/clients/new");
await page.fill("#fn", "Iris");
await page.fill("#ln", "Vale");
await page.fill("#em", `iris-${stamp}@example.com`);
await page.getByRole("button", { name: /^Next/ }).click();
await page.fill("#bd", "1991-04-02");
await page.fill("#bt", "08:30");
await page.fill("#bp", "Lon");
await page.locator("button", { hasText: "London" }).first().click();
await page.getByRole("button", { name: /Generate natal chart/ }).click();
const cont = page.getByRole("button", { name: /^Continue/ });
if (await cont.count()) await cont.click();
await page.getByRole("button", { name: /Save client & chart/ }).click();
await page.waitForURL(/\/app\/clients\/(?!new)[^/?]+/);
await page.getByText("All changes saved").waitFor({ timeout: 10000 });
const withIris = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const iris = withIris.people.find((p) => p.firstName === "Iris" && p.lastName === "Vale");
assert.ok(iris, "client person saved");
assert.ok(withIris.clients.some((c) => c.id === iris.id), "client record saved");
assert.ok(withIris.charts.some((c) => c.clientId === iris.id && c.type === "natal"), "natal chart saved");
assert.equal(iris.birth.date, "1991-04-02", "birth date round-trips through encryption");

step("sensitive fields are encrypted at rest");
const { rows: obs } = await db.query("select data, sealed from observations where id='o1' order by created_at desc limit 1");
assert.ok(obs[0].sealed?.startsWith("v1."), "observation sealed");
assert.equal(obs[0].data.body, undefined, "observation body not stored in plain data");
const { rows: ppl } = await db.query("select data from people where id='c1' order by created_at desc limit 1");
assert.equal(ppl[0].data.birth, undefined, "birth data not stored in plain data");

step("invite Amelia to the portal");
const { rows: cl } = await db.query("select p.id practice from users u join practices p on p.id=u.practice_id where u.email=$1", [owner.email]);
const practiceId = cl[0].practice;
// give Amelia a unique email so the test can be re-run
const ameliaEmail = `amelia-${stamp}@example.com`;
await page.evaluate(async ({ email }) => {
  const s = await fetch("/api/v1/bootstrap?view=app").then((r) => r.json());
  const c = s.clients.find((x) => x.id === "c1");
  await fetch("/api/v1/records/clients/c1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, email }) });
  const r = await fetch("/api/v1/portal/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "c1" }) });
  if (!r.ok) throw new Error("invite failed " + (await r.text()));
}, { email: ameliaEmail });

step("client accepts invitation and sees only their portal");
const cctx = await browser.newContext();
const cpage = await cctx.newPage();
cpage.on("pageerror", (e) => errors.push("portal: " + e.message));
await cpage.goto(await lastLink(ameliaEmail, "/auth/invite"));
await cpage.fill("#pw", "amelia-password-1");
await cpage.click('button[type="submit"]');
await cpage.waitForURL(/\/portal/);
await cpage.getByText("Good", { exact: false }).first().waitFor({ timeout: 15000 });
const pv = await cpage.evaluate(() => fetch("/api/v1/bootstrap?view=portal").then((r) => r.json()));
const raw = JSON.stringify(pv);
assert.ok(pv.readings.length > 0 && pv.readings.every((r) => r.clientId === "c1" && r.status === "delivered"), "only own delivered readings");
assert.ok(!/prepNotes|sessionNotes|observations|"tasks"/.test(raw), "no practitioner-only data in portal view");
assert.ok(pv.files.every((f) => !f.private), "no private files");
const forbidden = await cpage.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.status));
assert.equal(forbidden, 403, "client cannot load the practitioner workspace");
const write = await cpage.evaluate(() => fetch("/api/v1/records/tasks/x", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }).then((r) => r.status));
assert.equal(write, 403, "client cannot write practice records");

step("a second practice cannot see the first practice's data");
const ctx2 = await browser.newContext();
const p2 = await ctx2.newPage();
await p2.goto(BASE + "/auth/signup");
await p2.fill("#fn", "Other");
await p2.fill("#em", `other-${stamp}@example.com`);
await p2.fill("#pw", "another-strong-pass");
await p2.check('input[type="checkbox"][required]');
await p2.click('button[type="submit"]');
await p2.waitForURL(/\/auth\/verify/);
const other = await p2.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
assert.equal(other.clients.length, 0, "new practice starts empty");
const peek = await p2.evaluate(() => fetch("/api/v1/bootstrap?view=portal&as=c1").then((r) => r.status));
assert.equal(peek, 404, "cannot preview another practice's client");
// Writing a record with the same id only affects the writer's own practice.
await p2.evaluate(() =>
  fetch("/api/v1/records/clients/c1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "c1", email: "x@example.com", status: "active", createdAt: "2026-01-01", tags: [], portalAccess: "none" }) }),
);
const { rows: c1rows } = await db.query("select practice_id from clients where id='c1'");
assert.ok(c1rows.some((r) => r.practice_id === practiceId), "original c1 untouched");

step("session list: a second device appears and can be signed out remotely");
const devCtx = await browser.newContext();
const dev = await devCtx.newPage();
await dev.goto(BASE + "/auth/login");
await dev.fill("#email", owner.email);
await dev.fill("#password", owner.password);
await dev.click('button[type="submit"]');
await dev.waitForURL(/\/app/);
const list = await page.evaluate(() => fetch("/api/auth/sessions").then((r) => r.json()));
assert.ok(list.sessions.length >= 2 && list.sessions.filter((x) => x.current).length === 1, "both sessions listed, one current");
await page.evaluate(() => fetch("/api/auth/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ others: true }) }));
const after2 = await dev.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.status));
assert.equal(after2, 401, "other device signed out");
assert.equal(await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.status)), 200, "this device still signed in");

step("sign out, then sign back in");
await page.goto(BASE + "/app");
await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
await page.goto(BASE + "/app");
await page.waitForURL(/\/auth\/login/);
// A crafted ?next= must not send the user off-site after signing in.
await page.goto(BASE + "/auth/login?next=" + encodeURIComponent("/\\evil.example/phish"));
await page.fill("#email", owner.email);
await page.fill("#password", "wrong-password-123");
await page.click('button[type="submit"]');
await page.getByText("don't match").waitFor();
await page.fill("#password", owner.password);
await page.click('button[type="submit"]');
await page.waitForURL(/\/app$/);
assert.equal(new URL(page.url()).host, new URL(BASE).host, "stayed on our site");
await page.getByText("Amelia Hart").first().waitFor({ timeout: 15000 });

step("repeated wrong passwords lock the account for a while");
{
  const lctx = await browser.newContext();
  const lp = await lctx.newPage();
  await lp.goto(BASE + "/auth/login");
  const tryLogin = (pw) => lp.evaluate(([e, p]) => fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": Math.random().toString() }, body: JSON.stringify({ email: e, password: p }) }).then((r) => r.status), [owner.email, pw]);
  for (let i = 0; i < 8; i++) assert.equal(await tryLogin("wrong-" + i), 401);
  assert.equal(await tryLogin(owner.password), 429, "locked even with the right password (and a spoofed IP header doesn't help)");
  await db.query("update users set failed_logins=0, locked_until=null where email=$1", [owner.email]);
  assert.equal(await tryLogin(owner.password), 200, "unlocked after the lock period");
}

await browser.close();
await db.end();
if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("✓ smoke test passed");
