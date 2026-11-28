// End-to-end walk through the product. Needs a running server (BASE_URL, default http://localhost:3100)
// and DATABASE_URL (to grant complimentary access part-way through).
//   npm run build && npx next start -p 3100 &   then   npm run test:e2e
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS_DIR;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const email = `e2e-${Date.now()}@example.com`;
const password = "correct-horse-battery";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e}`));
page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()}: ${m.text()}`));
const shot = async (name, opts = {}) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true, ...opts });
const step = (name) => console.log("•", name);

async function fillBirth({ date, time, city }) {
  await page.fill('input[name="date"]', date);
  if (time) await page.fill('input[name="time"]', time);
  else await page.check('input[name="timeUnknown"]');
  await page.getByRole("combobox", { name: "Birthplace" }).fill(city);
  await page.getByRole("listbox").getByRole("option").first().click();
  await page.getByText(/^Time zone:/i).waitFor();
}

step("home");
await page.goto(BASE);
await page.getByRole("heading", { level: 1, name: /You have a pattern/i }).waitFor();
await shot("01-home");

step("free reading without an account");
await page.getByRole("link", { name: "Get your free pattern" }).first().click();
await page.waitForURL("**/reading");
await fillBirth({ date: "1990-06-15", time: "14:30", city: "London" });
await page.getByRole("button", { name: "Show my pattern" }).click();
await page.getByRole("heading", { name: "How you are in love" }).waitFor();
assert.ok(await page.locator("svg[role=img]").count() >= 1, "free reading shows a chart wheel");
assert.match(await page.locator("body").innerText(), /Descendant in Aries/i);
assert.match(await page.locator("body").innerText(), /Venus in (Taurus|Gemini|Cancer)/i);
await shot("02-free-reading");

step("sign up; birth details carry over");
await page.getByRole("link", { name: "Create a free account" }).first().click();
await page.waitForURL("**/signup");
await page.fill("#name", "Robin");
await page.fill("#email", email);
await page.fill("#password", password);
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/app");
await page.getByRole("heading", { name: "Welcome, Robin" }).waitFor();
assert.equal(await page.inputValue('input[name="date"]'), "1990-06-15");
await page.getByText(/^Time zone: Europe\/London/i).waitFor();
await page.getByRole("button", { name: "Show my chart" }).click();
await page.getByRole("heading", { level: 1, name: "You" }).waitFor();
await page.getByRole("heading", { name: "How you are in love" }).waitFor();
await page.getByRole("heading", { name: "Your next relationship period" }).waitFor();
await page.getByRole("heading", { name: "Your Nodes" }).waitFor();
assert.ok(await page.locator("main svg[role=img]").count() >= 1, "You page shows the natal wheel");
await shot("03-app-home");
await page.goto(`${BASE}/app?tab=elements`);
await page.getByRole("heading", { name: "Your elements" }).waitFor();
await page.goto(`${BASE}/app?tab=dynamics`);
await page.getByRole("heading", { name: "Your recurring dynamics" }).waitFor();
await page.goto(`${BASE}/app?tab=aspects`);
await page.getByRole("heading", { name: "Aspects in your chart" }).waitFor();
await shot("03b-you-aspects");

step("add past partners");
const exes = [
  { name: "Sam", date: "1988-03-10", time: null, city: "Paris", met: "2012-01-10", start: "2012-02-01", end: "2014-03-01", ending: "them", friends: "yes" },
  { name: "Alex", date: "1987-11-02", time: "08:15", city: "Berlin", met: "2015-04-02", start: "2015-04-20", end: "2018-05-01", ending: "them", friends: "no" },
  { name: "Jo", date: "1989-03-14", time: null, city: "London", met: "2019-01-05", start: "2019-06-01", end: "2022-06-01", ending: "me", friends: "yes" },
];
for (const ex of exes) {
  await page.goto(`${BASE}/app/people/new?kind=ex`);
  await page.fill("#person-name", ex.name);
  await fillBirth(ex);
  await page.fill("#metDate", ex.met);
  await page.fill("#startDate", ex.start);
  await page.fill("#endDate", ex.end);
  await page.selectOption("#stayedFriends", ex.friends);
  await page.selectOption("#ending", ex.ending);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForURL(/\/app\/people\/p_/);
}
await page.goto(`${BASE}/app/people`);
await page.getByRole("heading", { level: 1, name: "People" }).waitFor();
await shot("04a-people");
await page.goto(`${BASE}/app/patterns`);
await page.getByRole("heading", { name: /repeats? found|No repeats/i }).waitFor();
let text = await page.locator("main").innerText();
assert.match(text, /A random group of 3 people born in the same years would show about \d+\.\d/i);
assert.match(text, /Every partner was older than you/i);
assert.match(text, /They ended 2 of 3\./i);
assert.match(text, /You stayed friends with 2 of 3\./i);
assert.match(text, /When your relationships begin/i);
const hasRepeats = /repeats? found/i.test(text);
if (hasRepeats) assert.match(text, /Subscribe to see what each one is/i); // free plan: locked
await shot("04-exes-free");

step("add someone new (free plan: locked report)");
await page.goto(`${BASE}/app/people/new?kind=match`);
await page.fill("#person-name", "Charlie");
await fillBirth({ date: "1991-09-23", time: "19:40", city: "Madrid" });
await page.getByRole("button", { name: "Add and read" }).click();
await page.waitForURL(/\/app\/people\/p_/);
const personUrl = page.url();
await page.getByRole("heading", { level: 1, name: "Charlie" }).waitFor();
await shot("05-person-overview");
await page.goto(personUrl + "?tab=between");
await page.getByText(/between your charts/i).waitFor();
assert.ok(await page.locator("main svg[role=img]").count() >= 1, "bi-wheel is drawn on the free plan");
text = await page.locator("main").innerText();
assert.match(text, /\d+ flowing contacts? and \d+ challenging contacts? between your charts/i);
assert.doesNotMatch(text, /How your charts meet/i);
await page.goto(personUrl + "?tab=triggers");
await page.getByText(/Charlie sets off/i).waitFor();
text = await page.locator("main").innerText();
assert.match(text, /Charlie sets off \d+ and eases \d+ of the \d+ difficult aspects? in your chart, and brings out \d+ of your \d+ strengths?/i);
await shot("05-person-free");

step("pricing without Stripe configured says so and charges nothing");
await page.goto(`${BASE}/pricing`);
await page.getByRole("button", { name: "Subscribe monthly" }).click();
await page.waitForURL(/\/pricing\?billing=/);
await page.getByRole("alert").filter({ hasText: /Subscriptions aren’t open yet|couldn’t open the payment page/ }).waitFor();
await shot("06-pricing");

step("subscriber view");
execFileSync("node", ["scripts/set-plan.mjs", email, "premium"], { stdio: "inherit" });
await page.goto(`${BASE}/app/patterns`);
text = await page.locator("main").innerText();
if (hasRepeats) assert.match(text, /usual rate about/i);
assert.doesNotMatch(text, /Subscribe to see/i);
await shot("07-exes-premium");
await page.goto(personUrl + "?tab=between");
await page.getByRole("heading", { name: "How your charts meet" }).waitFor();
await page.getByText(/Overall Compatibility With Charlie/i).waitFor();
await page.getByRole("heading", { name: "Love Language" }).waitFor();
await page.getByRole("heading", { name: "Physical Compatibility" }).waitFor();
await page.getByRole("heading", { name: "Aspect grid" }).waitFor();
await page.getByRole("heading", { name: "Your elements together" }).waitFor();
text = await page.locator("main").innerText();
assert.match(text, /Charlie’s (Sun|Moon|Ascendant|Venus|Mars)[A-Za-z, ]* in your \d+(st|nd|rd|th) house/i);
await shot("08-person-between");
await page.goto(personUrl + "?tab=triggers");
await page.getByRole("heading", { name: "What you set off in each other" }).waitFor();
await page.getByRole("heading", { name: "What you bring out in each other" }).waitFor();
assert.equal(await page.getByRole("heading", { name: "In Charlie", exact: true }).count(), 2);
await shot("08b-person-triggers");
await page.goto(personUrl + "?tab=relationship");
await page.getByRole("heading", { name: "The next 12 months for the two of you" }).waitFor();
assert.ok(await page.locator("main svg[role=img]").count() >= 1, "composite wheel is drawn");
await shot("08c-person-relationship");
await page.goto(`${BASE}/app/timing`);
await page.waitForURL("**/app/calendar");
await page.getByRole("heading", { level: 1, name: "Calendar" }).waitFor();
assert.ok(await page.locator("main svg[role=img]").count() >= 1, "transit wheel is drawn");
assert.ok((await page.locator("article ul > li").count()) >= 1);
await shot("09-timing");

step("timeline: transits, progressions and solar arcs, with romance windows");
await page.goto(`${BASE}/app/timeline`);
await page.getByRole("heading", { level: 1, name: "Timeline" }).waitFor();
assert.match(await page.locator("main").innerText(), /Romance Windows/i);
assert.match(await page.locator("main").innerText(), /Solar Arcs/i);
await shot("13-timeline");
await page.goto(`${BASE}/app/timeline?who=${personUrl.split("/").pop()}`);
await page.getByRole("heading", { level: 1, name: "Timeline" }).waitFor();
assert.match(await page.locator("main").innerText(), /Charlie’s Romance Windows/i);
await shot("13b-timeline-person");

step("practice: planetary hours and a practice per dynamic");
await page.goto(`${BASE}/app/practice`);
await page.getByRole("heading", { name: /Day Of (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)/i }).waitFor();
assert.equal(await page.locator("ol > li").filter({ hasText: /\d{1,2}:\d{2}/ }).count(), 24);
await page.getByRole("heading", { name: "The forty-nine hours" }).waitFor();
assert.equal(await page.locator("details ul > li").count(), 49);
assert.match(await page.locator("main").innerText(), /Datebyfate makes no claim that any working will have an effect/i);
assert.match(await page.locator("main").textContent(), /A curse to turn a person’s loved ones against them/i); // inside a closed day
await page.getByRole("heading", { name: "A practice for each of your dynamics" }).waitFor();
assert.match(await page.locator("main").innerText(), /(Venus|Mars|Sun|Moon|Saturn|Jupiter|Mercury) Hour On (Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day/i);
await page.getByRole("combobox", { name: "Where you live now" }).fill("Lisbon");
await page.getByRole("listbox").getByRole("option").first().click();
await page.getByRole("button", { name: "Save place" }).click();
await page.getByText(/Times below are for Lisbon/i).waitFor();
await page.reload();
await page.getByText(/Today in Lisbon/i).waitFor();
await shot("12-practice");

step("edit and delete a person");
await page.goto(personUrl + "/edit");
await page.fill("#person-name", "Charlie B");
await page.selectOption("#status", "current");
await page.fill("#startDate", "2024-02-14");
assert.equal(await page.locator("#endDate").count(), 0, "a current partner is not asked when it ended");
await page.getByRole("button", { name: "Save" }).click();
await page.waitForURL(personUrl);
await page.getByRole("heading", { level: 1, name: "Charlie B" }).waitFor();
assert.match(await page.locator("main").innerText(), /Current Partner/i);
await page.goto(`${BASE}/app/people`);
assert.match(await page.locator("main").innerText(), /Charlie B\s+Current Partner/i);
assert.match(await page.locator("main").innerText(), /Feb 14, 2024 – now/i);
await page.goto(personUrl);
await page.getByRole("button", { name: "Delete", exact: true }).click();
await page.waitForURL("**/app/people");
await page.getByRole("heading", { level: 1, name: "People" }).waitFor();
assert.doesNotMatch(await page.locator("main").innerText(), /Charlie B/i);

step("another member cannot open someone else's person");
const other = await browser.newContext();
const stranger = await other.newPage();
await stranger.goto(`${BASE}/app/patterns`);
await stranger.waitForURL("**/login"); // signed out → sign-in page
await other.close();

step("sign out, wrong password, sign in");
await page.goto(`${BASE}/app/account`);
await shot("10-account");
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(BASE + "/");
await page.goto(`${BASE}/app`);
await page.waitForURL("**/login");
await page.fill("#email", email);
await page.fill("#password", "wrong-password-here");
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByRole("alert").filter({ hasText: "don’t match" }).waitFor();
await page.fill("#password", password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/app");

step("webhook rejects unsigned calls");
const hook = await page.request.post(`${BASE}/api/stripe/webhook`, { data: { type: "customer.subscription.updated" } });
assert.ok([400, 503].includes(hook.status()), `webhook answered ${hook.status()}`);

step("mobile layout has no sideways scroll");
await page.setViewportSize({ width: 390, height: 800 });
for (const path of ["/", "/pricing", "/app", "/app/people", "/app/patterns", "/app/calendar", "/app/timeline", "/app/practice"]) {
  await page.goto(BASE + path);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `${path} scrolls sideways by ${overflow}px`);
  if (path !== "/pricing") await shot(`11-mobile${path.replace(/\//g, "-")}`);
}
await page.setViewportSize({ width: 1280, height: 900 });

step("delete account");
await page.goto(`${BASE}/app/account`);
await page.fill("#confirm", "DELETE");
await page.getByRole("button", { name: "Delete my account" }).click();
await page.waitForURL(/\/\?deleted=1/);
await page.goto(`${BASE}/login`);
await page.fill("#email", email);
await page.fill("#password", password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByRole("alert").filter({ hasText: "don’t match" }).waitFor();

await browser.close();
assert.deepEqual(errors, [], "browser errors:\n" + errors.join("\n"));
console.log("\nAll steps passed.");
