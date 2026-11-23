/**
 * The client portal, end to end: a new client invited from the New Client
 * form gets a real email, a chart is shared to their portal, the astrologer
 * and client message each other (with emails, badges and read receipts), and
 * the portal offers the astrologer's booking page.
 *   node tests/e2e/portal-messages.mjs   (production server running; reads email from the outbox)
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
const ownerEmail = `pm-owner-${stamp}@example.com`;
const miaEmail = `pm-mia-${stamp}@example.com`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mailTo(to, subjectLike) {
  for (let i = 0; i < 40; i++) {
    const { rows } = await db.query('select subject, body from outbox where "to"=$1 and subject like $2 order by created_at desc', [to, subjectLike]);
    if (rows.length) return rows;
    await sleep(250);
  }
  return [];
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const api = (url, init) => page.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });

step("practitioner signs up and turns on online booking");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Pia");
await page.fill("#em", ownerEmail);
await page.fill("#pw", "portal-messages-pass-1");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
const prof = (await api("/api/v1/booking")).body.profile;
assert.equal((await api("/api/v1/booking", { method: "PUT", body: JSON.stringify({ ...prof, enabled: true }) })).status, 200);

step("New Client form: the portal invitation is really emailed");
await page.goto(BASE + "/app/clients/new");
await page.fill("#fn", "Mia");
await page.fill("#ln", "Tester");
await page.fill("#em", miaEmail);
await page.getByRole("button", { name: /^Next/ }).click();
await page.fill("#bd", "1990-05-05");
await page.locator("#bt").fill("12:00").catch(() => {});
await page.locator("#bp").fill("London");
await page.getByRole("listbox", { name: "Places" }).getByRole("option").first().click();
await page.getByRole("button", { name: /Generate natal chart/ }).click();
await page.getByRole("button", { name: /^Continue/ }).click();
const invite = page.getByRole("checkbox", { name: /Invite Mia to the client portal/ });
if (!(await invite.isChecked())) await invite.check();
await page.getByRole("button", { name: /Save Client & Chart/ }).click();
await page.waitForURL((u) => /\/app\/clients\/[^/]+$/.test(u.pathname) && !u.pathname.endsWith("/new"));
const clientId = page.url().split("/").pop();
const inv = await mailTo(miaEmail, "%Invited You to Your Client Portal%");
assert.equal(inv.length, 1, "invitation emailed from the New Client form");
const inviteLink = inv[0].body.match(/https?:\/\/[^\s]+\/auth\/invite\?token=[A-Za-z0-9_-]+/)[0].replace(/^https?:\/\/[^/]+/, BASE);

step("share the natal chart with the client");
let st, chart;
for (let i = 0; i < 30 && !chart; i++) { st = (await api("/api/v1/bootstrap?view=app")).body; chart = st.charts.find((c) => c.clientId === clientId); if (!chart) await sleep(300); }
assert.ok(chart, "natal chart saved");
await page.goto(BASE + `/app/charts/${chart.id}`);
await page.getByRole("img", { name: "Chart Wheel" }).first().waitFor();
await page.getByRole("button", { name: "Chart Actions" }).click();
await page.getByRole("menuitem", { name: "Share With Client" }).click();
await page.getByText("Shared With Client").first().waitFor();
for (let i = 0; i < 20; i++) { st = (await api("/api/v1/bootstrap?view=app")).body; if (st.charts.find((c) => c.id === chart.id)?.shared) break; await sleep(300); }
assert.ok(st.charts.find((c) => c.id === chart.id).shared?.view?.inner?.bodies?.length >= 10, "snapshot saved");

step("practitioner messages Mia");
await page.goto(BASE + `/app/messages?client=${clientId}`);
await page.getByText("Portal invitation sent, not yet accepted").waitFor();
await page.getByLabel("Message", { exact: true }).fill("Hi Mia, welcome! Your natal chart is in your portal.");
await page.getByRole("button", { name: "Send Message" }).click();
await page.getByText("Hi Mia, welcome!").waitFor();

step("Mia accepts the invitation and sees the message, chart and booking link");
const cctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const cp = await cctx.newPage();
cp.on("pageerror", (e) => errors.push("portal: " + e.message));
await cp.goto(inviteLink);
await cp.click('button[type="submit"]');
await cp.waitForURL(/\/portal/);
const book = cp.getByRole("link", { name: "Book a Session" }).first();
await book.waitFor();
assert.match(await book.getAttribute("href"), /^\/book\/[a-z0-9-]+$/);
await cp.getByRole("link", { name: /Message Pia/ }).click();
await cp.waitForURL(/\/portal\/messages/);
await cp.getByText("Hi Mia, welcome!").waitFor();
await cp.getByLabel("Message", { exact: true }).fill("Thank you! Quick question about my Moon.");
await cp.getByRole("button", { name: "Send Message" }).click();
await cp.getByText("Quick question about my Moon").waitFor();
if (SHOTS) await cp.screenshot({ path: `${SHOTS}/portal-messages.png` });
assert.equal((await mailTo(ownerEmail, "New Message From Mia")).length, 1, "practitioner emailed");
await cp.goto(BASE + "/portal/charts");
await cp.getByText(chart.title).click();
await cp.getByRole("img", { name: "Chart Wheel" }).first().waitFor();
await cp.getByRole("cell", { name: /Sun/ }).first().waitFor();
if (SHOTS) await cp.screenshot({ path: `${SHOTS}/portal-chart.png`, fullPage: true });

step("practitioner: unread badge, reads the reply, Mia sees it was seen");
const count = (await api("/api/v1/messages?count=1")).body.unread;
assert.equal(count, 1);
await page.goto(BASE + `/app/messages?client=${clientId}`);
await page.getByRole("log").getByText("Quick question about my Moon").waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/app-messages.png` });
for (let i = 0; i < 20 && (await api("/api/v1/messages?count=1")).body.unread !== 0; i++) await sleep(300);
assert.equal((await api("/api/v1/messages?count=1")).body.unread, 0, "marked read");
await page.getByLabel("Message", { exact: true }).fill("Good question: let's look at it together.");
await page.getByRole("button", { name: "Send Message" }).click();
await page.getByText("let's look at it together").waitFor();
assert.equal((await mailTo(miaEmail, "New Message From %")).length, 1, "second message within 20 minutes isn't emailed again while the first was unread");
await cp.goto(BASE + "/portal/messages");
await cp.getByText("let's look at it together").waitFor();
await cp.getByText(/^Seen /).waitFor();

step("access rules: no messages in another practice; text is encrypted at rest");
const { rows } = await db.query("select sealed from messages where client_id=$1 limit 1", [clientId]);
assert.ok(rows.length && !rows[0].sealed.includes("Mia"), "sealed");
assert.equal((await cp.evaluate(async () => (await fetch("/api/v1/portal/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ practiceId: "prc_nope", body: "x" }) })).status)), 404);
assert.equal((await cp.evaluate(async () => (await fetch("/api/v1/messages")).status)), 403);

assert.deepEqual(errors, []);
await browser.close();
await db.end();
console.log("✓ client portal: invite, shared chart, messaging, booking");
