import "server-only";
import { randomInt } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { sha256 } from "./crypto";
import { createSession, issueToken } from "./auth";
import { findUserByEmail } from "./accounts";
import { link, sendMail } from "./mail";
import { clearFailures, recordFailure } from "./guard";

const LINK_MINUTES = 15;
const MAX_CODE_ATTEMPTS = 5;

type UserRow = typeof schema.users.$inferSelect;

const codeHash = (userId: string, code: string) => sha256(`${userId}:${code.replace(/\s+/g, "")}`);

/**
 * Email a one-time sign-in link and 6-digit code. Silent when the address has
 * no account or is locked, so the response never reveals which emails exist.
 */
export async function sendSignInEmail(email: string) {
  const user = await findUserByEmail(email);
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) return;
  const token = await issueToken(user.id, "login", LINK_MINUTES / 60);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db().update(schema.authTokens).set({ codeHash: codeHash(user.id, code) }).where(eq(schema.authTokens.id, sha256(token)));
  const first = user.name.split(/\s+/)[0] || "there";
  await sendMail(
    user.email,
    `Your AstrologersDirect sign-in link`,
    `Hi ${first},\n\nUse this link to sign in${user.role === "client" ? " to your client portal" : ""}:\n${link(`/auth/link?token=${token}`)}\n\nOr enter this code on the sign-in page: ${code.slice(0, 3)} ${code.slice(3)}\n\nThe link and code work once and expire in ${LINK_MINUTES} minutes. If you didn’t ask to sign in, you can ignore this email.`,
  );
}

/** After the email step (or an accepted invitation): two-factor if it's on, otherwise a session. */
export async function finish(user: UserRow) {
  // Using an emailed link or code proves the address.
  if (!user.emailVerifiedAt) await db().update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, user.id));
  if (user.totpEnabledAt) {
    const ticket = await issueToken(user.id, "mfa", 1 / 6);
    return { ok: true, twoFactor: true, ticket };
  }
  await clearFailures(user.id);
  await createSession(user.id);
  return { ok: true, redirect: user.role === "client" ? "/portal" : "/app" };
}

/** Sign in with the token from the emailed link. */
export async function signInWithLink(token: string) {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const [t] = await db()
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.id, sha256(token)), eq(schema.authTokens.kind, "login"), isNull(schema.authTokens.usedAt), gt(schema.authTokens.expiresAt, new Date())))
    .returning();
  if (!t) return null;
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, t.userId));
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) return null;
  return finish(user);
}

/** Sign in with the emailed 6-digit code. Each code allows a few tries; misses count toward the account lockout. */
export async function signInWithCode(email: string, code: string) {
  const user = await findUserByEmail(email);
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) return null;
  const [t] = await db()
    .select()
    .from(schema.authTokens)
    .where(and(eq(schema.authTokens.userId, user.id), eq(schema.authTokens.kind, "login"), isNull(schema.authTokens.usedAt), gt(schema.authTokens.expiresAt, new Date())))
    .orderBy(desc(schema.authTokens.createdAt))
    .limit(1);
  if (!t || !t.codeHash || t.attempts >= MAX_CODE_ATTEMPTS) return null;
  if (!/^\d{3}\s?\d{3}$/.test(code.trim()) || t.codeHash !== codeHash(user.id, code)) {
    await db().update(schema.authTokens).set({ attempts: sql`${schema.authTokens.attempts} + 1` }).where(eq(schema.authTokens.id, t.id));
    await recordFailure(user.id);
    return null;
  }
  const [used] = await db().update(schema.authTokens).set({ usedAt: new Date() }).where(and(eq(schema.authTokens.id, t.id), isNull(schema.authTokens.usedAt))).returning();
  if (!used) return null;
  return finish(user);
}
