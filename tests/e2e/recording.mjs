/**
 * Records real (fake-device) audio in the Recording Studio, delivers it, and
 * checks the stored file plays for the practitioner.
 *   node tests/e2e/recording.mjs   (server running)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now().toString(36);
const step = (s) => console.log("•", s);
const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["microphone", "camera"] });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

step("sign up + sample data");
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Rec");
await page.fill("#em", `rec-${stamp}@example.com`);
await page.fill("#pw", "recording-pass-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));

step("record audio with real (fake) devices");
await page.goto(BASE + "/app/studio?client=c1&chart=ch1");
await page.getByText("Audio only").first().click();
await page.getByRole("switch").first().click();
await page.getByRole("button", { name: /Start recording/ }).click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /^Stop/ }).click();
await page.getByText("Recorded in browser").waitFor({ timeout: 10000 });

step("deliver: the recording uploads and becomes a playable reading");
await page.getByRole("button", { name: /Deliver to client portal/ }).click();
await page.getByText("Delivered to client portal").first().waitFor({ timeout: 20000 });
await page.waitForTimeout(500);
await page.getByText("All changes saved").waitFor({ timeout: 20000 });
const s = await page.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const rec = s.recordings.find((r) => r.fileKey && r.status === "delivered");
assert.ok(rec, "recording stored: " + JSON.stringify(s.recordings.slice(0, 2)));
const reading = s.readings.find((r) => r.id === rec.readingId);
assert.equal(reading.fileKey, rec.fileKey, "reading shares the stored file");
assert.equal(reading.contentType, "audio/webm");
const media = await page.evaluate((id) => fetch(`/api/v1/media/readings/${id}`).then(async (r) => ({ status: r.status, size: (await r.arrayBuffer()).byteLength, type: r.headers.get("content-type") })), reading.id);
assert.equal(media.status, 200);
assert.ok(media.size > 1000, `recorded audio has content (${media.size} bytes)`);

step("deleting the recording keeps the delivered reading's file");
await page.evaluate((id) => fetch(`/api/v1/records/recordings/${id}`, { method: "DELETE" }), rec.id);
const still = await page.evaluate((id) => fetch(`/api/v1/media/readings/${id}`).then((r) => r.status), reading.id);
assert.equal(still, 200, "reading still playable");

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("✓ recording passed");
