/**
 * Built-in calls (Daily): a live service books onto an AstrologersDirect call;
 * the client joins from their booking link (opens 30 minutes before), the
 * astrologer joins as the room's owner; the room is private and audio-only
 * services start with the camera off; an astrologer can switch back to their
 * own Zoom link. Runs against a stand-in for Daily's API, or the real one with
 * REAL_DAILY=1 (server started without DAILY_API_BASE).
 *   node tests/e2e/calls.mjs   (server with DAILY_API_KEY=mock DAILY_API_BASE=http://127.0.0.1:4011)
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const REAL = process.env.REAL_DAILY === "1";
const SHOTS = process.env.SHOTS;
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const slug = `call-${stamp}`;

// ——— A stand-in for Daily ——————————————————————————————————————————
const daily = { rooms: new Map(), tokens: [], calls: [] };
const mock = REAL ? null : createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = raw ? JSON.parse(raw) : {};
    daily.calls.push({ method: req.method, path: req.url, body, auth: req.headers.authorization });
    const send = (code, b) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(b)); };
    let m;
    if ((m = req.url.match(/^\/rooms\/([^/]+)$/)) && req.method === "POST") {
      const r = daily.rooms.get(m[1]);
      if (!r) return send(404, { error: "not-found", info: `room ${m[1]} not found` });
      r.properties = { ...r.properties, ...body.properties };
      return send(200, r);
    }
    if (req.url === "/rooms" && req.method === "POST") {
      const r = { name: body.name, url: `https://astrologersdirect.daily.test/${body.name}`, privacy: body.privacy, properties: body.properties };
      daily.rooms.set(body.name, r);
      return send(200, r);
    }
    if (req.url === "/meeting-tokens" && req.method === "POST") {
      daily.tokens.push(body.properties);
      return send(200, { token: `tok_${daily.tokens.length}` });
    }
    send(404, { error: "mock", info: `${req.method} ${req.url}` });
  });
});
if (mock) await new Promise((r) => mock.listen(4011, "127.0.0.1", r));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (p, url, init) => p.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });
const mail = async (to) => (await db.query('select subject, body from outbox where "to"=$1 order by created_at', [to])).rows;

step("calls are switched on");
assert.equal((await (await fetch(`${BASE}/api/public/calls`)).json()).enabled, true);

step("an astrologer with an audio-only live service");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Luna");
await page.fill("#em", `call-owner-${stamp}@example.com`);
await page.fill("#pw", "calls-pass-12345");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
const st = (await call(page, "/api/v1/bootstrap?view=app")).body;
await call(page, "/api/v1/settings", { method: "PUT", body: JSON.stringify({ practitioner: { ...st.practitioner, name: "Luna Gray", timezone: "America/Chicago", onboarding: { step: 6, done: true } }, defaults: st.defaults }) });
let prof = (await call(page, "/api/v1/booking")).body.profile;
const allDay = Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [{ start: "00:00", end: "23:45" }]]));
const saved = await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({
  ...prof, slug, enabled: true,
  services: [{ id: "talk", name: "Audio Reading", description: "", durationMin: 60, price: "", format: "Live session", call: "audio", active: true }],
  rules: { ...prof.rules, weekly: allDay, minNoticeHours: 0, maxAdvanceDays: 14, stepMin: 15, bufferMin: 0, changeNoticeHours: 0 },
}) });
assert.equal(saved.status, 200);

step("Settings: built-in calls by default, with video or audio per service");
await page.goto(BASE + "/app/settings?section=services");
assert.equal(await page.getByLabel("Live Sessions Happen On").inputValue(), "astrologersdirect");
assert.equal(await page.getByLabel("Call", { exact: true }).inputValue(), "audio");
assert.equal(await page.getByLabel("Call Link").count(), 0, "no Zoom link needed");

step("a client books: the public page and confirmation say it's an audio call here");
const v = await (await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: "America/Chicago" })).newPage();
v.on("pageerror", (e) => errors.push("visitor: " + e.message));
await v.goto(`${BASE}/book/${slug}`);
await v.getByText("Live Session (Audio)").first().waitFor();
const slots = (await call(v, `/api/public/book/${slug}/slots?service=talk`)).body.slots;
const soon = slots[0];
assert.ok(Date.parse(soon) - Date.now() < 30 * 60_000, "a time within 30 minutes");
const later = slots.find((s) => Date.parse(s) > Date.now() + 3 * 86_400_000);
const client = `call-client-${stamp}@example.com`;
const book = (start, email, first) => call(v, `/api/public/book/${slug}`, { method: "POST", body: JSON.stringify({ serviceId: "talk", start, firstName: first, lastName: "Moon", email, phone: "", birth: { date: "1991-02-02", time: "10:00", timeAccuracy: "exact", place: "Chicago, USA", lat: 41.88, lon: -87.63, tz: "America/Chicago" }, notes: "", tz: "America/Chicago" }) });
const b1 = await book(soon, client, "Ada");
assert.equal(b1.status, 200, JSON.stringify(b1.body));
assert.equal(b1.body.call, "audio");
assert.equal(b1.body.meetingUrl, null);
const conf = (await mail(client)).find((m) => m.subject.startsWith("Booked:"));
assert.match(conf.body, /Audio call on AstrologersDirect: join from your booking link below \(it opens 30 minutes before\)/);
const token = b1.body.manage.split("/").pop();

step("the client joins from their booking link: a private room, camera off, not the owner");
await v.goto(`${BASE}/book/manage/${token}`);
await v.getByRole("link", { name: "Join Audio Call" }).click();
await v.waitForURL(/\/call$/);
await v.getByRole("heading", { name: "Ready to Join?" }).waitFor();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/call-ready.png`, fullPage: true });
const j1 = await call(v, `/api/public/booking/${token}/call`, { method: "POST", body: "{}" });
assert.equal(j1.status, 200, JSON.stringify(j1.body));
assert.ok(j1.body.url && j1.body.token);
assert.equal(j1.body.audioOnly, true);
assert.equal(j1.body.astrologer, "Luna Gray");
if (!REAL) {
  const room = [...daily.rooms.values()][0];
  assert.equal(room.privacy, "private");
  assert.equal(room.properties.start_video_off, true);
  assert.ok(room.properties.exp > Date.now() / 1000);
  assert.deepEqual([daily.tokens[0].is_owner, daily.tokens[0].user_name, daily.tokens[0].room_name], [false, "Ada Moon", room.name]);
  assert.equal(daily.calls[0].auth, "Bearer mock");
}

step("the astrologer joins the same room as its owner");
const k = (await call(page, "/api/v1/bootstrap?view=app")).body.consultations.find((x) => x.callMode === "audio");
assert.ok(k && !k.meetingUrl);
const j2 = await call(page, `/api/v1/calls/${encodeURIComponent(k.id)}`, { method: "POST", body: "{}" });
assert.equal(j2.status, 200);
assert.equal(j2.body.url, j1.body.url, "same room");
if (!REAL) { assert.equal(daily.tokens.at(-1).is_owner, true); assert.equal(daily.rooms.size, 1); }
await page.goto(`${BASE}/app/consultations?id=${encodeURIComponent(k.id)}`);
await page.getByRole("link", { name: "Start Call" }).first().click();
await page.waitForURL(/\/call$/);
await page.getByRole("heading", { name: "Ready to Join?" }).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/call-astrologer.png`, fullPage: true });

step("clients can't join days early; strangers can't join at all");
const b2 = await book(later, `call-late-${stamp}@example.com`, "Bea");
const t2 = b2.body.manage.split("/").pop();
const early = await call(v, `/api/public/booking/${t2}/call`, { method: "POST", body: "{}" });
assert.equal(early.status, 425);
assert.match(early.body.error, /opens 30 minutes before/);
assert.equal((await call(v, `/api/public/booking/${"x".repeat(43)}/call`, { method: "POST", body: "{}" })).status, 404);
assert.equal((await call(v, `/api/v1/calls/${encodeURIComponent(k.id)}`, { method: "POST", body: "{}" })).status, 401);

step("switch to their own Zoom link: new bookings get the link, no built-in call");
prof = (await call(page, "/api/v1/booking")).body.profile;
await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, callVia: "own-link", meetingUrl: "https://zoom.example.com/j/123" }) });
const b3 = await book(slots.find((s) => Date.parse(s) > Date.parse(soon) + 2 * 3_600_000 && Date.parse(s) < Date.parse(later) - 2 * 3_600_000), `call-zoom-${stamp}@example.com`, "Cy");
assert.equal(b3.status, 200, JSON.stringify(b3.body));
assert.equal(b3.body.call, null);
assert.equal(b3.body.meetingUrl, "https://zoom.example.com/j/123");
const t3 = b3.body.manage.split("/").pop();
assert.equal((await call(v, `/api/public/booking/${t3}/call`, { method: "POST", body: "{}" })).status, 409);

assert.deepEqual(errors, []);
await browser.close();
mock?.close();
await db.end();
console.log("calls: all checks passed");
