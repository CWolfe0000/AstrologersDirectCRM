/**
 * Generates the product screenshots used on the marketing site from the
 * running application, so the public pages show the real product.
 *
 *   npm run build && npm start   # in one terminal (port 3000)
 *   EMAIL=… PASSWORD=… CLIENT=<client id> WORK=<work id> npm run screenshots
 *
 * EMAIL/PASSWORD sign in to a practitioner account with sample data.
 * PORTAL_STATE (optional) is a Playwright storage-state file for a signed-in
 * client, used for the two portal shots. Set BASE_URL to point elsewhere.
 */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../public/screenshots/", import.meta.url).pathname;
const { EMAIL, PASSWORD, CLIENT, WORK, CHART, PORTAL_STATE } = process.env;
if (!EMAIL || !PASSWORD || !CLIENT) throw new Error("Set EMAIL, PASSWORD and CLIENT.");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => localStorage.setItem("ad-2fa-nudge-dismissed", "1"));
const page = await ctx.newPage();
await page.goto(BASE + "/auth/login");
await page.fill("#em", EMAIL);
await page.fill("#pw", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/app/);

const shot = async (p, file, path) => {
  await p.goto(BASE + path, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + file });
  console.log("✓", file);
};
await shot(page, "dashboard.png", "/app");
await shot(page, "client-profile.png", `/app/clients/${CLIENT}`);
if (CHART) await shot(page, "chart-workspace.png", `/app/charts/${CHART}`);
if (WORK) await shot(page, "between-sessions.png", `/app/clients/${CLIENT}?tab=work&work=${WORK}`);

if (PORTAL_STATE) {
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, storageState: PORTAL_STATE });
  await shot(await desk.newPage(), "portal.png", "/portal");
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, storageState: PORTAL_STATE });
  await shot(await mobile.newPage(), "portal-mobile.png", "/portal/readings");
}
await browser.close();
