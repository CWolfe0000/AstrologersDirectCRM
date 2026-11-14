/**
 * Generates the product screenshots used on the marketing site from the
 * running prototype, so the public pages show the real application.
 *
 *   npm run build && npm start   # in one terminal (port 3000)
 *   npm run screenshots          # in another
 *
 * Set BASE_URL to point elsewhere. Requires Playwright with Chromium.
 */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../public/screenshots/", import.meta.url).pathname;

const desktop = [
  ["dashboard.png", "/app"],
  ["client-profile.png", "/app/clients/c1"],
  ["chart-workspace.png", "/app/charts/ch1"],
  ["observations.png", "/app/observations?id=o6"],
  ["calendar.png", "/app/consultations"],
  ["delivery.png", "/app/delivery"],
  ["studio.png", "/app/studio?client=c1&chart=ch2"],
  ["tasks.png", "/app/tasks"],
  ["reports.png", "/app/reports"],
  ["charts.png", "/app/charts"],
  ["portal.png", "/portal"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
for (const [file, path] of desktop) {
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + file });
  console.log("✓", file);
}
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const mp = await mobile.newPage();
await mp.goto(BASE + "/portal/readings", { waitUntil: "load" });
await mp.waitForTimeout(900);
await mp.screenshot({ path: OUT + "portal-mobile.png" });
console.log("✓ portal-mobile.png");
await browser.close();
