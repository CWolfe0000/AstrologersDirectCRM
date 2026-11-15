import { and, desc, eq, gt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server/auth";
import { sha256 } from "@/lib/server/crypto";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";

async function currentId() {
  return sha256((await cookies()).get(SESSION_COOKIE)?.value ?? "");
}

/** The signed-in user's active sessions. Ids are shortened; full hashes never leave the server. */
export const GET = handler(async () => {
  const u = await requireUser();
  const me = await currentId();
  const rows = await db()
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, u.id), gt(schema.sessions.expiresAt, new Date())))
    .orderBy(desc(schema.sessions.createdAt));
  return json({
    sessions: rows.map((s) => ({ id: s.id.slice(0, 16), userAgent: s.userAgent, createdAt: s.createdAt, current: s.id === me })),
  });
});

/** Sign out one session ({ id }) or every other session ({ others: true }). */
export const DELETE = handler(async (req) => {
  const u = await requireUser();
  const me = await currentId();
  const body = (await readJson(req)) as { id?: string; others?: boolean };
  if (body.others) {
    await db().delete(schema.sessions).where(and(eq(schema.sessions.userId, u.id), ne(schema.sessions.id, me)));
    return json({ ok: true });
  }
  if (typeof body.id !== "string" || body.id.length !== 16) throw new HttpError(400, "Choose a session.");
  if (me.startsWith(body.id)) throw new HttpError(400, "Use Sign out to end this session.");
  const rows = await db().select({ id: schema.sessions.id }).from(schema.sessions).where(eq(schema.sessions.userId, u.id));
  const target = rows.find((r) => r.id.startsWith(body.id!));
  if (target) await db().delete(schema.sessions).where(eq(schema.sessions.id, target.id));
  return json({ ok: true });
});
