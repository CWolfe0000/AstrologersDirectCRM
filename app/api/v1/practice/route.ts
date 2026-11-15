import { removePracticeObjects } from "@/lib/server/storage";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { deleteAllRecords } from "@/lib/server/records";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";

/**
 * Deletes every client record in the practice (clients, charts, observations…)
 * and all client portal logins. The practitioner account remains.
 * Requires { confirm: "DELETE" }.
 */
export const DELETE = handler(async (req) => {
  const user = await requireUser("owner");
  const body = (await readJson(req)) as { confirm?: string };
  if (body.confirm !== "DELETE") throw new HttpError(400, "Type DELETE to confirm.");
  await deleteAllRecords(user.practiceId);
  await removePracticeObjects(user.practiceId);
  await db().delete(schema.users).where(and(eq(schema.users.practiceId, user.practiceId), eq(schema.users.role, "client")));
  return json({ ok: true });
});
