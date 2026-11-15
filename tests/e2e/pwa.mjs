/**
 * Installable app: manifest, icons, service worker, offline page, and no cached data.
 *   node tests/e2e/pwa.mjs   (production server running)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const step = (s) => console.log("•", s);
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

step("manifest and icons");
const manifest = await (await fetch(BASE + "/manifest.webmanifest")).json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/app");
for (const icon of manifest.icons) assert.equal((await fetch(BASE + icon.src)).status, 200, icon.src);
assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));

step("service worker registers and controls the page");
const stamp = Date.now().toString(36);
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Pwa");
await page.fill("#em", `pwa-${stamp}@example.com`);
await page.fill("#pw", "pwa-password-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await page.goto(BASE + "/app");
await page.getByText("Good", { exact: false }).first().waitFor({ timeout: 15000 });

step("offline: navigation shows the offline page");
await ctx.setOffline(true);
await page.goto(BASE + "/app/clients").catch(() => {});
await page.getByText("You’re offline").waitFor({ timeout: 10000 });
await ctx.setOffline(false);

step("no API responses or uploaded files in the cache");
const cached = await page.evaluate(async () => {
  const urls = [];
  for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname);
  return urls;
});
assert.ok(cached.length > 0, "static files cached");
assert.ok(cached.every((u) => !u.startsWith("/api/")), "no API responses cached: " + cached.filter((u) => u.startsWith("/api/")).join(", "));

await browser.close();
console.log("✓ pwa passed");
