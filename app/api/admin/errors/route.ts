import { desc } from "drizzle-orm";
import { handler, json } from "@/lib/server/http";
import { db, schema } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";

/** Admin: recent errors from the server and from browsers, most recent first. */
export const GET = handler(async () => {
  await requireAdmin();
  const rows = await db().select().from(schema.appErrors).orderBy(desc(schema.appErrors.lastAt)).limit(100);
  return json({ errors: rows.map((r) => ({ id: r.fingerprint, source: r.source, message: r.message, stack: r.stack, url: r.url, count: r.count, firstAt: r.firstAt.toISOString(), lastAt: r.lastAt.toISOString() })) });
});
