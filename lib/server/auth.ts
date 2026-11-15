import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db, schema } from "./db";
import { env } from "./env";
import { newToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "ad_session";
const SESSION_DAYS = 30;
const DAY = 86_400_000;

export type SessionUser = {
  id: string;
  practiceId: string;
  email: string;
  name: string;
  role: "owner" | "client";
  clientId: string | null;
  emailVerified: boolean;
  twoFactor: boolean;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
let dummyHash: Promise<string> | undefined;
export async function verifyPassword(pw: string, hash: string | null) {
  if (!hash) {
    // Equalise timing for unknown accounts / accounts without a password.
    dummyHash ??= bcrypt.hash("timing-equaliser", 12);
    await bcrypt.compare(pw, await dummyHash);
    return false;
  }
  return bcrypt.compare(pw, hash);
}

export function passwordProblem(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "Use at most 200 characters.";
  return null;
}

export async function createSession(userId: string) {
  const { raw, hash } = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await db().insert(schema.sessions).values({ id: hash, userId, expiresAt, userAgent: ua });
  (await cookies()).set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await db().delete(schema.sessions).where(eq(schema.sessions.id, sha256(raw)));
  jar.delete(SESSION_COOKIE);
}

/** Current user from the session cookie, or null. Slides expiry when past halfway. */
export async function getUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const id = sha256(raw);
  const [row] = await db()
    .select({ s: schema.sessions, u: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())));
  if (!row) return null;
  if (row.s.expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * DAY) {
    await db().update(schema.sessions).set({ expiresAt: new Date(Date.now() + SESSION_DAYS * DAY) }).where(eq(schema.sessions.id, id));
  }
  const u = row.u;
  return { id: u.id, practiceId: u.practiceId, email: u.email, name: u.name, role: u.role, clientId: u.clientId, emailVerified: !!u.emailVerifiedAt, twoFactor: !!u.totpEnabledAt };
}

/** Single-use emailed token (verify / reset / invite). Returns the raw token for the link. */
export async function issueToken(userId: string, kind: "verify" | "reset" | "invite" | "mfa", hours: number) {
  const { raw, hash } = newToken();
  // Older unused tokens of the same kind are invalidated.
  await db()
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.kind, kind), isNull(schema.authTokens.usedAt)));
  await db().insert(schema.authTokens).values({ id: hash, userId, kind, expiresAt: new Date(Date.now() + hours * 3_600_000) });
  return raw;
}

/** Consume a token: returns the user id if valid, unused and unexpired. */
export async function consumeToken(raw: string, kind: "verify" | "reset" | "invite" | "mfa") {
  if (typeof raw !== "string" || raw.length < 20 || raw.length > 100) return null;
  const [t] = await db()
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.id, sha256(raw)), eq(schema.authTokens.kind, kind), isNull(schema.authTokens.usedAt), gt(schema.authTokens.expiresAt, new Date())))
    .returning();
  return t?.userId ?? null;
}

/** Peek without consuming (to show the invite page). */
export async function peekToken(raw: string, kind: "verify" | "reset" | "invite" | "mfa") {
  if (typeof raw !== "string" || raw.length < 20 || raw.length > 100) return null;
  const [t] = await db()
    .select()
    .from(schema.authTokens)
    .where(and(eq(schema.authTokens.id, sha256(raw)), eq(schema.authTokens.kind, kind), isNull(schema.authTokens.usedAt), gt(schema.authTokens.expiresAt, new Date())));
  return t?.userId ?? null;
}

export async function purgeExpired() {
  await db().delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
}
