import { desc } from "drizzle-orm";
import { handler, json } from "@/lib/server/http";
import { db, schema } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";

/** Admin: every feature suggestion, newest first. */
export const GET = handler(async () => {
  await requireAdmin();
  const rows = await db().select().from(schema.featureRequests).orderBy(desc(schema.featureRequests.createdAt)).limit(500);
  return json({ suggestions: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, area: r.area, text: r.text, createdAt: r.createdAt.toISOString() })) });
});
