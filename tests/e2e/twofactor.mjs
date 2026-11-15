/**
 * Two-factor authentication end-to-end.
 *   node tests/e2e/twofactor.mjs   (server running)
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
const email = `tfa-${stamp}@example.com`;
const password = "two-factor-pass-1";
const step = (s) => console.log("•", s);

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function code(secret, offset = 0) {
  let bits = 0, value = 0; const bytes = [];
  for (const ch of secret) { value = (value << 5) | A.indexOf(ch); bits += 5; if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const h = createHmac("sha1", Buffer.from(bytes)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1e6).toString().padStart(6, "0");
}

// Each code can be used once: wait for a time step we haven't used yet.
let lastStep = -1;
async function freshCode(secret) {
  while (Math.floor(Date.now() / 30000) <= lastStep) await new Promise((r) => setTimeout(r, 1000));
  lastStep = Math.floor(Date.now() / 30000);
  return code(secret);
}

const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();

step("sign up and set up two-factor in Settings");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Tfa");
await page.fill("#em", email);
await page.fill("#pw", password);
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.goto(BASE + "/app/settings?section=security");
await page.getByRole("button", { name: "Set up" }).click();
const dialog = page.getByRole("dialog");
const secret = (await dialog.locator("span.font-mono").innerText()).trim();
await dialog.locator("#tfa").fill("000000");
await dialog.getByRole("button", { name: "Turn on" }).click();
await dialog.getByText("didn’t match").waitFor();
await dialog.locator("#tfa").fill(await freshCode(secret));
await dialog.getByRole("button", { name: "Turn on" }).click();
await page.getByText("Save your recovery codes").waitFor();
const recovery = (await page.getByRole("dialog").locator(".font-mono span").allInnerTexts()).map((s) => s.trim());
assert.equal(recovery.length, 10);
await page.getByRole("button", { name: "I’ve saved them" }).click();

step("sign-in now needs a code");
await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
await page.goto(BASE + "/auth/login");
await page.fill("#email", email);
await page.fill("#password", password);
await page.click('button[type="submit"]');
await page.getByText("Enter your code").waitFor();
assert.equal(await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.status)), 401, "password alone does not sign in");
await page.fill("#code", "123456");
await page.click('button[type="submit"]');
await page.getByText("didn’t match").waitFor();
const loginCode = await freshCode(secret);
await page.fill("#code", loginCode);
await page.click('button[type="submit"]');
await page.waitForURL(/\/app$/);

step("a code can't be replayed, and a ticket dies after 5 wrong codes");
{
  await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
  const t = await page.evaluate(([e, p]) => fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) }).then((r) => r.json()), [email, password]);
  const replay = await page.evaluate(([tk, c]) => fetch("/api/auth/login/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: tk, code: c }) }).then((r) => r.status), [t.ticket, loginCode]);
  assert.equal(replay, 401, "replayed code refused");
  for (let i = 0; i < 4; i++) await page.evaluate((tk) => fetch("/api/auth/login/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: tk, code: "000000" }) }), t.ticket);
  const burnt = await page.evaluate(([tk, c]) => fetch("/api/auth/login/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: tk, code: c }) }).then((r) => r.status), [t.ticket, await freshCode(secret)]);
  assert.equal(burnt, 400, "ticket invalid after 5 wrong codes, even with a right one");
  await db.query("update users set failed_logins=0, locked_until=null where email=$1", [email]);
}

step("a recovery code works once");
async function loginWith(c) {
  await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
  const r1 = await page.evaluate(([e, p]) => fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) }).then((r) => r.json()), [email, password]);
  assert.ok(r1.twoFactor && r1.ticket);
  return page.evaluate(([t, c2]) => fetch("/api/auth/login/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: t, code: c2 }) }).then((r) => r.status), [r1.ticket, c]);
}
assert.equal(await loginWith(recovery[0]), 200);
assert.equal(await loginWith(recovery[0]), 401, "recovery code is single-use");

step("a password reset link doesn't bypass two-factor");
await page.evaluate((e) => fetch("/api/auth/request-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e }) }), email);
const { rows } = await db.query(`select body from outbox where "to"=$1 and subject like '%Reset%' order by created_at desc limit 1`, [email]);
const token = rows[0].body.match(/token=([\w-]+)/)[1];
const rr = await page.evaluate((t) => fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t, password: "a-brand-new-pass" }) }).then((r) => r.json()), token);
assert.equal(rr.redirect, "/auth/login?reset=1");
assert.equal(await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.status)), 401, "reset did not sign in");

step("turn two-factor off");
const r1 = await page.evaluate((e) => fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: "a-brand-new-pass" }) }).then((r) => r.json()), email);
const in2 = await page.evaluate(([t, c]) => fetch("/api/auth/login/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: t, code: c }) }).then((r) => r.status), [r1.ticket, await freshCode(secret)]);
assert.equal(in2, 200);
const off = await page.evaluate(([c]) => fetch("/api/auth/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "a-brand-new-pass", code: c }) }).then((r) => r.status), [await freshCode(secret)]);
assert.equal(off, 200);
const plain = await page.evaluate((e) => fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: "a-brand-new-pass" }) }).then((r) => r.json()), email);
assert.ok(!plain.twoFactor, "no second step once turned off");

await browser.close();
await db.end();
console.log("✓ two-factor passed");
