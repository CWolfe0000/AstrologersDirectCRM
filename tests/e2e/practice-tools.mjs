/**
 * CSV import, calendar feed and consultation reminders.
 *   CRON_SECRET must match the server's.  node tests/e2e/practice-tools.mjs
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CRON = process.env.CRON_SECRET || "test-cron-secret";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const step = (s) => console.log("•", s);
const errors = [];

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "America/Los_Angeles" })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Tools");
await page.fill("#em", `tools-${stamp}@example.com`);
await page.fill("#pw", "tools-password-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
const state = () => page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
let s = await state();
assert.equal(s.practitioner.timezone, "America/Los_Angeles", "practice time zone comes from the browser at sign-up");

step("CSV import: coordinates, known city, a fixed-up place, duplicates and bad rows");
const dir = mkdtempSync(path.join(tmpdir(), "ad-csv-"));
const csv = path.join(dir, "clients.csv");
writeFileSync(csv, [
  "Full Name,E-mail,DOB,Time of Birth,Place of Birth,Lat,Lng,Tags",
  `Kenji Sato,kenji-${stamp}@example.com,1984-09-02,6:15 PM,Tokyo,35.68,139.69,"Career, New"`,
  `Ines Costa,ines-${stamp}@example.com,22/07/1979,,"Lisbon, Portugal",,,`,
  `Olu Adeyemi,olu-${stamp}@example.com,1993-01-30,08:05,Smallville,,,`,
  "Amelia Hart,amelia.hart@example.com,1988-03-14,07:42,Portland,,,",
  "Broken Row,,not-a-date,,London,,,",
].join("\n"));
await page.goto(BASE + "/app/clients");
await page.getByRole("button", { name: /Import/ }).click();
await page.getByRole("dialog").locator('input[type="file"]').setInputFiles(csv);
await page.getByText("Check which column holds each detail").waitFor();
await page.getByRole("tab", { name: "3 April (International)" }).click();
await page.getByRole("button", { name: "Review Rows" }).click();
const dlg = page.getByRole("dialog");
await dlg.getByText("need a birthplace").waitFor();
await dlg.getByText("Already a client (same email)").waitFor();
await dlg.getByText("Can’t read the date “not-a-date”").waitFor();
await dlg.locator('input[placeholder="Start typing a town or city…"]').first().fill("Par");
await dlg.locator("button", { hasText: "Paris, France" }).first().click();
await dlg.getByRole("button", { name: /Import 3 clients/ }).click();
await page.getByText("Imported 3 clients").waitFor();
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await state();
const kenji = s.people.find((p) => p.firstName === "Kenji");
const ines = s.people.find((p) => p.firstName === "Ines");
const olu = s.people.find((p) => p.firstName === "Olu");
assert.equal(kenji.birth.tz, "Asia/Tokyo", "time zone found from coordinates");
assert.equal(kenji.birth.time, "18:15");
assert.equal(ines.birth.date, "1979-07-22", "international date order");
assert.equal(ines.birth.timeAccuracy, "unknown");
assert.equal(ines.birth.tz, "Europe/Lisbon", "known city matched");
assert.equal(olu.birth.place, "Paris, France", "place chosen during review");
for (const p of [kenji, ines, olu]) assert.ok(s.charts.some((c) => c.clientId === p.id && c.type === "natal"), "natal chart created");
assert.ok(s.clients.find((c) => c.id === kenji.id).tags.includes("Career"));
assert.equal(s.people.filter((p) => p.firstName === "Broken").length, 0, "bad rows left out");

step("AAF import: charts exported from Solar Fire / Astrodienst keep their exact moment");
const aaf = path.join(dir, "charts.aaf");
const jd = (iso) => (Date.parse(iso) / 86_400_000 + 2440587.5).toFixed(6);
writeFileSync(aaf, [
  `#A93:Moreau${stamp},Claire,f,5.11.1975g,23:10,Lyon,F`,
  `#B93:${jd("1975-11-05T22:10:00Z")},45n45,4e51,1hE00,0`,
  `#A93:Ulm${stamp},Old,*,14.3.1879g,11:30,Ulm,D`,
  `#B93:${jd("1879-03-14T10:50:00Z")},48n24,10e00,0h40e,0`,
].join("\n"));
await page.getByRole("button", { name: /Import/ }).click();
await page.getByRole("dialog").locator('input[type="file"]').setInputFiles(aaf);
await dlg.getByText("2 ready").waitFor();
await dlg.getByText(/local time was adjusted/).waitFor();
await dlg.getByRole("button", { name: /Import 2 clients/ }).click();
await page.getByText("Imported 2 clients").waitFor();
await page.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await state();
const claire = s.people.find((p) => p.lastName === `Moreau${stamp}`);
assert.equal(claire.birth.date, "1975-11-05");
assert.equal(claire.birth.time, "23:10");
assert.equal(claire.birth.tz, "Europe/Paris");
assert.equal(claire.birth.place, "Lyon, F");
const old = s.people.find((p) => p.lastName === `Ulm${stamp}`);
assert.equal(old.birth.tz, "Europe/Berlin");
assert.ok(s.clients.find((c) => c.id === old.id).summary.includes("Local time adjusted"), "original time kept in notes");

step("calendar feed: private link with names reduced, no notes; regenerating kills the old link");
await page.goto(BASE + "/app/settings?section=notifications");
await page.getByRole("button", { name: /Create calendar link/ }).click();
const url = (await page.locator("code").first().innerText()).trim();
const feedPath = new URL(url).pathname;
const res = await fetch(BASE + feedPath);
assert.equal(res.status, 200);
assert.match(res.headers.get("content-type"), /text\/calendar/);
const ics = await res.text();
assert.ok(ics.includes("BEGIN:VEVENT") && ics.includes("SUMMARY:Amelia H. — Transit Review"), "consultations listed with first name + initial");
assert.ok(!ics.includes("Saturn now within") && !ics.includes("@example.com"), "no notes or emails in the feed");
assert.match(ics, /DTSTART:\d{8}T\d{6}Z/);
await page.getByRole("button", { name: /Create a new link/ }).click();
await page.locator("code").first().waitFor();
assert.equal((await fetch(BASE + feedPath)).status, 404, "old link stops working");

step("reminders: off by default, sent once when on, never twice; job needs the secret");
const sendReminders = (auth) => fetch(BASE + "/api/cron/reminders", { headers: auth ? { Authorization: `Bearer ${CRON}` } : {} });
assert.equal((await sendReminders(false)).status, 401);
s = await state();
const ameliaEmail = `amelia-rem-${stamp}@example.com`;
await page.evaluate(async ([email]) => {
  const st = await fetch("/api/v1/bootstrap?view=app").then((r) => r.json());
  const c = st.clients.find((x) => x.id === "c1");
  await fetch("/api/v1/records/clients/c1", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, email }) });
  // A consultation 3 hours from now in the practice's time zone (Los Angeles).
  const d = new Date(Date.now() + 3 * 3600_000);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
  const start = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`;
  await fetch("/api/v1/records/consultations/kRem", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "kRem", clientId: "c1", type: "Reminder Test", start, durationMin: 60, status: "scheduled", location: "Video call", chartIds: [], readingIds: [], recordingIds: [], prepNotes: "PRIVATE PREP" }) });
}, [ameliaEmail]);
await sendReminders(true);
const none = await db.query(`select count(*)::int n from outbox where "to"=$1`, [ameliaEmail]);
assert.equal(none.rows[0].n, 0, "reminders are off until the practitioner turns them on");
await page.getByRole("switch", { name: "Email clients a reminder" }).click();
await page.getByText("All changes saved").waitFor({ timeout: 10000 });
const r1 = await (await sendReminders(true)).json();
assert.ok(r1.sent >= 1);
// (The sample data may also have a session for Amelia in the next 24 hours; that one is reminded too.)
const mail = await db.query(`select subject, body from outbox where "to"=$1`, [ameliaEmail]);
const mine = mail.rows.filter((m) => /Reminder: your Reminder Test/.test(m.subject));
assert.equal(mine.length, 1, "the test consultation was reminded");
assert.ok(mail.rows.every((m) => !m.body.includes("PRIVATE PREP") && !m.body.includes("Saturn now within")), "no practitioner notes in reminders");
await sendReminders(true);
assert.equal((await db.query(`select count(*)::int n from outbox where "to"=$1`, [ameliaEmail])).rows[0].n, mail.rows.length, "nothing sent twice");

await browser.close();
await db.end();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("✓ practice tools passed");
