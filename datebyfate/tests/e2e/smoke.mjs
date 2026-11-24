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
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const shot = async (name, opts = {}) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true, ...opts });
const step = (name) => console.log("•", name);

async function fillBirth({ date, time, city }) {
  await page.fill('input[name="date"]', date);
  if (time) await page.fill('input[name="time"]', time);
  else await page.check('input[name="timeUnknown"]');
  await page.getByRole("combobox", { name: "Birthplace" }).fill(city);
  await page.getByRole("listbox").getByRole("option").first().click();
  await page.getByText(/^Time zone:/).waitFor();
}

step("home");
await page.goto(BASE);
await page.getByRole("heading", { level: 1, name: /You have a pattern/ }).waitFor();
await shot("01-home");

step("free reading without an account");
await page.getByRole("link", { name: "Get your free pattern" }).first().click();
await page.waitForURL("**/reading");
await fillBirth({ date: "1990-06-15", time: "14:30", city: "London" });
await page.getByRole("button", { name: "Show my pattern" }).click();
await page.getByText("Your pattern", { exact: true }).waitFor();
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
await page.getByText(/^Time zone: Europe\/London/).waitFor();
await page.getByRole("button", { name: "Show my pattern" }).click();
await page.getByRole("heading", { name: "Your recurring dynamics" }).waitFor();
await page.getByRole("heading", { name: "Your elements" }).waitFor();
await page.getByRole("heading", { name: "Your next relationship period" }).waitFor();
await shot("03-app-home");

step("add past partners");
const exes = [
  { name: "Sam", date: "1988-03-10", time: null, city: "Paris", start: "2012", end: "2014", ending: "them" },
  { name: "Alex", date: "1987-11-02", time: "08:15", city: "Berlin", start: "2015", end: "2018", ending: "them" },
  { name: "Jo", date: "1989-03-14", time: null, city: "London", start: "2019", end: "2022", ending: "me" },
];
for (const ex of exes) {
  await page.goto(`${BASE}/app/exes/new`);
  await page.fill("#person-name", ex.name);
  await fillBirth(ex);
  await page.selectOption("#startYear", ex.start);
  await page.selectOption("#endYear", ex.end);
  await page.selectOption("#ending", ex.ending);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForURL("**/app/exes");
}
await page.getByRole("heading", { name: /repeats? found|No repeats/ }).waitFor();
let text = await page.locator("main").innerText();
assert.match(text, /A random group of 3 people born in the same years would show about \d+\.\d/i);
assert.match(text, /Every partner was older than you/i);
assert.match(text, /They ended 2 of 3\./i);
const hasRepeats = /repeats? found/i.test(text);
if (hasRepeats) assert.match(text, /Subscribe to see what each one is/i); // free plan: locked
await shot("04-exes-free");

step("add someone new (free plan: locked report)");
await page.goto(`${BASE}/app/people/new`);
await page.fill("#person-name", "Charlie");
await fillBirth({ date: "1991-09-23", time: "19:40", city: "Madrid" });
await page.getByRole("button", { name: "Add and read" }).click();
await page.waitForURL(/\/app\/people\/p_/);
const personUrl = page.url();
text = await page.locator("main").innerText();
assert.match(text, /\d+ flowing contacts? and \d+ challenging contacts? between your charts/i);
assert.doesNotMatch(text, /How your charts meet/i);
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
await page.goto(`${BASE}/app/exes`);
text = await page.locator("main").innerText();
if (hasRepeats) assert.match(text, /usual rate about/i);
assert.doesNotMatch(text, /Subscribe to see/i);
await shot("07-exes-premium");
await page.goto(personUrl);
await page.getByRole("heading", { name: "How your charts meet" }).waitFor();
await page.getByRole("heading", { name: "The relationship itself" }).waitFor();
await page.getByRole("heading", { name: "Your elements together" }).waitFor();
await page.getByRole("heading", { name: "What you set off in each other" }).waitFor();
await page.getByRole("heading", { name: "What you bring out in each other" }).waitFor();
assert.equal(await page.getByRole("heading", { name: "In Charlie", exact: true }).count(), 2);
text = await page.locator("main").innerText();
assert.match(text, /Charlie’s (Sun|Moon|Ascendant|Venus|Mars)[A-Za-z, ]* in your \d+(st|nd|rd|th) house/i);
await shot("08-person-premium");
await page.goto(`${BASE}/app/timing`);
await page.getByRole("heading", { name: "Your relationship calendar" }).waitFor();
assert.ok((await page.locator("ol > li").count()) >= 1);
await shot("09-timing");

step("practice: planetary hours and a practice per dynamic");
await page.goto(`${BASE}/app/practice`);
await page.getByRole("heading", { name: /Day Of (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)/ }).waitFor();
assert.equal(await page.locator("ol > li").filter({ hasText: /\d{1,2}:\d{2}/ }).count(), 24);
await page.getByRole("heading", { name: "The forty-nine hours" }).waitFor();
assert.equal(await page.locator("details ul > li").count(), 49);
assert.match(await page.locator("main").innerText(), /Datebyfate makes no claim that any working will have an effect/);
assert.match(await page.locator("main").textContent(), /A curse to turn a person’s loved ones against them/); // inside a closed day
await page.getByRole("heading", { name: "A practice for each of your dynamics" }).waitFor();
assert.match(await page.locator("main").innerText(), /(Venus|Mars|Sun|Moon|Saturn|Jupiter|Mercury) Hour On (Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day/i);
await page.getByRole("combobox", { name: "Where you live now" }).fill("Lisbon");
await page.getByRole("listbox").getByRole("option").first().click();
await page.getByRole("button", { name: "Save place" }).click();
await page.getByText(/Times below are for Lisbon/).waitFor();
await page.reload();
await page.getByText(/Today in Lisbon/i).waitFor();
await shot("12-practice");

step("edit and delete a person");
await page.goto(personUrl + "/edit");
await page.fill("#person-name", "Charlie B");
await page.getByRole("button", { name: "Save" }).click();
await page.waitForURL(personUrl);
await page.getByRole("heading", { level: 1, name: "Charlie B" }).waitFor();
await page.getByRole("button", { name: "Delete Charlie B" }).click();
await page.waitForURL("**/app/people");
await page.getByText("Nobody here yet.").waitFor();

step("another member cannot open someone else's person");
const other = await browser.newContext();
const stranger = await other.newPage();
await stranger.goto(`${BASE}/app/exes`);
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
for (const path of ["/", "/pricing", "/app", "/app/exes", "/app/timing"]) {
  await page.goto(BASE + path);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `${path} scrolls sideways by ${overflow}px`);
  if (path === "/" || path === "/app") await shot(`11-mobile${path.replace(/\//g, "-")}`);
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
