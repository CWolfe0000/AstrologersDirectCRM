import { eq } from "drizzle-orm";
import { consumeToken, createSession, peekToken } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { checkSecondFactor } from "@/lib/server/twofactor";

/** Second sign-in step: the ticket from /api/auth/login plus a code. */
export const POST = handler(async (req) => {
  rateLimit(req, "login-2fa", 10, 15 * 60_000);
  const { ticket, code } = (await readJson(req)) as { ticket?: string; code?: string };
  const userId = await peekToken(String(ticket ?? ""), "mfa");
  if (!userId) throw new HttpError(400, "Your sign-in timed out. Enter your email and password again.");
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user || !(await checkSecondFactor(user, String(code ?? "")))) throw new HttpError(401, "That code didn’t match. Try the newest code from your app, or a recovery code.");
  if (!(await consumeToken(String(ticket), "mfa"))) throw new HttpError(400, "Your sign-in timed out. Enter your email and password again.");
  await createSession(user.id);
  return json({ ok: true, redirect: user.role === "client" ? "/portal" : "/app" });
});
