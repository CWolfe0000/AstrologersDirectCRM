/**
 * Passwordless sign-in: a practice created without a password signs in with an
 * emailed link (after a click) or the emailed 6-digit code. Links and codes work
 * once; wrong codes burn the code; unknown emails look the same as known ones;
 * two-factor still applies after the email step; a password can be added later.
 *   node tests/e2e/email-signin.mjs   (production server running; reads emails from the outbox)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const email = `link-${stamp}@example.com`;
const step = (s) => console.log("•", s);
const errors = [];

async function lastMail(to, after) {
  for (let i = 0; i < 40; i++) {
    const { rows } = await db.query('select body, created_at from outbox where "to"=$1 and subject like $2 order by created_at desc limit 1', [to, "%Sign-In Link%"]);
    if (rows[0] && (!after || rows[0].created_at > after)) {
      const body = rows[0].body;
      const url = body.match(/https?:\/\/[^\s]+\/auth\/link\?token=[A-Za-z0-9_-]+/)?.[0].replace(/^https?:\/\/[^/]+/, BASE);
      const code = body.match(/code on the sign-in page: (\d{3}) (\d{3})/);
      return { url, code: code ? code[1] + code[2] : null, at: rows[0].created_at };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("No sign-in email for " + to);
}
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function totp(secret) {
  let bits = 0, value = 0; const bytes = [];
  for (const ch of secret) { value = (value << 5) | A.indexOf(ch); bits += 5; if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac("sha1", Buffer.from(bytes)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1e6).toString().padStart(6, "0");
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const post = (path, body) => page.evaluate(([p, b]) => fetch(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) })), [path, body]);

step("sign up without a password");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Linda");
await page.fill("#em", email);
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
const { rows: u } = await db.query("select password_hash from users where email=$1", [email]);
assert.equal(u[0].password_hash, null);
await post("/api/auth/logout", {});

step("unknown emails get the same answer and no email");
const unknown = await post("/api/auth/email-link", { email: `nobody-${stamp}@example.com` });
assert.equal(unknown.status, 200);
const { rows: none } = await db.query('select 1 from outbox where "to"=$1', [`nobody-${stamp}@example.com`]);
assert.equal(none.length, 0);

step("sign in with the emailed link (needs a click)");
await page.goto(BASE + "/auth/login");
await page.fill("#email", email);
await page.getByRole("button", { name: "Email Me a Sign-In Link" }).click();
await page.getByRole("heading", { name: "Check Your Email" }).waitFor();
const m1 = await lastMail(email);
await page.goto(m1.url);
assert.equal(await page.evaluate(() => fetch("/api/auth/me").then((r) => r.json()).then((j) => j.user)), null, "opening the link alone doesn't sign in");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL(/\/app/);
assert.equal((await post("/api/auth/email-link/verify", { token: new URL(m1.url).searchParams.get("token") })).status, 400, "a link works once");
await post("/api/auth/logout", {});

step("sign in with the emailed code; wrong codes burn it");
await post("/api/auth/email-link", { email });
const m2 = await lastMail(email, m1.at);
const wrong = m2.code === "000000" ? "111111" : "000000";
for (let i = 0; i < 5; i++) assert.equal((await post("/api/auth/email-code", { email, code: wrong })).status, 401);
assert.equal((await post("/api/auth/email-code", { email, code: m2.code })).status, 401, "after 5 misses the right code no longer works");
await post("/api/auth/email-link", { email });
const m3 = await lastMail(email, m2.at);
assert.equal((await post("/api/auth/email-link/verify", { token: new URL(m2.url).searchParams.get("token") })).status, 400, "a newer email retires the older link");
const ok = await post("/api/auth/email-code", { email, code: m3.code.slice(0, 3) + " " + m3.code.slice(3) });
assert.equal(ok.status, 200);
assert.equal(ok.json.redirect, "/app");

step("two-factor still applies after the email step");
const setup = await post("/api/auth/2fa/setup", {});
assert.equal((await post("/api/auth/2fa/enable", { code: totp(setup.json.secret) })).status, 200);
await post("/api/auth/logout", {});
await post("/api/auth/email-link", { email });
const m4 = await lastMail(email, m3.at);
const viaLink = await post("/api/auth/email-link/verify", { token: new URL(m4.url).searchParams.get("token") });
assert.equal(viaLink.json.twoFactor, true);
assert.equal(await page.evaluate(() => fetch("/api/auth/me").then((r) => r.json()).then((j) => j.user)), null, "no session before the second factor");
await new Promise((r) => setTimeout(r, 31_000)); // a fresh TOTP step (codes can't be replayed)
assert.equal((await post("/api/auth/login/2fa", { ticket: viaLink.json.ticket, code: totp(setup.json.secret) })).status, 200);

step("turn two-factor off without a password, then add a password");
await new Promise((r) => setTimeout(r, 31_000));
assert.equal((await post("/api/auth/2fa/disable", { code: totp(setup.json.secret) })).status, 200);
assert.equal((await post("/api/auth/change-password", { next: "a-brand-new-password" })).status, 200);
await post("/api/auth/logout", {});
assert.equal((await post("/api/auth/login", { email, password: "a-brand-new-password" })).status, 200);

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ email sign-in");
