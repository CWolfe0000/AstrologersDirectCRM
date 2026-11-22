/**
 * Two devices, one account: edit-conflict protection, observation merge,
 * other-device changes and deletions, server-kept observation history.
 *   node tests/e2e/conflicts.mjs   (server running)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now().toString(36);
const email = `conf-${stamp}@example.com`;
const password = "conflict-pass-123";
const step = (s) => console.log("•", s);
const errors = [];

const browser = await chromium.launch();
const A = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const B = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
for (const p of [A, B]) p.on("pageerror", (e) => errors.push(e.message));

step("one account on two devices");
await A.goto(BASE + "/auth/signup");
await A.fill("#fn", "Conf");
await A.fill("#em", email);
await A.fill("#pw", password);
await A.check('input[type="checkbox"][required]');
await A.click('button[type="submit"]');
await A.waitForURL(/verify/);
await A.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
await B.goto(BASE + "/auth/login?method=password");
await B.fill("#email", email);
await B.fill("#password", password);
await B.click('button[type="submit"]');
await B.waitForURL(/\/app/);
const state = (p) => p.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const put = (p, coll, rec, base) =>
  p.evaluate(([c, r, b]) => fetch(`/api/v1/records/${c}/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...(b === null ? {} : { "x-base-version": String(b) }) }, body: JSON.stringify(r) }).then(async (x) => ({ status: x.status, body: await x.json() })), [coll, rec, base]);

step("a save based on an old version is refused with the current record");
let s = await state(A);
const t4 = s.tasks.find((t) => t.id === "t4");
const v = s.versions.tasks.t4;
const first = await put(A, "tasks", { ...t4, title: "Edited on A" }, v);
assert.equal(first.status, 200);
assert.equal(first.body.version, v + 1);
const stale = await put(B, "tasks", { ...t4, title: "Edited on B" }, v);
assert.equal(stale.status, 409);
assert.equal(stale.body.details.current.title, "Edited on A");

step("the other device picks up the change (and a deletion)");
await B.goto(BASE + "/app/tasks");
await B.getByText("Edited on A").first().waitFor({ timeout: 10000 });
await A.evaluate(() => fetch("/api/v1/records/tasks/t13", { method: "DELETE" }));
s = await state(A);
const t9 = s.tasks.find((t) => t.id === "t9");
await put(A, "tasks", { ...t9, title: `Changed elsewhere ${stamp}` }, s.versions.tasks.t9);
await B.evaluate(() => window.dispatchEvent(new Event("focus")));
await B.getByText(`Changed elsewhere ${stamp}`).first().waitFor({ timeout: 10000 });
assert.equal(await B.getByText("Follow up with Theo about returning").count(), 0, "deleted task disappears on the other device");

step("observation clash: the newer text stays, the other device's text is kept as a revision");
await B.goto(BASE + "/app/observations?id=o2");
await B.getByPlaceholder("Observation Title").waitFor();
s = await state(A);
const o2 = s.observations.find((o) => o.id === "o2");
await put(A, "observations", { ...o2, body: "<p>Text written on device A.</p>" }, s.versions.observations.o2);
const editor = B.locator("[contenteditable=true]").first();
await editor.click();
await B.keyboard.press("End");
await B.keyboard.type(" Text typed on device B.");
await B.getByPlaceholder("Observation Title").click();
await B.getByText("also edited on another device").first().waitFor({ timeout: 15000 });
await B.getByText("All changes saved").waitFor({ timeout: 15000 });
s = await state(A);
const merged = s.observations.find((o) => o.id === "o2");
assert.ok(merged.body.includes("Text written on device A."), "newest saved text kept");
assert.ok(merged.revisions.some((r) => (r.body ?? "").includes("Text typed on device B.")), "device B's text kept as a revision");

step("server keeps observation versions for restore");
const hist = await A.evaluate(() => fetch("/api/v1/observations/o2/history").then((r) => r.json()));
assert.ok(hist.versions.length >= 1 && hist.versions[0].body.length > 0, "history available");

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("✓ conflicts passed");
