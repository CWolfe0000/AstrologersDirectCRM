import { eq } from "drizzle-orm";
import { destroySession } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";

/**
 * Permanently deletes the practice: every record, every client portal login,
 * the practitioner account and all sessions (cascading foreign keys).
 * Requires { confirm: "DELETE" }.
 */
export const DELETE = handler(async (req) => {
  const user = await requireUser("owner");
  const body = (await readJson(req)) as { confirm?: string };
  if (body.confirm !== "DELETE") throw new HttpError(400, "Type DELETE to confirm.");
  await destroySession();
  await db().delete(schema.practices).where(eq(schema.practices.id, user.practiceId));
  return json({ ok: true });
});
