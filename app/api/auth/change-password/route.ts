import { and, eq, ne } from "drizzle-orm";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { sha256 } from "@/lib/server/crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server/auth";

/** Change password; signs out the user's other sessions. */
export const POST = handler(async (req) => {
  rateLimit(req, "change-password", 10, 15 * 60_000);
  const u = await requireUser();
  const { current, next } = (await readJson(req)) as { current?: string; next?: string };
  const problem = passwordProblem(String(next ?? ""));
  if (problem) throw new HttpError(422, problem);
  const [row] = await db().select().from(schema.users).where(eq(schema.users.id, u.id));
  if (!(await verifyPassword(String(current ?? ""), row?.passwordHash ?? null))) throw new HttpError(400, "Your current password isn’t right.");
  await db().update(schema.users).set({ passwordHash: await hashPassword(String(next)) }).where(eq(schema.users.id, u.id));
  const raw = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await db().delete(schema.sessions).where(and(eq(schema.sessions.userId, u.id), ne(schema.sessions.id, sha256(raw))));
  return json({ ok: true });
});
