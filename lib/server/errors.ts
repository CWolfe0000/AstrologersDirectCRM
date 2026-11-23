import "server-only";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { env } from "./env";
import { sendMail } from "./mail";

/**
 * Built-in error monitoring. Each distinct error (by message and where it
 * happened) is one row with a count; the team gets one email the first time
 * an error appears, and again if it comes back after a day. Never records
 * request bodies, form contents or client data — only the error itself.
 */
const scrub = (s: string) => s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]").replace(/\b(token|t|u|key)=[^&\s]+/gi, "$1=[hidden]").slice(0, 4000);

export async function recordError(source: "server" | "browser", e: { message: string; stack?: string | null; url?: string | null }) {
  try {
    const message = scrub(e.message || "Unknown error").slice(0, 500);
    const stack = e.stack ? scrub(e.stack) : null;
    const url = e.url ? scrub(e.url).slice(0, 500) : null;
    const where = (stack?.split("\n").find((l) => /\bat\b|@/.test(l)) ?? url ?? "").replace(/:\d+:\d+\)?$/, "").trim();
    const fingerprint = createHash("sha256").update(`${source}|${message.replace(/\d+/g, "#")}|${where}`).digest("hex").slice(0, 32);
    const [row] = await db()
      .insert(schema.appErrors)
      .values({ fingerprint, source, message, stack, url })
      .onConflictDoUpdate({ target: schema.appErrors.fingerprint, set: { count: sql`${schema.appErrors.count} + 1`, lastAt: new Date(), stack, url } })
      .returning();
    const quiet = row?.alertedAt && Date.now() - row.alertedAt.getTime() < 24 * 3_600_000;
    if (row && !quiet && env.contactEmail) {
      await db().update(schema.appErrors).set({ alertedAt: new Date() }).where(eq(schema.appErrors.fingerprint, fingerprint));
      await sendMail(env.contactEmail, `Error on AstrologersDirect (${source}): ${message.slice(0, 80)}`, `Source: ${source}\nSeen: ${row.count} time${row.count === 1 ? "" : "s"}\n${url ? `Page: ${url}\n` : ""}\n${message}\n\n${stack ?? ""}\n`).catch(() => {});
    }
  } catch (err) {
    console.error("[errors] couldn’t record an error", err);
  }
}
