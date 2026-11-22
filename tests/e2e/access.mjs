/**
 * Private beta: sign-up needs approval; a practitioner requests access on the
 * website; the admin approves; the emailed single-use link creates the account.
 *   node tests/e2e/access.mjs   (server running with ADMIN_EMAILS=admin-e2e@example.com, CONTACT_EMAIL set)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN = "admin-e2e@example.com";
const CONTACT = process.env.CONTACT_EMAIL || "hello@example.com";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const applicant = `applicant-${stamp}@example.com`;
const mail = async (to) => (await db.query('select subject, body from outbox where "to"=$1 order by created_at', [to])).rows;

await db.query("delete from practices where id in (select practice_id from users where email=$1)", [ADMIN]);
const browser = await chromium.launch();
const admin = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
admin.on("pageerror", (e) => errors.push("admin: " + e.message));
const call = (p, url, init) =>
  p.evaluate(async ({ url, init }) => {
    const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined);
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { url, init });

step("the admin turns on approval for new accounts");
await admin.goto(BASE + "/auth/signup");
await admin.fill("#fn", "Admin");
await admin.fill("#em", ADMIN);
await admin.fill("#pw", "access-admin-pass-1");
await admin.check('input[type="checkbox"][required]');
await admin.click('button[type="submit"]');
await admin.waitForURL(/verify/);
await db.query("update users set totp_enabled_at=now() where email=$1", [ADMIN]);
assert.equal((await call(admin, "/api/admin/settings", { method: "PUT", body: JSON.stringify({ inviteOnly: true }) })).status, 200);

try {
  step("sign-up now asks visitors to request access");
  const v = await (await browser.newContext()).newPage();
  v.on("pageerror", (e) => errors.push("visitor: " + e.message));
  await v.goto(BASE + "/auth/signup");
  await v.getByRole("heading", { name: "AstrologersDirect Is in Private Beta" }).waitFor();
  const blocked = await call(v, "/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Sneaky", practice: "X", email: `sneaky-${stamp}@example.com`, emailConsent: true }) });
  assert.equal(blocked.status, 403);

  step("a practitioner requests access on the website");
  await v.getByRole("link", { name: "Request Access" }).click();
  await v.waitForURL(/request-access/);
  await v.getByLabel("Your Name").fill("Iris Moon");
  await v.getByLabel("Email", { exact: true }).fill(applicant);
  await v.getByLabel(/Practice Name/).fill("Moonlit Charts");
  await v.getByLabel(/Years in Practice/).selectOption("5–10 years");
  await v.getByLabel(/Tell Us About Your Practice/).fill("Evolutionary astrology, mostly video sessions.");
  await v.getByRole("checkbox", { name: /receive emails from AstrologersDirect/ }).check();
  await v.getByRole("button", { name: "Request Access" }).click();
  await v.getByText("Thank You. Your Request Is In.").waitFor();
  const { rows: [reqRow] } = await db.query("select email_consent_at from access_requests where email=$1", [applicant]);
  assert.ok(reqRow?.email_consent_at, "email consent recorded with the request");
  assert.ok((await mail(applicant)).some((m) => m.subject === "We’ve received your request for AstrologersDirect"));
  assert.ok((await mail(CONTACT)).some((m) => m.subject === "Beta request: Iris Moon" && m.body.includes("Moonlit Charts")));
  // Asking twice doesn't duplicate.
  await call(v, "/api/public/access-request", { method: "POST", body: JSON.stringify({ name: "Iris Moon", email: applicant, practice: "", website: "", experience: "", about: "", emailConsent: true }) });
  assert.equal((await db.query("select count(*)::int n from access_requests where email=$1", [applicant])).rows[0].n, 1);

  step("the admin approves it");
  await admin.goto(BASE + "/app/admin");
  const row = admin.getByRole("listitem").filter({ hasText: applicant });
  await row.waitFor();
  await row.getByRole("button", { name: "Approve" }).click();
  await admin.getByText("Invitation Sent").waitFor();
  const invite = (await mail(applicant)).find((m) => m.subject.startsWith("You’re in"));
  assert.ok(invite, "invitation emailed");
  const link = invite.body.match(/https?:\/\/[^\s]+\/auth\/signup\?invite=[A-Za-z0-9_-]+/)[0].replace(/^https?:\/\/[^/]+/, BASE);

  step("the link creates their account, once");
  const token = new URL(link).searchParams.get("invite");
  assert.equal((await call(v, "/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Someone Else", practice: "X", email: `other-${stamp}@example.com`, invite: token, emailConsent: true }) })).status, 403, "only for the invited address");
  await v.goto(link);
  await v.getByRole("heading", { name: "Welcome, Iris" }).waitFor();
  assert.equal(await v.locator("#em").inputValue(), applicant);
  assert.equal(await v.locator("#pn").inputValue(), "Moonlit Charts");
  await v.check('input[type="checkbox"][required]');
  await v.click('button[type="submit"]');
  await v.waitForURL(/verify/);
  assert.equal((await db.query("select count(*)::int n from users where email=$1 and role='owner'", [applicant])).rows[0].n, 1);
  assert.equal((await db.query("select status from access_requests where email=$1", [applicant])).rows[0].status, "joined");
  const again = await (await browser.newContext()).newPage();
  await again.goto(link);
  await again.getByText(/already been used/).waitFor();

  step("existing accounts and bots get no special treatment");
  const r1 = await call(v, "/api/public/access-request", { method: "POST", body: JSON.stringify({ name: "Admin", email: ADMIN, practice: "", website: "", experience: "", about: "", emailConsent: true }) });
  assert.equal(r1.status, 200, "same response whether or not an account exists");
  assert.ok((await mail(ADMIN)).some((m) => m.subject === "You already have an AstrologersDirect account"));
  await call(v, "/api/public/access-request", { method: "POST", body: JSON.stringify({ name: "Bot", email: `bot-${stamp}@example.com`, practice: "", website: "", experience: "", about: "", company: "spam", emailConsent: true }) });
  assert.equal((await db.query("select count(*)::int n from access_requests where email=$1", [`bot-${stamp}@example.com`])).rows[0].n, 0);
} finally {
  // Other tests sign up freely: always reopen sign-up.
  await call(admin, "/api/admin/settings", { method: "PUT", body: JSON.stringify({ inviteOnly: false }) });
}

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ beta access");
