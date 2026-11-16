import { eq } from "drizzle-orm";
import { destroySession, verifyPassword } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { removePracticeObjects } from "@/lib/server/storage";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";

/**
 * Permanently deletes the practice: every record, every client portal login,
 * the practitioner account and all sessions (cascading foreign keys).
 * Requires { confirm: "DELETE" }.
 */
export const DELETE = handler(async (req) => {
  const user = await requireUser("owner");
  const body = (await readJson(req)) as { confirm?: string; password?: string };
  if (body.confirm !== "DELETE") throw new HttpError(400, "Type DELETE to confirm.");
  const [row] = await db().select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!(await verifyPassword(String(body.password ?? ""), row?.passwordHash ?? null))) throw new HttpError(400, "Your password isn’t right.");
  await destroySession();
  await db().delete(schema.practices).where(eq(schema.practices.id, user.practiceId));
  // The account is gone either way; stored files that fail to delete are logged for a retry, not shown as an error.
  await removePracticeObjects(user.practiceId).catch((e) => console.error(`[account] stored files for ${user.practiceId} not removed:`, e));
  return json({ ok: true });
});
