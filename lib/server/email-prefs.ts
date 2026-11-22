import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { env } from "./env";
import { link } from "./mail";

/**
 * Emails from AstrologersDirect itself (beta news, new features, offers).
 * Everyone agrees to them at sign-up; anyone can unsubscribe, from Settings or
 * with the one-click link at the foot of every such email. Account and
 * security emails (sign-in links, verification, receipts) still go out.
 */
const sign = (userId: string) => createHmac("sha256", env.encryptionKey).update(`unsubscribe:${userId}`).digest("base64url").slice(0, 32);

/** The link to put at the foot of every news or offers email. */
export function unsubscribeLink(userId: string) {
  return link(`/api/public/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`);
}

export function validUnsubscribe(userId: string, token: string) {
  const a = Buffer.from(sign(userId)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setNewsEmails(userId: string, on: boolean) {
  await db().update(schema.users).set({ emailUnsubscribedAt: on ? null : new Date() }).where(eq(schema.users.id, userId));
}

export async function newsEmailsOn(userId: string) {
  const [u] = await db().select({ consent: schema.users.emailConsentAt, off: schema.users.emailUnsubscribedAt }).from(schema.users).where(eq(schema.users.id, userId));
  return { on: !u?.off, consentAt: u?.consent?.toISOString() ?? null };
}
