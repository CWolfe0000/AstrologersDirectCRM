/**
 * Online booking: the astrologer sets up a public page; a visitor books a
 * session; the practice gets the client, natal chart, consultation,
 * notification and emails; the time is gone for everyone else.
 *   node tests/e2e/booking.mjs   (production server running; reads email from the outbox)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const slug = `astro-${stamp}`;
const ownerEmail = `bk-owner-${stamp}@example.com`;
const visitor = `bk-visitor-${stamp}@example.com`;
const MEET = "https://meet.example.com/maya-room";

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (p, url, init) =>
  p.evaluate(async ({ url, init }) => {
    const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined);
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { url, init });

step("the astrologer sets up their booking page in Settings");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Maya");
await page.fill("#em", ownerEmail);
await page.fill("#pw", "booking-pass-12345");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
const st = (await call(page, "/api/v1/bootstrap?view=app")).body;
await call(page, "/api/v1/settings", { method: "PUT", body: JSON.stringify({ practitioner: { ...st.practitioner, name: "Maya Lin", timezone: "America/New_York" }, defaults: st.defaults }) });
await page.goto(BASE + "/app/settings?section=booking");
await page.getByLabel("Page Address").fill(slug);
await page.getByLabel("Headline", { exact: false }).fill("Evolutionary astrologer");
await page.getByLabel("Video Call Link", { exact: false }).fill(MEET);
for (const d of ["Saturday", "Sunday"]) await page.getByRole("checkbox", { name: d }).check();
await page.getByRole("button", { name: "Save Booking Settings" }).click();
await page.getByText("Booking Settings Saved").waitFor();
await page.getByRole("switch", { name: "Accept online bookings" }).click();
await page.getByText("Your page is live.").waitFor();
let prof = (await call(page, "/api/v1/booking")).body.profile;
assert.equal(prof.enabled, true);
assert.equal(prof.slug, slug);
// Wider hours so the test always finds times, whenever it runs.
const allDay = Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [{ start: "06:00", end: "22:00" }]]));
const r1 = await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, rules: { ...prof.rules, weekly: allDay, minNoticeHours: 2, maxAdvanceDays: 14, stepMin: 60, bufferMin: 15, changeNoticeHours: 1 } }) });
assert.equal(r1.status, 200);
prof = r1.body.profile;
assert.equal((await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, slug: "admin" }) })).status, 422, "reserved address");

step("a visitor books from the public page");
const vctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: "Europe/London" });
const v = await vctx.newPage();
v.on("pageerror", (e) => errors.push("visitor: " + e.message));
await v.goto(`${BASE}/book/${slug}`);
await v.getByRole("heading", { name: "Maya Lin" }).waitFor();
await v.getByText("Evolutionary astrologer").waitFor();
await v.getByRole("button", { name: /Natal Chart Reading/ }).click();
const times = v.getByRole("group", { name: "Times" });
await times.getByRole("button").first().waitFor();
const slots = (await call(v, `/api/public/book/${slug}/slots?service=natal`)).body.slots;
assert.ok(slots.length > 5);
await times.getByRole("button").first().click();
await v.getByLabel("First Name").fill("Rosa");
await v.getByLabel("Last Name").fill("Vale");
await v.getByLabel("Email").fill(visitor);
await v.getByLabel("Date of Birth").fill("1992-05-17");
await v.getByLabel("Time of Birth").fill("06:45");
await v.locator("#bk-bp").fill("Par");
await v.locator("button", { hasText: "Paris, France" }).first().click();
await v.getByLabel(/Anything You’d Like/).fill("Career change this year.");
await v.getByRole("checkbox", { name: /will keep my details/ }).check();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/booking-details.png`, fullPage: true });
await v.getByRole("button", { name: /Book Natal Chart Reading/ }).click();
await v.getByRole("heading", { name: "You’re Booked" }).waitFor();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/booking-done.png`, fullPage: true });
const bookedStart = slots[0];

step("the practice has the client, chart, session, notification and emails");
await page.waitForTimeout(500);
const s = (await call(page, "/api/v1/bootstrap?view=app")).body;
const client = s.clients.find((c) => c.email === visitor);
assert.ok(client && client.source === "Online booking" && client.status === "new");
const person = s.people.find((p) => p.id === client.id);
assert.deepEqual([person.firstName, person.birth.date, person.birth.time, person.birth.tz], ["Rosa", "1992-05-17", "06:45", "Europe/Paris"]);
assert.ok(s.charts.some((c) => c.type === "natal" && c.personIds[0] === client.id), "natal chart");
const k = s.consultations.find((x) => x.clientId === client.id);
const ny = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(bookedStart));
const P = Object.fromEntries(ny.map((x) => [x.type, x.value]));
assert.equal(k.start, `${P.year}-${P.month}-${P.day}T${P.hour}:${P.minute}:00`, "stored in the astrologer's time");
assert.deepEqual([k.type, k.durationMin, k.status, k.location, k.meetingUrl], ["Natal Chart Reading", 90, "scheduled", "Video call", MEET]);
assert.ok(k.prepNotes.includes("Career change this year."));
assert.ok(s.notifications.some((n) => n.title === "New booking from a new client"));
const mail = async (to) => (await db.query('select subject, body from outbox where "to"=$1 order by created_at', [to])).rows;
const vm = await mail(visitor);
assert.ok(vm.some((m) => m.subject === "Booked: Natal Chart Reading with Maya Lin" && m.body.includes(MEET) && /GMT|BST/.test(m.body)), "visitor confirmation in their time zone");
assert.ok(vm.some((m) => /invited you to your client portal/.test(m.subject)), "portal invitation");
assert.ok((await mail(ownerEmail)).some((m) => m.subject === "New booking: Rosa Vale, Natal Chart Reading"));

step("the time is gone; overlapping and duplicate bookings are refused");
const after = (await call(v, `/api/public/book/${slug}/slots?service=natal`)).body.slots;
assert.ok(!after.includes(bookedStart), "booked time removed");
const req = (start, email) => ({ serviceId: "natal", start, firstName: "X", lastName: "Y", email, phone: "", birth: { date: "1990-01-01", time: "12:00", timeAccuracy: "unknown", place: "Paris, France", lat: 48.86, lon: 2.35, tz: "Europe/Paris" }, notes: "", tz: "Europe/London" });
assert.equal((await call(v, `/api/public/book/${slug}`, { method: "POST", body: JSON.stringify(req(bookedStart, `dup-${stamp}@example.com`)) })).status, 409);

step("a returning client is matched by email");
const r2 = await call(v, `/api/public/book/${slug}`, { method: "POST", body: JSON.stringify({ ...req(after[after.length - 1], visitor), serviceId: "followup" }) });
assert.equal(r2.status, 200, JSON.stringify(r2.body));
const s2 = (await call(page, "/api/v1/bootstrap?view=app")).body;
assert.equal(s2.clients.filter((c) => c.email === visitor).length, 1, "no duplicate client");
assert.equal(s2.consultations.filter((x) => x.clientId === client.id).length, 2);

step("the client reschedules from their private link");
const links = (await mail(visitor)).filter((m) => m.subject.startsWith("Booked:")).map((m) => m.body.match(/https?:\/\/[^\s]+\/book\/manage\/[A-Za-z0-9_-]+/)[0].replace(/^https?:\/\/[^/]+/, BASE));
assert.equal(links.length, 2, "a manage link in each confirmation");
await v.goto(links[0]);
await v.getByRole("heading", { name: "Your Booking" }).waitFor();
await v.getByText("Natal Chart Reading").first().waitFor();
await v.getByRole("button", { name: "Reschedule" }).click();
const newTimes = v.getByRole("group", { name: "Times" });
await newTimes.getByRole("button").first().waitFor();
const moveSlots = (await call(v, links[0].replace(BASE + "/book/manage/", "/api/public/booking/") + "/slots")).body.slots;
// Move it to the last open time (on a later day, clear of the old one).
await v.getByRole("group", { name: "Days" }).getByRole("button").last().click();
await newTimes.getByRole("button").last().click();
await v.getByRole("button", { name: "Confirm New Time" }).click();
await v.getByText("Your session has been moved").waitFor();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/booking-manage.png`, fullPage: true });
let s3 = (await call(page, "/api/v1/bootstrap?view=app")).body;
const moved = s3.consultations.find((x) => x.id === k.id);
assert.notEqual(moved.start, k.start, "moved");
assert.ok(moved.prepNotes.includes("Rescheduled online by the client"));
const NYp = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(moveSlots[moveSlots.length - 1])).map((x) => [x.type, x.value]));
assert.equal(moved.start, `${NYp.year}-${NYp.month}-${NYp.day}T${NYp.hour}:${NYp.minute}:00`, "moved to the chosen time");
assert.ok(s3.notifications.some((n) => n.title === "Session rescheduled"));
assert.ok((await mail(visitor)).some((m) => m.subject === "Rescheduled: Natal Chart Reading with Maya Lin"));
assert.ok((await call(v, `/api/public/book/${slug}/slots?service=natal`)).body.slots.includes(bookedStart), "the old time is free again");

step("…and cancels");
await v.getByRole("button", { name: "Cancel Session" }).click();
await v.getByLabel(/Anything you’d like/).fill("Something came up at work.");
await v.getByRole("button", { name: "Cancel Session" }).last().click();
await v.getByText("This session is canceled.").waitFor();
assert.equal(await v.getByRole("button", { name: "Reschedule" }).count(), 0);
s3 = (await call(page, "/api/v1/bootstrap?view=app")).body;
const canceled = s3.consultations.find((x) => x.id === k.id);
assert.equal(canceled.status, "cancelled");
assert.ok(canceled.prepNotes.includes("Something came up at work."));
assert.ok(s3.notifications.some((n) => n.title === "Session canceled"));
assert.ok((await mail(ownerEmail)).some((m) => m.subject === "Session canceled: Rosa Vale"));
const t0 = links[0].split("/").pop();
assert.equal((await call(v, `/api/public/booking/${t0}/cancel`, { method: "POST", body: "{}" })).status, 409, "can't cancel twice");

step("after the cutoff, changes go through the astrologer");
await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, rules: { ...prof.rules, changeNoticeHours: 336 } }) });
const t1 = links[1].split("/").pop();
assert.equal((await call(v, `/api/public/booking/${t1}/cancel`, { method: "POST", body: "{}" })).status, 409);
assert.equal((await call(v, `/api/public/booking/${t1}/slots`)).status, 409);
await v.goto(links[1]);
await v.getByText(/Changes can be made online up to 336 hours/).waitFor();
await v.goto(`${BASE}/book/manage/not-a-real-token-123456789`);
await v.getByText("This Booking Link Isn’t Valid").waitFor();
await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify(prof) });

step("spam trap, and a page that's off");
assert.equal((await call(v, `/api/public/book/${slug}`, { method: "POST", body: JSON.stringify({ ...req(after[3], `bot-${stamp}@example.com`), website: "http://spam" }) })).status, 422);
await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, enabled: false }) });
assert.equal((await call(v, `/api/public/book/${slug}`)).status, 404);
await v.goto(`${BASE}/book/${slug}`);
await v.getByText("This booking page isn’t available").waitFor();

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ online booking");
