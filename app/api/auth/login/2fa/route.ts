import { eq, sql } from "drizzle-orm";
import { sha256 } from "@/lib/server/crypto";
import { assertNotLocked, clearFailures, recordFailure } from "@/lib/server/guard";

const MAX_TICKET_ATTEMPTS = 5;
import { consumeToken, createSession, peekToken } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { checkSecondFactor } from "@/lib/server/twofactor";

/** Second sign-in step: the ticket from /api/auth/login plus a code. */
export const POST = handler(async (req) => {
  rateLimit(req, "login-2fa", 30, 15 * 60_000); // flood control; per-ticket and per-account limits are in the database
  const { ticket, code } = (await readJson(req)) as { ticket?: string; code?: string };
  const timedOut = "Your sign-in timed out. Enter your email and password again.";
  const userId = await peekToken(String(ticket ?? ""), "mfa");
  if (!userId) throw new HttpError(400, timedOut);
  const ticketId = sha256(String(ticket));
  const [t] = await db().select({ attempts: schema.authTokens.attempts }).from(schema.authTokens).where(eq(schema.authTokens.id, ticketId));
  if (!t || t.attempts >= MAX_TICKET_ATTEMPTS) throw new HttpError(400, timedOut);
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) throw new HttpError(400, timedOut);
  assertNotLocked(user);
  if (!(await checkSecondFactor(user, String(code ?? "")))) {
    // Each ticket allows a few tries; every miss also counts towards the account lockout.
    await db().update(schema.authTokens).set({ attempts: sql`${schema.authTokens.attempts} + 1` }).where(eq(schema.authTokens.id, ticketId));
    await recordFailure(user.id);
    throw new HttpError(401, "That code didn’t match. Try the newest code from your app, or a recovery code.");
  }
  if (!(await consumeToken(String(ticket), "mfa"))) throw new HttpError(400, timedOut);
  await clearFailures(user.id);
  await createSession(user.id);
  return json({ ok: true, redirect: user.role === "client" ? "/portal" : "/app" });
});
