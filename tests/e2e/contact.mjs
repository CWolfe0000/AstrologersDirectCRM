/**
 * Website contact and advisory-group forms email CONTACT_EMAIL (with Reply-To
 * set to the sender); the honeypot drops bots; bad input is refused.
 *   node tests/e2e/contact.mjs   (production server running with CONTACT_EMAIL=hello@example.com)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TO = process.env.CONTACT_EMAIL || "hello@example.com";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const mail = async (needle) => {
  for (let i = 0; i < 20; i++) {
    const { rows } = await db.query('select subject, body from outbox where "to"=$1 and body like $2 order by created_at desc limit 1', [TO, `%${needle}%`]);
    if (rows[0]) return rows[0];
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
};

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));

step("contact form sends to the inbox");
await page.goto(BASE + "/contact");
await page.getByLabel("Name").fill("Rosa Test");
await page.getByLabel("Email").fill(`rosa-${stamp}@example.com`);
await page.getByLabel("Topic").selectOption("early");
await page.getByLabel("Message").fill(`Hello from the contact test ${stamp}`);
await page.getByRole("button", { name: "Send Message" }).click();
await page.getByText("Thank You — Message Received.").waitFor();
const m = await mail(`contact test ${stamp}`);
assert.ok(m, "email queued to CONTACT_EMAIL");
assert.equal(m.subject, "Website: The beta & pricing from Rosa Test");
assert.ok(m.body.includes(`rosa-${stamp}@example.com`));

step("advisory group sign-up sends to the inbox");
await page.goto(BASE + "/about");
await page.getByLabel("Your Name").fill(`Ada ${stamp}`);
await page.getByLabel("Email").fill(`ada-${stamp}@example.com`);
await page.getByRole("button", { name: "Join the advisory group" }).click();
await page.getByText("You’re on the list.").waitFor();
assert.ok(await mail(`ada-${stamp}@example.com`), "advisory email queued");

step("honeypot and validation");
const post = (body) => page.evaluate((b) => fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.status), body);
assert.equal(await post({ kind: "contact", name: "Bot", email: "bot@example.com", topic: "general", message: `spam ${stamp}`, website: "http://spam" }), 200);
assert.equal(await mail(`spam ${stamp}`), null, "honeypot submissions are dropped");
assert.equal(await post({ kind: "contact", name: "X", email: "not-an-email", topic: "general", message: "hi" }), 422);
assert.equal(await post({ kind: "contact", name: "X", email: "x@example.com", topic: "nope", message: "hi" }), 422);

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ contact forms");
