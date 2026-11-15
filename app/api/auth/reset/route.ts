import { eq } from "drizzle-orm";
import { consumeToken, createSession, hashPassword, passwordProblem } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

export const POST = handler(async (req) => {
  rateLimit(req, "reset-complete", 10, 15 * 60_000);
  const { token, password } = (await readJson(req)) as { token?: string; password?: string };
  const problem = passwordProblem(String(password ?? ""));
  if (problem) throw new HttpError(422, problem);
  const userId = await consumeToken(String(token ?? ""), "reset");
  if (!userId) throw new HttpError(400, "This reset link has expired or was already used. Request a new one.");
  await db().update(schema.users).set({ passwordHash: await hashPassword(String(password)), emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
  // Sign out every other session, then start a fresh one.
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await createSession(userId);
  const [u] = await db().select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId));
  return json({ ok: true, redirect: u?.role === "client" ? "/portal" : "/app" });
});
