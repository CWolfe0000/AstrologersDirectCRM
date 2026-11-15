import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { newToken } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { handler, json, requireUser } from "@/lib/server/http";

/** Is a calendar link active? (The link itself is only shown once, when created.) */
export const GET = handler(async () => {
  const u = await requireUser("owner");
  const [row] = await db().select({ createdAt: schema.calendarFeeds.createdAt }).from(schema.calendarFeeds).where(eq(schema.calendarFeeds.practiceId, u.practiceId));
  return json({ active: !!row, createdAt: row?.createdAt ?? null });
});

/** Create (or replace) the private calendar link. Replacing it stops the old link working. */
export const POST = handler(async () => {
  const u = await requireUser("owner");
  const { raw, hash } = newToken();
  await db()
    .insert(schema.calendarFeeds)
    .values({ practiceId: u.practiceId, tokenHash: hash })
    .onConflictDoUpdate({ target: schema.calendarFeeds.practiceId, set: { tokenHash: hash, createdAt: new Date() } });
  const base = env.appUrl.replace(/\/$/, "");
  return json({ url: `${base}/api/calendar/${raw}.ics`, webcal: `${base.replace(/^https?:/, "webcal:")}/api/calendar/${raw}.ics` });
});

export const DELETE = handler(async () => {
  const u = await requireUser("owner");
  await db().delete(schema.calendarFeeds).where(eq(schema.calendarFeeds.practiceId, u.practiceId));
  return json({ ok: true });
});
