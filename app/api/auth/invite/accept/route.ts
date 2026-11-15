import { eq } from "drizzle-orm";
import { consumeToken, createSession, hashPassword, passwordProblem } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";

export const POST = handler(async (req) => {
  const { token, password } = (await readJson(req)) as { token?: string; password?: string };
  const problem = passwordProblem(String(password ?? ""));
  if (problem) throw new HttpError(422, problem);
  const userId = await consumeToken(String(token ?? ""), "invite");
  if (!userId) throw new HttpError(400, "This invitation has expired or was already used. Ask your astrologer to send a new one.");
  const [existing] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  // An invitation sets up a new login; it never replaces an existing password (use password reset for that).
  if (!existing || existing.passwordHash) throw new HttpError(400, "This portal is already set up. Sign in, or use “Forgot password”.");
  await db().update(schema.users).set({ passwordHash: await hashPassword(String(password)), emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  const [u] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (u?.clientId) {
    const c = await getRecord(u.practiceId, "clients", u.clientId);
    if (c) await upsertRecord(u.practiceId, "clients", { ...c, portalAccess: "active" });
  }
  await createSession(userId);
  return json({ ok: true, redirect: "/portal" });
});
