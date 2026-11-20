/**
 * Intake forms, end to end: the astrologer builds forms from starters in
 * Settings, links one to a booking service, a visitor books and fills it in
 * from their booking link (a horary question becomes a chart), then a form
 * sent from the client's page is filled in from the portal: life events land
 * on the client record and timeline, and different birth details wait for review.
 *   node tests/e2e/intake.mjs   (production server running; reads email from the outbox)
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
const ownerEmail = `in-owner-${stamp}@example.com`;
const visitor = `in-visitor-${stamp}@example.com`;
const slug = `intake-${stamp}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function mailTo(to, subjectLike, n = 1) {
  for (let i = 0; i < 40; i++) {
    const { rows } = await db.query('select subject, body from outbox where "to"=$1 and subject like $2 order by created_at desc', [to, subjectLike]);
    if (rows.length >= n) return rows;
    await sleep(250);
  }
  return [];
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (p, url, init) => p.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });
const state = async () => (await call(page, "/api/v1/bootstrap?view=app")).body;

step("practitioner signs up and builds two forms from the starters");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Iris");
await page.fill("#em", ownerEmail);
await page.fill("#pw", "intake-forms-pass-1");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.goto(BASE + "/app/settings?section=intake");
await page.getByText("No Intake Forms Yet").waitFor();
await page.getByRole("button", { name: "New Form" }).first().click();
await page.getByRole("dialog").getByRole("button", { name: /Horary Question/ }).click();
await page.getByLabel("Form Name").waitFor();
await page.getByRole("button", { name: "Save Form" }).click();
await page.getByText("Form Saved").waitFor();
await page.getByRole("button", { name: "New Form" }).first().click();
await page.getByRole("dialog").getByRole("button", { name: /New Client/ }).click();
// Make it the astrologer's own: rename, require life events, add a custom choice question.
await page.getByLabel("Form Name").fill("Welcome Questions");
await page.getByRole("button", { name: "Custom Question" }).click();
const q = page.getByRole("list", { name: "Form parts" }).getByRole("listitem").last();
await q.getByLabel("Question", { exact: true }).fill("Have you had a reading before?");
await q.getByLabel("Answer").selectOption("choice");
await q.getByLabel("Choices").fill("Yes\nNo");
await q.getByLabel("Choices").blur();
await page.getByRole("button", { name: "Preview" }).click();
await page.getByRole("dialog").getByRole("heading", { name: "Welcome Questions" }).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/intake-preview.png` });
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Save Form" }).click();
await page.getByText("Form Saved").waitFor();
await page.getByText("Welcome Questions", { exact: true }).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/intake-forms.png` });
let s;
for (let i = 0; i < 30; i++) { s = await state(); if ((s.practitioner.intakeForms ?? []).length === 2) break; await sleep(300); }
const horaryForm = s.practitioner.intakeForms.find((f) => f.title === "Horary Question");
const welcome = s.practitioner.intakeForms.find((f) => f.title === "Welcome Questions");
assert.ok(horaryForm && welcome, "both forms saved");
assert.ok(welcome.sections.some((x) => x.kind === "question" && x.answer === "choice" && x.options.join() === "Yes,No"));

step("a horary service sends the horary form when booked");
let prof = (await call(page, "/api/v1/booking")).body.profile;
const allDay = Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [{ start: "06:00", end: "22:00" }]]));
const r1 = await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, slug, enabled: true, displayName: "Iris Vale", services: [{ id: "horary", name: "Horary Question", description: "", durationMin: 30, price: "", format: "Video call", active: true, intakeFormId: horaryForm.id }], rules: { ...prof.rules, weekly: allDay, minNoticeHours: 2, maxAdvanceDays: 14, stepMin: 60 } }) });
assert.equal(r1.status, 200, JSON.stringify(r1.body));
await page.goto(BASE + "/app/settings?section=booking");
assert.equal(await page.getByLabel("Intake Form").first().inputValue(), horaryForm.id, "shown on the service");

const vctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const v = await vctx.newPage();
v.on("pageerror", (e) => errors.push("visitor: " + e.message));
await v.goto(BASE + "/");
const slots = (await call(v, `/api/public/book/${slug}/slots?service=horary`)).body.slots;
const booked = await call(v, `/api/public/book/${slug}`, { method: "POST", body: JSON.stringify({ serviceId: "horary", start: slots[0], firstName: "Nora", lastName: "Quest", email: visitor, phone: "", birth: { date: "1985-04-02", time: "12:00", timeAccuracy: "unknown", place: "Paris, France", lat: 48.86, lon: 2.35, tz: "Europe/Paris" }, notes: "", tz: "Europe/London" }) });
assert.equal(booked.status, 200, JSON.stringify(booked.body));
const conf = (await mailTo(visitor, "Booked:%"))[0];
assert.ok(conf.body.includes("please fill in “Horary Question”"), "the confirmation asks for the form");
const formLink = conf.body.match(/https?:\/\/[^\s]+\/book\/manage\/[A-Za-z0-9_-]+#intake/)[0].replace(/^https?:\/\/[^/]+/, BASE);

step("the visitor fills it in from the booking link: the question becomes a horary chart");
await v.goto(formLink);
await v.getByRole("heading", { name: "Horary Question" }).waitFor();
await v.getByRole("button", { name: /Send to Your Astrologer/ }).click();
await v.getByText("Please write your question.").waitFor();
await v.getByLabel("Your Question", { exact: true }).fill("Will the Lisbon apartment be mine?");
await v.getByLabel("Date You Asked").fill("2026-11-18");
await v.getByLabel("Time You Asked").fill("14:05");
await v.getByLabel("Where You Were").fill("Par");
await v.locator("button", { hasText: "Paris, France" }).first().click();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/intake-booking.png`, fullPage: true });
await v.getByRole("button", { name: /Send to Your Astrologer/ }).click();
await v.getByRole("heading", { name: "Thank You" }).waitFor();
assert.equal((await call(v, formLink.replace(BASE + "/book/manage/", "/api/public/booking/").replace("#intake", "/intake"), { method: "POST", body: JSON.stringify({ answers: {} }) })).status, 409, "only once");
s = await state();
const nora = s.clients.find((c) => c.email === visitor);
const hreq = s.intakeRequests.find((r) => r.clientId === nora.id);
assert.equal(hreq.status, "submitted");
assert.ok(hreq.consultationId, "linked to the booking");
const hchart = s.charts.find((c) => c.id === hreq.applied.chartId);
assert.equal(hchart.type, "horary");
assert.equal(hchart.horary.at, "2026-11-18T14:05");
assert.equal(hchart.horary.tz, "Europe/Paris");
assert.ok(s.notifications.some((n) => n.title === "Intake Form Received"));

step("the astrologer sends “Welcome Questions” from the client's page");
await page.goto(BASE + `/app/clients/${nora.id}?tab=forms`);
await page.getByRole("button", { name: /Horary Question/ }).waitFor();
await page.getByLabel("Form to Send").selectOption(welcome.id);
await page.getByRole("button", { name: "Send to Nora" }).click();
await page.getByText("Form Sent").waitFor();
const inv = (await mailTo(visitor, "%invited you to your client portal"))[0];
assert.ok(inv.body.includes("fill in “Welcome Questions”"), "the invitation mentions the form");
const inviteLink = inv.body.match(/https?:\/\/[^\s]+\/auth\/invite\?token=[A-Za-z0-9_-]+/)[0].replace(/^https?:\/\/[^/]+/, BASE);

step("Nora fills it in from her portal: birth details differ, two life events");
await v.goto(inviteLink);
await v.click('button[type="submit"]');
await v.waitForURL(/\/portal/);
await v.getByText("Forms to Fill In").waitFor();
await v.getByRole("link", { name: /Welcome Questions/ }).click();
await v.getByRole("heading", { name: "Welcome Questions" }).waitFor();
assert.equal(await v.getByLabel("Date of Birth").inputValue(), "1985-04-02", "known birth details prefilled");
// A different day than the booking had: that needs the astrologer's review.
await v.getByLabel("Date of Birth").fill("1985-04-03");
await v.getByRole("checkbox", { name: "I don’t know my birth time" }).uncheck();
await v.getByLabel("Time of Birth").fill("07:20");
await v.getByLabel("Where Does the Time Come From?").fill("Birth certificate");
await v.getByLabel("What Would You Like to Explore?").fill("Whether to move abroad.");
// A single date…
await v.getByLabel("What Happened").selectOption("marriage");
await v.getByLabel("Date", { exact: true }).fill("2014-06-21");
await v.getByLabel("A Few Words").fill("Married Sam");
await v.getByRole("button", { name: "Add Event" }).click();
// …and a period, known only to the month, still going.
await v.getByLabel("What Happened").selectOption("move");
await v.getByRole("tab", { name: "A Period of Time" }).click();
await v.getByRole("checkbox", { name: "I only know the month" }).check();
await v.getByLabel("Started").fill("2019-03");
await v.getByRole("checkbox", { name: "Still going" }).check();
await v.getByLabel("A Few Words").fill("Living in Lisbon");
await v.getByRole("button", { name: "Add Event" }).click();
await v.getByRole("list", { name: "Life events added" }).getByText("Mar 2019 – Present · Living in Lisbon").waitFor();
await v.getByLabel("Have you had a reading before?").selectOption("No");
if (SHOTS) await v.screenshot({ path: `${SHOTS}/intake-portal.png`, fullPage: true });
await v.getByRole("button", { name: /Send to Your Astrologer/ }).click();
await v.getByText(/You sent this to Iris/).waitFor();

for (let i = 0; i < 30; i++) { s = await state(); if (s.intakeRequests.find((r) => r.formId === welcome.id)?.status === "submitted") break; await sleep(300); }
const wreq = s.intakeRequests.find((r) => r.formId === welcome.id);
assert.equal(wreq.status, "submitted");
assert.equal(wreq.applied.birth, "review", "a different birth date waits for review");
assert.equal(wreq.applied.events, 2);
const person = s.people.find((p) => p.id === nora.id);
assert.equal(person.birth.timeAccuracy, "unknown", "record not changed without review");
assert.deepEqual(person.lifeEvents.map((e) => [e.type, e.date, e.end ?? null, !!e.ongoing, !!e.approx, e.source]).sort(), [["marriage", "2014-06-21", null, false, false, "client"], ["move", "2019-03-01", null, true, true, "client"]]);
assert.deepEqual(wreq.answers.questions[welcome.sections.find((x) => x.kind === "question" && x.answer === "choice").id], "No");

step("the astrologer reviews the answers and takes the new birth time");
await page.goto(BASE + `/app/clients/${nora.id}?tab=forms&form=${wreq.id}`);
await page.getByText("Birth Details to Review").first().waitFor();
await page.getByText("Whether to move abroad.").waitFor();
await page.getByText("Married Sam").waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/intake-review.png`, fullPage: true });
await page.getByRole("button", { name: "Use the Form’s Details" }).click();
await page.getByText("Birth Details Updated").waitFor();
for (let i = 0; i < 30; i++) { s = await state(); if (s.people.find((p) => p.id === nora.id).birth.time === "07:20") break; await sleep(300); }
const nb = s.people.find((p) => p.id === nora.id).birth;
assert.deepEqual([nb.date, nb.time, nb.timeAccuracy], ["1985-04-03", "07:20", "exact"]);

step("the life events show on the client's timeline");
await page.goto(BASE + `/app/timeline?client=${nora.id}`);
await page.getByRole("heading", { name: "Life Events" }).waitFor({ timeout: 30000 });
await page.getByText(/2 in all/).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/intake-timeline.png`, fullPage: true });

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("intake: all checks passed");
