/**
 * Payments at booking (Stripe Connect), against a stand-in for Stripe's API:
 * the astrologer connects Stripe and sets a refund policy; a client pays at
 * booking (the time is held while they pay); the booking appears once Stripe
 * confirms; cancellations refund under the policy; the astrologer can refund;
 * abandoned checkouts release the time; webhooks are signed and idempotent.
 *   Server started with STRIPE_SECRET_KEY=sk_test_mock STRIPE_API_BASE=http://127.0.0.1:4010
 *   STRIPE_WEBHOOK_SECRET=whsec_test_e2e, then: node tests/e2e/payments.mjs
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const WHSEC = "whsec_test_e2e";
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = `pay-${stamp}`;
const ownerEmail = `pay-owner-${stamp}@example.com`;

// ——— A stand-in for Stripe ———————————————————————————————————————
const ACCT = `acct_mock${stamp}`;
const stripe = { account: null, sessions: new Map(), refunds: [], expired: [], calls: [] };
const json = (res, code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const mock = createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const u = new URL(req.url, "http://x");
    const form = Object.fromEntries(new URLSearchParams(req.method === "GET" ? u.search : raw));
    const onBehalf = req.headers["stripe-account"] ?? null;
    stripe.calls.push({ method: req.method, path: u.pathname, form, onBehalf, auth: req.headers.authorization });
    let m;
    if (req.method === "POST" && u.pathname === "/v1/accounts") {
      stripe.account = { id: ACCT, charges_enabled: false, details_submitted: false, default_currency: "usd" };
      return json(res, 200, stripe.account);
    }
    if (req.method === "GET" && u.pathname === `/v1/accounts/${ACCT}`) return json(res, 200, stripe.account);
    if (req.method === "POST" && u.pathname === "/v1/account_links") return json(res, 200, { url: "https://connect.stripe.test/onboarding" });
    if (req.method === "POST" && u.pathname === `/v1/accounts/${ACCT}/login_links`) return json(res, 200, { url: "https://connect.stripe.test/express" });
    if (req.method === "POST" && u.pathname === "/v1/checkout/sessions") {
      const id = `cs_test_${stamp}_${stripe.sessions.size + 1}`;
      stripe.sessions.set(id, { id, form, onBehalf, payment_status: "unpaid", status: "open", payment_intent: null });
      return json(res, 200, { id, url: `https://checkout.stripe.test/pay/${id}` });
    }
    if ((m = u.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/)) && req.method === "GET") {
      const s = stripe.sessions.get(m[1]);
      return s ? json(res, 200, { id: s.id, payment_status: s.payment_status, status: s.status, payment_intent: s.payment_intent }) : json(res, 404, { error: { message: "No such session" } });
    }
    if ((m = u.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)\/expire$/))) {
      stripe.expired.push(m[1]);
      return json(res, 200, { id: m[1], status: "expired" });
    }
    if (req.method === "POST" && u.pathname === "/v1/refunds") {
      stripe.refunds.push({ ...form, onBehalf });
      return json(res, 200, { id: `re_${stripe.refunds.length}`, amount: Number(form.amount) });
    }
    json(res, 404, { error: { message: `mock: ${req.method} ${u.pathname}` } });
  });
});
await new Promise((r) => mock.listen(4010, "127.0.0.1", r));
const pay = (id) => { const s = stripe.sessions.get(id); s.payment_status = "paid"; s.status = "complete"; s.payment_intent = `pi_${id}`; return s; };
const sign = (body, secret = WHSEC, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
const webhook = async (event, secret) => {
  const body = JSON.stringify(event);
  const r = await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": sign(body, secret) }, body });
  return r.status;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
// Stripe's own pages aren't reachable from tests: answer them with a stub.
await ctx.route(/stripe\.test/, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Stripe (test)</title><h1>Stripe</h1>" }));
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (p, url, init) => p.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });
const mail = async (to) => (await db.query('select subject, body from outbox where "to"=$1 order by created_at', [to])).rows;

step("an astrologer with a booking page and two priced services");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Nova");
await page.fill("#em", ownerEmail);
await page.fill("#pw", "payments-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
const st = (await call(page, "/api/v1/bootstrap?view=app")).body;
await call(page, "/api/v1/settings", { method: "PUT", body: JSON.stringify({ practitioner: { ...st.practitioner, name: "Nova Reyes", timezone: "America/Denver", onboarding: { step: 6, done: true } }, defaults: st.defaults }) });
let prof = (await call(page, "/api/v1/booking")).body.profile;
const allDay = Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [{ start: "00:00", end: "23:45" }]]));
const r0 = await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({
  ...prof, slug, enabled: true,
  services: [
    { id: "natal", name: "Natal Chart Reading", description: "", durationMin: 60, price: "$120", format: "Live session", active: true },
    { id: "chat", name: "Quick Chat", description: "", durationMin: 30, price: "Free", format: "Live session", active: true },
  ],
  rules: { ...prof.rules, weekly: allDay, minNoticeHours: 72, maxAdvanceDays: 14, stepMin: 60, bufferMin: 0, changeNoticeHours: 1 },
}) });
assert.equal(r0.status, 200);
prof = r0.body.profile;
assert.deepEqual(prof.refundPolicy, { fullRefundHours: 24, lateRefundPercent: 0 }, "the default policy");

step("before Stripe is connected, payment is arranged directly");
let view = (await call(page, `/api/public/book/${slug}`)).body;
assert.equal(view.payments, null);

step("Settings › Payments: connect Stripe");
await page.goto(BASE + "/app/settings?section=payments");
await page.getByRole("heading", { name: "Your Stripe Account" }).waitFor();
await page.getByText("AstrologersDirect takes no cut.", { exact: false }).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/payments-settings-before.png`, fullPage: true });
await page.getByRole("button", { name: "Set Up Payments With Stripe" }).click();
await page.waitForURL(/connect\.stripe\.test\/onboarding/);
const created = stripe.calls.find((c) => c.path === "/v1/accounts" && c.method === "POST");
assert.equal(created.form["controller[losses][payments]"], "stripe");
assert.equal(created.form["controller[stripe_dashboard][type]"], "express");
assert.equal(created.auth, "Bearer sk_test_mock");
const link = stripe.calls.find((c) => c.path === "/v1/account_links");
assert.match(link.form.return_url, /\/app\/settings\?section=payments&stripe=return$/);
// They finish Stripe's form; Stripe approves the account.
stripe.account = { ...stripe.account, charges_enabled: true, details_submitted: true };
await page.goto(BASE + "/app/settings?section=payments&stripe=return");
await page.getByText("Connected: you can take payments.").waitFor();

step("set the refund policy: full refund 2 days before, 50% after");
await page.getByLabel("Full Refund If Canceled").selectOption("48");
await page.getByLabel("Later Cancellations Get Back").selectOption("50");
await page.getByText("Cancel at least 2 days before your session for a full refund; after that, a 50% refund.").waitFor();
await page.getByRole("button", { name: "Save Changes" }).click();
await page.getByText("Booking Settings Saved").waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/payments-settings.png`, fullPage: true });
assert.deepEqual((await call(page, "/api/v1/booking")).body.profile.refundPolicy, { fullRefundHours: 48, lateRefundPercent: 50 });

step("a client books a priced session and is sent to Stripe Checkout");
const vctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: "America/Denver" });
await vctx.route(/stripe\.test/, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Stripe Checkout (test)</title>" }));
const v = await vctx.newPage();
v.on("pageerror", (e) => errors.push("visitor: " + e.message));
// A second tab on our site for API calls, since the first one goes off to Stripe.
const vapi = await vctx.newPage();
await vapi.goto(`${BASE}/book/${slug}`);
await v.goto(`${BASE}/book/${slug}`);
await v.getByText("Pay securely when you book.", { exact: false }).waitFor();
const before = (await call(vapi, `/api/public/book/${slug}/slots?service=natal`)).body.slots;
// The earliest time is 3 days out (minimum notice), so cancelling it gets a full refund.
async function fillDetails(p, email, first) {
  await p.getByLabel("First Name").fill(first);
  await p.getByLabel("Last Name").fill("Client");
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Date of Birth").fill("1990-03-03");
  await p.getByLabel("Time of Birth").fill("08:15");
  await p.locator("#bk-bp").fill("Par");
  await p.locator("button", { hasText: "Paris, France" }).first().click();
  await p.getByRole("checkbox", { name: /will keep my details/ }).check();
}
const alice = `pay-alice-${stamp}@example.com`;
// Choosing the exact time through the picker is covered by booking.mjs; here the request goes straight to the API from the page.
const book = (p, email, first, start, serviceId = "natal") => call(p, `/api/public/book/${slug}`, { method: "POST", body: JSON.stringify({ serviceId, start, firstName: first, lastName: "Client", email, phone: "", birth: { date: "1990-03-03", time: "08:15", timeAccuracy: "exact", place: "Paris, France", lat: 48.85, lon: 2.35, tz: "Europe/Paris" }, notes: "", tz: "America/Denver" }) });

// Through the page for the first one: the button says it goes to payment and shows the policy.
await v.getByRole("button", { name: /Natal Chart Reading/ }).click();
await v.getByRole("group", { name: "Times" }).getByRole("button").first().click();
await fillDetails(v, alice, "Alice");
await v.getByText("$120, paid securely with Stripe.").waitFor();
await v.getByText("Cancel at least 2 days before your session for a full refund; after that, a 50% refund.").first().waitFor();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/payments-booking.png`, fullPage: true });
await v.getByRole("button", { name: "Continue to Payment" }).click();
await v.waitForURL(/checkout\.stripe\.test\/pay\//);
const sid1 = v.url().split("/pay/")[1];
const s1 = stripe.sessions.get(sid1);
assert.equal(s1.onBehalf, ACCT, "charged on the astrologer's own account");
assert.equal(s1.form["line_items[0][price_data][unit_amount]"], "12000");
assert.equal(s1.form["line_items[0][price_data][currency]"], "usd");
assert.equal(s1.form.customer_email, alice);
assert.equal(s1.form["payment_intent_data[application_fee_amount]"], undefined, "no platform fee");
assert.match(s1.form.success_url, new RegExp(`/book/${slug}\\?paid=\\{CHECKOUT_SESSION_ID\\}$`));
const firstStart = before[0];

step("while they pay, the time is held, and nothing is booked yet");
let slotsNow = (await call(vapi, `/api/public/book/${slug}/slots?service=natal`)).body.slots;
assert.ok(!slotsNow.includes(firstStart), "held while paying");
let boot = (await call(page, "/api/v1/bootstrap?view=app")).body;
assert.ok(!boot.clients.some((c) => c.email === alice), "no client until paid");
assert.equal((await mail(alice)).length, 0, "no confirmation until paid");

step("back from Stripe before payment confirms: the page waits, then shows the booking");
await v.goto(`${BASE}/book/${slug}?paid=${sid1}`);
await v.getByText("Confirming Your Payment…").waitFor();
pay(sid1);
await v.getByRole("heading", { name: "You’re Booked" }).waitFor({ timeout: 15000 });
await v.getByText("Payment Received").waitFor();
assert.ok(!v.url().includes("paid="), "the address is tidied");
if (SHOTS) await v.screenshot({ path: `${SHOTS}/payments-booked.png`, fullPage: true });

step("the booking is filed once, with emails that mention the payment");
boot = (await call(page, "/api/v1/bootstrap?view=app")).body;
const aliceClient = boot.clients.find((c) => c.email === alice);
assert.ok(aliceClient);
const k1 = boot.consultations.filter((k) => k.clientId === aliceClient.id);
assert.equal(k1.length, 1);
assert.match(k1[0].prepNotes, /Paid \$120 online\./);
const am = await mail(alice);
const conf = am.find((m) => m.subject === "Booked: Natal Chart Reading With Nova Reyes");
assert.ok(conf, "confirmation");
assert.match(conf.body, /Paid: \$120\. Cancel at least 2 days before/);
assert.ok((await mail(ownerEmail)).some((m) => m.subject === "New Booking: Alice Client, Natal Chart Reading" && /They paid \$120\./.test(m.body)));

step("Stripe's webhook for the same payment changes nothing (signed, idempotent)");
const completed = { id: "evt_1", type: "checkout.session.completed", account: ACCT, data: { object: { id: sid1, payment_status: "paid", status: "complete", payment_intent: `pi_${sid1}` } } };
assert.equal(await webhook(completed), 200);
assert.equal(await webhook(completed, "whsec_wrong"), 400, "a forged webhook is refused");
const stale = JSON.stringify(completed);
assert.equal((await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", body: stale, headers: { "Stripe-Signature": sign(stale, WHSEC, Math.floor(Date.now() / 1000) - 3600) } })).status, 400, "an old signature is refused");
boot = (await call(page, "/api/v1/bootstrap?view=app")).body;
assert.equal(boot.consultations.filter((k) => k.clientId === aliceClient.id).length, 1, "still one booking");
// Asking again for the confirmation shows the same booking.
const again = (await call(vapi, `/api/public/book/${slug}/confirm`, { method: "POST", body: JSON.stringify({ session: sid1 }) })).body;
assert.equal(again.service, "Natal Chart Reading");
assert.equal(again.consultationId, undefined, "no internal ids");

step("a booking paid through the webhook alone (they closed the tab)");
// Shorter notice now, so a booking can fall inside the 2-day full-refund window.
prof = (await call(page, "/api/v1/booking")).body.profile;
assert.equal((await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, rules: { ...prof.rules, minNoticeHours: 25 } }) })).status, 200);
const soon = (await call(vapi, `/api/public/book/${slug}/slots?service=natal`)).body.slots;
const bob = `pay-bob-${stamp}@example.com`;
const late = soon.find((s) => Date.parse(s) > Date.now() + 26 * 3_600_000 && Date.parse(s) < Date.now() + 40 * 3_600_000 && s !== firstStart);
assert.ok(late, "a time between 26 and 40 hours away");
const b2 = await book(v, bob, "Bob", late);
assert.equal(b2.status, 200);
const sid2 = b2.body.checkout.split("/pay/")[1];
pay(sid2);
assert.equal(await webhook({ id: "evt_2", type: "checkout.session.completed", account: ACCT, data: { object: { id: sid2, payment_status: "paid", status: "complete", payment_intent: `pi_${sid2}` } } }), 200);
boot = (await call(page, "/api/v1/bootstrap?view=app")).body;
const bobClient = boot.clients.find((c) => c.email === bob);
assert.ok(bobClient, "booked from the webhook");

step("cancel 3+ days ahead: a full refund, on the astrologer's account");
const manage1 = am.find((m) => m.subject.startsWith("Booked:")).body.match(/\/book\/manage\/[A-Za-z0-9_-]+/)[0];
await v.goto(BASE + manage1);
await v.getByText("Paid $120").waitFor();
await v.getByRole("button", { name: "Cancel Session" }).click();
await v.getByText("You’ll be refunded $120 to your card.").waitFor();
if (SHOTS) await v.screenshot({ path: `${SHOTS}/payments-cancel.png`, fullPage: true });
await v.getByRole("button", { name: "Cancel Session" }).last().click();
await v.getByText("This session is canceled.").waitFor();
assert.deepEqual(stripe.refunds.map((r) => [r.payment_intent, r.amount, r.onBehalf]), [[`pi_${sid1}`, "12000", ACCT]]);
assert.ok((await mail(alice)).some((m) => m.subject === "Canceled: Natal Chart Reading With Nova Reyes" && /A refund of \$120 is on its way/.test(m.body)));
assert.ok((await mail(ownerEmail)).some((m) => m.subject === "Session Canceled: Alice Client" && /refunded \$120 under your cancellation policy/.test(m.body)));
await v.reload();
await v.getByText("Paid $120 · Refunded $120").waitFor();

step("cancel within 2 days: 50% back under the policy");
const bm = (await mail(bob)).find((m) => m.subject.startsWith("Booked:"));
const r3 = await call(vapi, `/api/public/booking/${bm.body.match(/\/book\/manage\/([A-Za-z0-9_-]+)/)[1]}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Something came up" }) });
assert.equal(r3.status, 200);
assert.equal(stripe.refunds[1].amount, "6000");
assert.ok((await mail(bob)).some((m) => /A refund of \$60 is on its way/.test(m.body)));

step("the astrologer refunds the rest from Settings");
await page.goto(BASE + "/app/settings?section=payments");
await page.getByRole("heading", { name: "Recent Payments" }).waitFor();
await page.getByText("$60 refunded", { exact: false }).waitFor();
page.once("dialog", (d) => d.accept());
await page.getByRole("button", { name: "Refund Bob Client" }).click();
await page.getByText("is on its way back to Bob Client").waitFor();
assert.equal(stripe.refunds[2].amount, "6000");
const pays = (await call(page, "/api/v1/payments")).body.payments;
assert.deepEqual(pays.map((p) => [p.client, p.status, p.refunded]).sort(), [["Alice Client", "refunded", 12000], ["Bob Client", "refunded", 12000]]);
assert.equal((await call(page, "/api/v1/payments/refund", { method: "POST", body: JSON.stringify({ id: pays[0].id }) })).status, 404, "nothing left to refund");
if (SHOTS) await page.screenshot({ path: `${SHOTS}/payments-list.png`, fullPage: true });

step("a client who leaves Checkout without paying frees the time straight away");
const carol = `pay-carol-${stamp}@example.com`;
const t3 = soon.find((s) => s !== firstStart && s !== late && Date.parse(s) > Date.now() + 50 * 3_600_000);
const b4 = await book(v, carol, "Carol", t3);
const sid4 = b4.body.checkout.split("/pay/")[1];
assert.ok(!(await call(vapi, `/api/public/book/${slug}/slots?service=natal`)).body.slots.includes(t3), "held");
const cancelUrl = stripe.sessions.get(sid4).form.cancel_url.replace(/^https?:\/\/[^/]+/, BASE);
await v.goto(cancelUrl);
await v.getByText("Your payment wasn’t completed, so nothing was booked.").waitFor();
for (let i = 0; i < 20 && !stripe.expired.includes(sid4); i++) await sleep(200);
assert.ok(stripe.expired.includes(sid4), "the Stripe session is expired too");
assert.ok((await call(vapi, `/api/public/book/${slug}/slots?service=natal`)).body.slots.includes(t3), "released");
const lateConfirm = await call(vapi, `/api/public/book/${slug}/confirm`, { method: "POST", body: JSON.stringify({ session: sid4 }) });
assert.equal(lateConfirm.status, 410);

step("free services book straight away, without payment");
const dan = `pay-dan-${stamp}@example.com`;
const chatSlots = (await call(vapi, `/api/public/book/${slug}/slots?service=chat`)).body.slots;
const b5 = await book(v, dan, "Dan", chatSlots.find((s) => s !== firstStart && s !== late && s !== t3), "chat");
assert.equal(b5.status, 200);
assert.equal(b5.body.checkout, undefined);
assert.ok(b5.body.manage);

step("payments off: priced services book without payment");
prof = (await call(page, "/api/v1/booking")).body.profile;
await call(page, "/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, takePayments: false }) });
view = (await call(vapi, `/api/public/book/${slug}`)).body;
assert.equal(view.payments, null);
const eve = `pay-eve-${stamp}@example.com`;
const b6 = await book(v, eve, "Eve", (await call(vapi, `/api/public/book/${slug}/slots?service=natal`)).body.slots.at(-1));
assert.equal(b6.status, 200);
assert.equal(b6.body.checkout, undefined);
assert.ok((await mail(eve)).some((m) => /payment arranged directly/.test(m.body)));

step("only the owner sees payments; the dashboard link works once set up");
assert.equal((await call(vapi, "/api/v1/payments")).status, 401);
assert.equal((await call(page, "/api/v1/payments/dashboard", { method: "POST", body: "{}" })).body.url, "https://connect.stripe.test/express");

assert.deepEqual(errors, []);
await browser.close();
mock.close();
await db.end();
console.log("payments: all checks passed");
