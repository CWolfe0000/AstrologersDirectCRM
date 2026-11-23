/**
 * Between Sessions templates and reminders: start from a starter template, save
 * your own, and remind the client the day before (once, portal clients only,
 * only when ticked, never once it's done).
 *   node tests/e2e/work-reminders.mjs   (server running with CRON_SECRET; reads email from the outbox)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CRON = process.env.CRON_SECRET || "test-cron-secret";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const outbox = async (to) => (await db.query('select subject, body from outbox where "to"=$1 order by created_at', [to])).rows;
const cron = () => fetch(BASE + "/api/cron/reminders", { headers: { Authorization: `Bearer ${CRON}` } }).then((r) => r.json());

// Reminders go out from 9am in the practice's time zone: pick a zone where it's daytime now.
const local = (zone, d = new Date()) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(d).map((p) => [p.type, p.value]));
const zone = ["Pacific/Kiritimati", "Asia/Tokyo", "Asia/Kolkata", "Europe/London", "America/New_York", "America/Los_Angeles", "Pacific/Honolulu", "Pacific/Pago_Pago"].find((z) => {
  const h = Number(local(z).hour);
  return h >= 10 && h <= 21;
});
const t = local(zone, new Date(Date.now() + 24 * 3600_000));
const tomorrow = `${t.year}-${t.month}-${t.day}`;

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const api = (url, init) => page.evaluate(async ({ url, init }) => (await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined)).json().catch(() => null), { url, init });

step("practitioner with sample data, in a daytime time zone, with Amelia in the portal");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Rem");
await page.fill("#em", `rem-${stamp}@example.com`);
await page.fill("#pw", "reminder-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await api("/api/v1/sample-data", { method: "POST", body: "{}" });
let s = await api("/api/v1/bootstrap?view=app");
await api("/api/v1/settings", { method: "PUT", body: JSON.stringify({ practitioner: { ...s.practitioner, timezone: zone }, defaults: s.defaults }) });
const amelia = `amelia-rem-work-${stamp}@example.com`;
await api("/api/v1/records/clients/c1", { method: "PUT", body: JSON.stringify({ ...s.clients.find((c) => c.id === "c1"), email: amelia, portalAccess: "active" }) });

step("start from a starter template, with a reminder for tomorrow");
await page.goto(BASE + "/app/clients/c1?tab=work");
await page.getByRole("button", { name: "New", exact: true }).click();
const dialog = page.getByRole("dialog");
await dialog.getByLabel("Start from a Template (Optional)").selectOption({ label: "Three moments" });
assert.equal(await dialog.getByRole("textbox", { name: "Title" }).inputValue(), "Three moments");
assert.ok((await dialog.getByRole("textbox", { name: "Instructions" }).inputValue()).includes("felt most like yourself"));
await dialog.getByLabel("Suggested Date (Optional)").fill(tomorrow);
const remind = dialog.getByRole("checkbox", { name: /gentle reminder/ });
assert.ok(await remind.isChecked(), "reminder on by default");
await dialog.getByRole("button", { name: /Share with Amelia/ }).click();
await page.getByText("reminder on").first().waitFor();

step("save your own template and find it next time");
await page.getByRole("button", { name: "New", exact: true }).click();
await dialog.getByRole("textbox", { name: "Title" }).fill(`My ritual ${stamp}`);
await dialog.getByRole("textbox", { name: "Instructions" }).fill("Light a candle and write for ten minutes.");
await dialog.getByRole("button", { name: "Save as Template" }).click();
await page.getByText("Saved as a template").waitFor();
await dialog.getByRole("button", { name: "Cancel" }).click();
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await api("/api/v1/bootstrap?view=app");
assert.ok(s.practitioner.workTemplates.some((x) => x.title === `My ritual ${stamp}`), "template stored with the practice");
await page.reload();
await page.getByRole("button", { name: "New", exact: true }).click();
await dialog.getByLabel("Start from a Template (Optional)").selectOption({ label: `My ritual ${stamp}` });
assert.equal(await dialog.getByRole("textbox", { name: "Instructions" }).inputValue(), "Light a candle and write for ten minutes.");
await dialog.getByRole("button", { name: "Cancel" }).click();

step("unticked, already-done and draft items get no reminder");
const base = { clientId: "c1", kind: "assignment", instructions: "x", dueDate: tomorrow, createdAt: "2026-01-01T00:00:00", updatedAt: "2026-01-01T00:00:00" };
await api("/api/v1/records/clientWork/wNoRem", { method: "PUT", body: JSON.stringify({ ...base, id: "wNoRem", title: "No reminder please", status: "shared", remind: false }) });
await api("/api/v1/records/clientWork/wDraft", { method: "PUT", body: JSON.stringify({ ...base, id: "wDraft", title: "Draft with reminder", status: "draft", remind: true }) });
await api("/api/v1/records/clientWork/wDone", { method: "PUT", body: JSON.stringify({ ...base, id: "wDone", title: "Already done", status: "completed", remind: true }) });

step("the job reminds once");
await cron();
let mail = (await outbox(amelia)).filter((m) => m.subject.startsWith("A Gentle Reminder"));
assert.deepEqual(mail.map((m) => m.subject), ["A Gentle Reminder: “Three moments”"]);
assert.ok(/\/portal\/work\/[^\s]+~w_/.test(mail[0].body), "links to the scoped portal item");
assert.ok(mail[0].body.includes("tomorrow"));
await cron();
mail = (await outbox(amelia)).filter((m) => m.subject.startsWith("A Gentle Reminder"));
assert.equal(mail.length, 1, "never twice");
s = await api("/api/v1/bootstrap?view=app");
assert.ok(s.portalNotifications.some((n) => n.title === "A Gentle Reminder" && n.clientId === "c1"), "portal notification too");

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ work templates and reminders");
