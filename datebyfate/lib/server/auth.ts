import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "./db";
import { env } from "./env";
import { newToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "dbf_session";
const SESSION_DAYS = 30;
const DAY = 86_400_000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  /** Paid access: an active Stripe subscription or complimentary access. */
  premium: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  comp: boolean;
};

/** Statuses that keep access. past_due stays on while Stripe retries the card. */
const ACTIVE = new Set(["active", "trialing", "past_due"]);
export function isPremium(u: { subscriptionStatus: string | null; compPremium: boolean }) {
  return u.compPremium || (!!u.subscriptionStatus && ACTIVE.has(u.subscriptionStatus));
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
let dummyHash: Promise<string> | undefined;
export async function verifyPassword(pw: string, hash: string | null) {
  if (!hash) {
    // Equalize timing for unknown accounts.
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
  await db().insert(schema.sessions).values({ id: hash, userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, raw, { httpOnly: true, sameSite: "lax", secure: env.isProduction, path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await db().delete(schema.sessions).where(eq(schema.sessions.id, sha256(raw)));
  jar.delete(SESSION_COOKIE);
}

/** Current user from the session cookie, or null. Cached per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [row] = await db()
    .select({ u: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(raw)), gt(schema.sessions.expiresAt, new Date())));
  if (!row) return null;
  const u = row.u;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    premium: isPremium(u),
    subscriptionStatus: u.subscriptionStatus,
    currentPeriodEnd: u.currentPeriodEnd,
    cancelAtPeriodEnd: u.cancelAtPeriodEnd,
    hasStripeCustomer: !!u.stripeCustomerId,
    comp: u.compPremium,
  };
});

/** For pages and actions that need a signed-in member. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export async function issueResetToken(userId: string) {
  const { raw, hash } = newToken();
  await db().update(schema.authTokens).set({ usedAt: new Date() }).where(and(eq(schema.authTokens.userId, userId), isNull(schema.authTokens.usedAt)));
  await db().insert(schema.authTokens).values({ id: hash, userId, kind: "reset", expiresAt: new Date(Date.now() + 2 * 3_600_000) });
  return raw;
}

export async function consumeResetToken(raw: string) {
  if (typeof raw !== "string" || raw.length < 20 || raw.length > 100) return null;
  const [t] = await db()
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.authTokens.id, sha256(raw)), isNull(schema.authTokens.usedAt), gt(schema.authTokens.expiresAt, new Date())))
    .returning();
  return t?.userId ?? null;
}

/**
 * Small fixed-window rate limiter (per server instance), keyed by client address.
 * Returns false when the limit is passed.
 */
const buckets = new Map<string, { n: number; reset: number }>();
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const h = await headers();
  const hops = h.get("x-forwarded-for")?.split(",").map((x) => x.trim()).filter(Boolean) ?? [];
  const ip = h.get("x-real-ip")?.trim() || hops[hops.length - 1] || "local";
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  const k = `${key}:${ip}`;
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    buckets.set(k, { n: 1, reset: now + windowMs });
    return true;
  }
  const scale = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);
  return ++b.n <= limit * scale;
}
