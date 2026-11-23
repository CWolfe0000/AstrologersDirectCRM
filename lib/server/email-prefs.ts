import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { env } from "./env";
import { link } from "./mail";
import { BUSINESS_ADDRESS_LINE } from "@/lib/site";

/**
 * News, tips and offers from AstrologersDirect: opt-in (an unticked box at
 * sign-up, or Settings), with a one-click unsubscribe link at the foot of
 * every such email. Account and service emails (sign-in links, verification,
 * security and important service notices) go to everyone.
 */
const sign = (userId: string) => createHmac("sha256", env.encryptionKey).update(`unsubscribe:${userId}`).digest("base64url").slice(0, 32);

/** The link to put at the foot of every news or offers email. */
export function unsubscribeLink(userId: string) {
  return link(`/api/public/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`);
}

/** The footer every news, tips or offers email must carry: who sent it, our postal address, and a one-click unsubscribe. */
export function newsEmailFooter(userId: string) {
  return `\n\n—\nYou’re getting this because you asked for news, tips and offers from AstrologersDirect.\nUnsubscribe: ${unsubscribeLink(userId)}\nAstrologersDirect · ${BUSINESS_ADDRESS_LINE}\n`;
}

/** Headers so mail apps show their own one-click unsubscribe button (RFC 8058). */
export function newsEmailHeaders(userId: string) {
  return { "List-Unsubscribe": `<${unsubscribeLink(userId)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}

export function validUnsubscribe(userId: string, token: string) {
  const a = Buffer.from(sign(userId)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setNewsEmails(userId: string, on: boolean) {
  await db().update(schema.users).set(on ? { emailConsentAt: new Date(), emailUnsubscribedAt: null } : { emailUnsubscribedAt: new Date() }).where(eq(schema.users.id, userId));
}

export async function newsEmailsOn(userId: string) {
  const [u] = await db().select({ consent: schema.users.emailConsentAt, off: schema.users.emailUnsubscribedAt }).from(schema.users).where(eq(schema.users.id, userId));
  return { on: !!u?.consent && !u.off, consentAt: u?.consent?.toISOString() ?? null };
}
