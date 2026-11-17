import "server-only";
import { db, schema } from "./db";
import { HttpError, requireUser } from "./http";
import { newId } from "./crypto";

/** Platform admin only: an owner listed in ADMIN_EMAILS, signed in with two-step verification. */
export async function requireAdmin() {
  const user = await requireUser("owner");
  if (!user.admin) throw new HttpError(404, "Not found.");
  if (!user.twoFactor) throw new HttpError(403, "Turn on two-step verification (Settings → Security) to use the admin area.");
  return user;
}

export async function logAdmin(adminEmail: string, action: string, practiceId: string, detail?: string) {
  await db().insert(schema.adminEvents).values({ id: newId("adm"), adminEmail, action, practiceId, detail });
  console.info(`[admin] ${adminEmail} ${action} ${practiceId}${detail ? ` (${detail})` : ""}`);
}
