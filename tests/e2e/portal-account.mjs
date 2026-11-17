/**
 * The client portal's session and account buttons are real: join the video
 * link, add to calendar, request a reschedule, the practice's portal colour,
 * real security settings, download my data, and close my account.
 *   node tests/e2e/portal-account.mjs   (production server running; reads email from the outbox)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const ownerEmail = `pa-owner-${stamp}@example.com`;
const amelia = `pa-amelia-${stamp}@example.com`;
const MEET = "https://meet.example.com/abc-defg-hij";

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
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const api = (url, init) =>
  page.evaluate(async ({ url, init }) => {
    const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined);
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { url, init });

step("practitioner: sample data, a video session tomorrow with a link, a portal colour");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Pat");
await page.fill("#em", ownerEmail);
await page.fill("#pw", "portal-account-pass-1");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await api("/api/v1/sample-data", { method: "POST", body: "{}" });
let s = (await api("/api/v1/bootstrap?view=app")).body;
await api("/api/v1/settings", { method: "PUT", body: JSON.stringify({ practitioner: { ...s.practitioner, portalAccent: "#5E7266" }, defaults: s.defaults }) });
await api("/api/v1/records/clients/c1", { method: "PUT", body: JSON.stringify({ ...s.clients.find((c) => c.id === "c1"), email: amelia }) });
const tomorrow = new Date(Date.now() + 36 * 3600_000).toISOString().slice(0, 10);
const k = { id: "kVid", clientId: "c1", type: "Solar Return Reading", start: `${tomorrow}T15:00:00`, durationMin: 60, status: "scheduled", location: "Video call", chartIds: [], readingIds: [], recordingIds: [] };
assert.equal((await api("/api/v1/records/consultations/kVid", { method: "PUT", body: JSON.stringify({ ...k, meetingUrl: "http://insecure.example.com" }) })).status, 422, "only https links");
assert.equal((await api("/api/v1/records/consultations/kVid", { method: "PUT", body: JSON.stringify({ ...k, meetingUrl: MEET }) })).status, 200);
assert.equal((await api("/api/v1/portal/invite", { method: "POST", body: JSON.stringify({ clientId: "c1" }) })).status, 200);

step("client joins; the portal uses the practice's colour");
const cctx = await browser.newContext({ acceptDownloads: true });
const cp = await cctx.newPage();
cp.on("pageerror", (e) => errors.push("portal: " + e.message));
await cp.goto(await lastLink(amelia, "/auth/invite"));
await cp.click('button[type="submit"]');
await cp.waitForURL(/\/portal/);
await cp.getByText("Good", { exact: false }).first().waitFor();
const accent = await cp.evaluate(() => getComputedStyle(document.querySelector(".min-h-screen")).getPropertyValue("--accent").trim());
assert.equal(accent, "94 114 102", "sage accent applied");

step("join link and calendar file");
await cp.goto(BASE + "/portal/consultations");
const join = cp.getByRole("link", { name: "Join video call" }).first();
assert.equal(await join.getAttribute("href"), MEET);
const [ics] = await Promise.all([cp.waitForEvent("download"), cp.getByRole("button", { name: "Add to Calendar" }).first().click()]);
const icsText = await readFile(await ics.path(), "utf8");
assert.ok(icsText.includes("BEGIN:VEVENT") && icsText.includes("SUMMARY:") && /DTSTART;TZID=/.test(icsText), "real .ics");

step("request to reschedule reaches the practitioner");
await cp.getByRole("button", { name: "Request to reschedule" }).first().click();
await cp.getByLabel("Message (optional)").fill("Could we do Thursday instead?");
await cp.getByRole("button", { name: "Send Request" }).click();
await cp.getByText("Request sent").waitFor();
s = (await api("/api/v1/bootstrap?view=app")).body;
assert.ok(s.notifications.some((n) => n.title === "Reschedule request" && n.body.includes("Thursday")), "practitioner notified");
const { rows: mail } = await db.query('select subject from outbox where "to"=$1 and subject like $2', [ownerEmail, "%asked to reschedule"]);
assert.equal(mail.length, 1, "practitioner emailed");

step("account page: real security settings and data download");
await cp.goto(BASE + "/portal/settings");
await cp.getByText("Two-Factor Authentication").waitFor();
await cp.getByText("Active Sessions").waitFor();
await cp.getByRole("button", { name: "Add Password" }).waitFor();
assert.equal(await cp.getByText("Simulated").count(), 0, "nothing simulated");
const [dl] = await Promise.all([cp.waitForEvent("download"), cp.getByRole("button", { name: "Download My Data" }).click()]);
const data = JSON.parse(await readFile(await dl.path(), "utf8"));
assert.ok(data.readings.length > 0 && data.consultations.some((x) => x.type === "Solar Return Reading"), "export has their data");
assert.ok(!JSON.stringify(data).includes("prepNotes"), "no practitioner notes");

step("close the account, asking for deletion");
await cp.getByRole("button", { name: "Close My Portal Account" }).click();
const dialog = cp.getByRole("dialog");
await dialog.getByText(/delete my records too/).click();
await dialog.getByLabel("Type CLOSE to confirm").fill("close");
await dialog.getByRole("button", { name: "Close My Account" }).click();
await cp.waitForURL((u) => !u.pathname.startsWith("/portal"));
assert.equal((await db.query("select count(*)::int n from users where email=$1", [amelia])).rows[0].n, 0, "login deleted");
s = (await api("/api/v1/bootstrap?view=app")).body;
assert.equal(s.clients.find((c) => c.id === "c1").portalAccess, "none", "portal access off");
assert.ok(s.notifications.some((n) => n.title === "Client asked for deletion"), "practitioner told");
assert.ok(s.people.some((p) => p.id === "c1"), "practitioner's records unchanged");

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ portal account");
