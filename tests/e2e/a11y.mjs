/**
 * Accessibility sweep with axe-core over every screen (server mode, sample data).
 *   node tests/e2e/a11y.mjs [--all]   — fails on serious/critical issues; --all also lists moderate/minor.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const showAll = process.argv.includes("--all");
const PUBLIC = ["/", "/features", "/how-it-works", "/pricing", "/about", "/contact", "/prototype", "/legal/privacy", "/auth/login", "/auth/signup", "/auth/reset"];
const APP = [
  "/app", "/app/clients", "/app/clients/c1", "/app/clients/c1?tab=charts", "/app/clients/c1?tab=people", "/app/clients/c1?tab=consultations",
  "/app/clients/c1?tab=observations", "/app/clients/c1?tab=work", "/app/clients/c1?tab=readings", "/app/clients/c1?tab=files", "/app/clients/new", "/app/charts", "/app/charts/new", "/app/charts/new?type=horary&client=c1", "/app/charts/new?type=astrocartography&client=c1", "/app/timeline?client=c1",
  "/app/charts/ch1", "/app/charts/ch3", "/app/observations?id=o6", "/app/consultations", "/app/consultations?id=k1", "/app/tasks", "/app/tasks?id=t1",
  "/app/delivery", "/app/delivery?id=r11", "/app/studio", "/app/reports", "/app/notifications", "/app/settings", "/app/settings?section=astrology",
  "/app/settings?section=security", "/app/settings?section=notifications", "/app/settings?section=data",
  "/portal?as=c1", "/portal/readings", "/portal/readings/r3", "/portal/readings/r1", "/portal/consultations", "/portal/work", "/portal/work/w1", "/portal/settings",
];

const browser = await chromium.launch();
const mobile = process.argv.includes("--mobile");
const page = await (await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } })).newPage();
const stamp = Date.now().toString(36);
await page.goto(BASE + "/auth/signup");
await page.fill("#fn", "Axe");
await page.fill("#em", `axe-${stamp}@example.com`);
await page.fill("#pw", "axe-password-123");
await page.check('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForURL(/verify/);
await page.evaluate(() => fetch("/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));

const summary = new Map();
let serious = 0;
for (const route of [...PUBLIC, ...APP]) {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForTimeout(800);
  // The timeline calculates after load: scan the finished page, not the loading state.
  if (route.startsWith("/app/timeline")) await page.getByRole("heading", { name: "Busiest Periods" }).waitFor({ timeout: 30000 });
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
  for (const v of result.violations) {
    if (!showAll && !["serious", "critical"].includes(v.impact)) continue;
    const key = `${v.impact} · ${v.id}`;
    const entry = summary.get(key) ?? { help: v.help, routes: new Set(), samples: new Set() };
    entry.routes.add(route);
    for (const n of v.nodes.slice(0, 3)) entry.samples.add(n.target.join(" ") + "  ←  " + (n.failureSummary ?? "").split("\n")[1]?.trim());
    summary.set(key, entry);
    if (["serious", "critical"].includes(v.impact)) serious += v.nodes.length;
  }
}
await browser.close();
for (const [key, e] of [...summary].sort()) {
  console.log(`\n${key}: ${e.help}\n  routes: ${[...e.routes].slice(0, 8).join(", ")}${e.routes.size > 8 ? ` (+${e.routes.size - 8})` : ""}`);
  for (const s of [...e.samples].slice(0, 4)) console.log("   - " + s);
}
console.log(`\n${serious} serious/critical issue instances`);
process.exit(serious ? 1 : 0);
