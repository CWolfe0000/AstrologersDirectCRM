/**
 * First-run setup: a new practitioner is taken through their profile,
 * services, intake forms, hours and public page, and ends with a live page.
 *   node tests/e2e/onboarding.mjs   (production server running)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const stamp = Date.now().toString(36);
const errors = [];
const step = (s) => console.log("•", s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
page.on("pageerror", (e) => errors.push("app: " + e.message));
const call = (url, init) => page.evaluate(async ({ url, init }) => { const r = await fetch(url, init ? { ...init, headers: { "Content-Type": "application/json" } } : undefined); return { status: r.status, body: await r.json().catch(() => null) }; }, { url, init });

step("sign up: the dashboard opens the setup walkthrough");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Orla");
await page.fill("#em", `ob-${stamp}@example.com`);
await page.fill("#pw", "onboarding-pass-1");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.goto(BASE + "/app");
await page.waitForURL(/\/app\/welcome/);
await page.getByRole("heading", { name: "About You" }).waitFor();

step("1. about you");
await page.getByLabel("Your Name").fill("Orla Finch");
await page.getByLabel("Practice Name").fill("Finch Astrology");
await page.getByLabel("Headline").fill("Traditional astrologer");
await page.getByLabel("Short Bio").fill("I read charts with care and clear timing.");
if (SHOTS) await page.screenshot({ path: `${SHOTS}/onboarding-1.png`, fullPage: true });
await page.getByRole("button", { name: /Continue/ }).click();

step("2. services: the two starters are ticked; swap one for a suggestion and set prices");
await page.getByRole("heading", { name: "Your Services" }).waitFor();
assert.equal(await page.getByRole("checkbox", { name: "Offer Natal Chart Reading" }).isChecked(), true);
await page.getByRole("checkbox", { name: "Offer Follow-Up Session" }).uncheck();
await page.getByRole("checkbox", { name: "Offer Horary Question" }).check();
await page.getByLabel("Price").first().fill("$160");
await page.getByLabel("Price").nth(1).fill("$60");
if (SHOTS) await page.screenshot({ path: `${SHOTS}/onboarding-2.png`, fullPage: true });
await page.getByRole("button", { name: "Continue With 2 Services" }).click();

step("3. intake forms: matched to each service");
await page.getByRole("heading", { name: "Intake Forms" }).waitFor({ timeout: 10000 }).catch(async (e) => { await page.screenshot({ path: "/tmp/claude-0/-home-user/b88cb96c-5176-5059-96be-13468fee106f/scratchpad/shots/ob-stuck.png", fullPage: true }); throw new Error(`stuck: ${await page.getByRole("alert").allInnerTexts()} ${e.message.split("\n")[0]}`); });
assert.equal(await page.getByLabel("Intake form for Natal Chart Reading").inputValue(), "new-client");
assert.equal(await page.getByLabel("Intake form for Horary Question").inputValue(), "horary");
await page.getByRole("button", { name: /Continue/ }).click();

step("4. hours");
await page.getByRole("heading", { name: "Your Hours" }).waitFor();
await page.getByRole("button", { name: "Sat" }).click();
await page.getByLabel("From").fill("10:00");
await page.getByRole("button", { name: /Continue/ }).click();

step("5. your page: address, a link, live");
await page.getByRole("heading", { name: "Your Page" }).waitFor();
await page.getByLabel("Your Page Address").fill(`orla-${stamp}`);
await page.getByText("Available", { exact: true }).waitFor();
await page.getByLabel("Link 1 label").fill("Website");
await page.getByLabel("Link 1 address").fill("https://example.com");
await page.getByRole("button", { name: "Finish Setup" }).click();
await page.getByRole("heading", { name: "You’re Ready" }).waitFor();
if (SHOTS) await page.screenshot({ path: `${SHOTS}/onboarding-done.png`, fullPage: true });

step("everything is saved");
let s;
for (let i = 0; i < 30; i++) { s = (await call("/api/v1/bootstrap?view=app")).body; if (s.practitioner.onboarding?.done && (s.practitioner.intakeForms ?? []).length === 2) break; await sleep(300); }
assert.equal(s.practitioner.onboarding.done, true);
assert.equal(s.practitioner.practice, "Finch Astrology");
const forms = s.practitioner.intakeForms;
assert.deepEqual(forms.map((f) => f.title).sort(), ["Horary Question", "New Client Intake"]);
const prof = (await call("/api/v1/booking")).body.profile;
assert.equal(prof.enabled, true);
assert.equal(prof.slug, `orla-${stamp}`);
assert.equal(prof.displayName, "Orla Finch");
assert.deepEqual(prof.services.map((x) => [x.name, x.price, x.format]), [["Natal Chart Reading", "$160", "Live session"], ["Horary Question", "$60", "Live session"]]);
assert.equal(prof.services[1].intakeFormId, forms.find((f) => f.title === "Horary Question").id);
assert.deepEqual(prof.rules.weekly.sat, [{ start: "10:00", end: "17:00" }]);
assert.deepEqual(prof.links, [{ label: "Website", url: "https://example.com" }]);

step("the dashboard no longer sends them to setup");
await page.goto(BASE + "/app");
await page.getByText("Finish Setting Up Your Practice").waitFor({ state: "detached", timeout: 3000 }).catch(() => {});
assert.equal(await page.getByText("Finish Setting Up Your Practice").count(), 0);
assert.match(page.url(), /\/app$/);

step("news emails are opt-in: off unless ticked at sign-up; switch on and off in Settings");
let em = (await call("/api/v1/account/email")).body;
assert.equal(em.on, false, "the optional box was left unticked");
await page.goto(BASE + "/app/settings?section=notifications");
await page.getByRole("switch", { name: "News, Tips and Offers" }).click();
await page.getByText("Subscribed", { exact: true }).waitFor();
em = (await call("/api/v1/account/email")).body;
assert.equal(em.on, true);
assert.ok(em.consentAt, "opt-in recorded with its time");
await page.getByRole("switch", { name: "News, Tips and Offers" }).click();
await page.getByText("Unsubscribed", { exact: true }).waitFor();
em = (await call("/api/v1/account/email")).body;
assert.equal(em.on, false);
const bad = await fetch(`${BASE}/api/public/unsubscribe?u=nobody&t=forged`);
assert.match(await bad.text(), /This Link Isn’t Valid/);

step("the public page shows the services");
await page.goto(`${BASE}/book/orla-${stamp}`);
await page.getByRole("heading", { name: "Orla Finch" }).waitFor();
await page.getByRole("button", { name: /Horary Question/ }).waitFor();

assert.deepEqual(errors, []);
await browser.close();
console.log("onboarding: all checks passed");
