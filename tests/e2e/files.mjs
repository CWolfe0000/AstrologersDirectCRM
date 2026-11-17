/**
 * Storage end-to-end: real upload through the delivery UI, access rules for
 * practitioner / client / other practices, Range requests, deletes.
 *   node tests/e2e/files.mjs   (server running with STORAGE_DRIVER=local)
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { Client } = require("pg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || ".uploads");
const db = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres@localhost:5432/astrologersdirect" });
await db.connect();
const stamp = Date.now().toString(36);
const step = (s) => console.log("•", s);
const dir = mkdtempSync(path.join(tmpdir(), "ad-files-"));
const pdfPath = path.join(dir, "Test_Reading.pdf");
const pdfBody = "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n" + "x".repeat(5000);
writeFileSync(pdfPath, pdfBody);

async function signup(ctx, name) {
  const p = await ctx.newPage();
  await p.goto(BASE + "/auth/signup");
  await p.fill("#fn", name);
  await p.fill("#em", `${name.toLowerCase()}-${stamp}@example.com`);
  await p.fill("#pw", "files-password-123");
  await p.check('input[type="checkbox"][required]');
  await p.click('button[type="submit"]');
  await p.waitForURL(/verify/);
  return p;
}
const call = (p, url, init) => p.evaluate(async ([u, i]) => { const r = await fetch(u, i); return { status: r.status, text: (await r.text()).slice(0, 200), range: r.headers.get("content-range") }; }, [url, init ?? {}]);
const state = (p) => p.evaluate(() => fetch("/api/v1/bootstrap?view=app").then((r) => r.json()));
const put = (p, coll, rec) => call(p, `/api/v1/records/${coll}/${rec.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) });

const browser = await chromium.launch();
const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await signup(ownerCtx, "Files");
await call(page, "/api/v1/sample-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });

step("deliver an uploaded PDF through the UI");
await page.goto(BASE + "/app/delivery?new=1&client=c1");
const d = page.getByRole("dialog");
for (let i = 0; i < 4 && !(await d.getByPlaceholder("e.g. Solar Return 2027 — Relocated to Lisbon").count()); i++) await d.getByRole("button", { name: /Continue/ }).click();
await d.locator('input[type="file"]').setInputFiles(pdfPath);
await d.getByText("Uploaded").waitFor({ timeout: 15000 });
await d.getByPlaceholder("e.g. Solar Return 2027 — Relocated to Lisbon").fill(`Uploaded reading ${stamp}`);
for (let i = 0; i < 4 && !(await d.getByRole("button", { name: /Send to client portal/ }).count()); i++) await d.getByRole("button", { name: /Continue/ }).click();
await d.getByRole("button", { name: /Send to client portal/ }).click();
await page.getByText("All changes saved").waitFor({ timeout: 10000 });
let s = await state(page);
const reading = s.readings.find((r) => r.title === `Uploaded reading ${stamp}`);
assert.ok(reading?.fileKey, "reading has a stored file");
assert.ok(existsSync(path.join(STORAGE_DIR, reading.fileKey)), "file is on disk");
const own = await call(page, `/api/v1/media/readings/${reading.id}`);
assert.equal(own.status, 200);
assert.ok(own.text.startsWith("%PDF"), "practitioner can open it");

step("upload rules");
assert.equal((await call(page, "/api/v1/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: "x.exe", contentType: "application/x-msdownload", size: 10 }) })).status, 415, "unsupported type refused");
assert.equal((await call(page, "/api/v1/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: "x.mp4", contentType: "video/mp4", size: 3 * 1024 ** 3 }) })).status, 413, "over 2 GB refused");
assert.equal((await put(page, "readings", { ...reading, fileKey: "prc_someoneelse/abc/x.pdf" })).status, 422, "can't reference another practice's file");

step("client opens it in their portal; Range requests work");
const amelia = `amelia-files-${stamp}@example.com`;
const c1 = s.clients.find((c) => c.id === "c1");
await put(page, "clients", { ...c1, email: amelia });
assert.equal((await call(page, "/api/v1/portal/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "c1" }) })).status, 200);
const { rows } = await db.query(`select body from outbox where "to"=$1 order by created_at desc limit 1`, [amelia]);
const link = rows[0].body.match(/\/auth\/invite\?token=[\w-]+/)[0];
const clientCtx = await browser.newContext();
const cp = await clientCtx.newPage();
await cp.goto(BASE + link);
await cp.fill("#pw", "amelia-files-pass");
await cp.click('button[type="submit"]');
await cp.waitForURL(/\/portal/);
await cp.goto(BASE + `/portal/readings/${reading.id}`);
// The portal scopes ids by practice ("<practice>~<id>"); unscoped ids still work for a client of one practice.
await cp.locator(`iframe[src^="/api/v1/media/readings/"][src$="${reading.id}"]`).waitFor();
assert.equal((await call(cp, `/api/v1/media/readings/${reading.id}`)).status, 200, "client can view");
assert.equal((await call(cp, `/api/v1/media/readings/${reading.id}?download=1`)).status, 200, "client can download when allowed");
const ranged = await call(cp, `/api/v1/media/readings/${reading.id}`, { headers: { Range: "bytes=0-3" } });
assert.equal(ranged.status, 206);
assert.equal(ranged.text, "%PDF");

step("view-only readings can't be downloaded; expired ones can't be opened");
s = await state(page);
await put(page, "readings", { ...s.readings.find((r) => r.id === reading.id), allowDownload: false });
assert.equal((await call(cp, `/api/v1/media/readings/${reading.id}?download=1`)).status, 403);
assert.equal((await call(cp, `/api/v1/media/readings/${reading.id}`)).status, 200, "still viewable");
s = await state(page);
await put(page, "readings", { ...s.readings.find((r) => r.id === reading.id), expiresAt: "2020-01-01" });
assert.equal((await call(cp, `/api/v1/media/readings/${reading.id}`)).status, 410);

step("private files stay private; shared files are visible");
await page.goto(BASE + "/app/clients/c1?tab=files");
await page.locator('input[type="file"]').setInputFiles(pdfPath);
await page.getByText("File uploaded").waitFor({ timeout: 15000 });
await page.getByText("All changes saved").waitFor({ timeout: 10000 });
s = await state(page);
const file = s.files.find((f) => f.fileKey && f.clientId === "c1");
assert.ok(file, "client file stored");
assert.equal((await call(cp, `/api/v1/media/files/${file.id}`)).status, 404, "private file hidden from client");
await put(page, "files", { ...file, private: false });
assert.equal((await call(cp, `/api/v1/media/files/${file.id}`)).status, 200, "shared file visible");

step("content types are allowlisted");
s = await state(page);
assert.equal((await put(page, "files", { ...s.files.find((f) => f.id === file.id), contentType: "text/html" })).status, 422, "HTML content type refused");

step("re-inviting an active client doesn't reset their password");
assert.equal((await call(page, "/api/v1/portal/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "c1" }) })).status, 409);

step("turning off portal access signs the client out");
s = await state(page);
await put(page, "clients", { ...s.clients.find((c) => c.id === "c1"), portalAccess: "none" });
assert.equal((await call(cp, `/api/v1/media/files/${file.id}`)).status, 401, "client session ended");
assert.equal((await call(cp, "/api/v1/bootstrap?view=portal")).status, 401);

step("another practice can't open any of it");
const otherCtx = await browser.newContext();
const other = await signup(otherCtx, "Intruder");
assert.equal((await call(other, `/api/v1/media/readings/${reading.id}`)).status, 404);
assert.equal((await call(other, `/api/v1/media/files/${file.id}`)).status, 404);

step("deleting a reading deletes the stored file");
assert.equal((await call(page, `/api/v1/records/readings/${reading.id}`, { method: "DELETE" })).status, 200);
assert.ok(!existsSync(path.join(STORAGE_DIR, reading.fileKey)), "object removed");

await browser.close();
await db.end();
console.log("✓ files passed");
