import "server-only";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import { env } from "./env";
import { HttpError } from "./http";
import { link, sendMail } from "./mail";
import { newId, newToken, sha256 } from "./crypto";
import { findUserByEmail, normEmail } from "./accounts";

/**
 * Private beta: practitioners request access; the admin approves; approved
 * applicants get a single-use link to create their account. Sign-up needs
 * that link while BETA_INVITE_ONLY is "true" or the admin switch is on.
 */
export async function inviteOnly() {
  if (process.env.BETA_INVITE_ONLY === "true") return true;
  const [row] = await db().select().from(schema.platformSettings).where(eq(schema.platformSettings.key, "betaInviteOnly"));
  return row?.value === true;
}

export async function setInviteOnly(on: boolean) {
  await db().insert(schema.platformSettings).values({ key: "betaInviteOnly", value: on }).onConflictDoUpdate({ target: schema.platformSettings.key, set: { value: on, updatedAt: new Date() } });
}

const text = (n: number) => z.string().trim().max(n);
export const accessRequestSchema = z
  .object({
    name: text(120).min(1, "Add your name."),
    email: z.string().trim().toLowerCase().email("Check your email address.").max(254),
    practice: text(160),
    website: text(300),
    experience: z.enum(["", "Under 2 years", "2–5 years", "5–10 years", "10+ years"]),
    about: text(2000),
    company: z.string().max(200).optional(), // hidden field: bots fill it
    /** Opted in to news, tips and offers (optional). */
    emailConsent: z.boolean().optional(),
  })
  .strict();

export async function requestAccess(input: z.infer<typeof accessRequestSchema>) {
  if (input.company) return; // quietly ignore bots
  const email = normEmail(input.email);
  const first = input.name.split(/\s+/)[0];
  if (await findUserByEmail(email)) {
    // Don't reveal accounts on the page; tell the owner of the address by email instead.
    await sendMail(email, "You Already Have an Astrologers Direct Account", `Hi ${first},\n\nThere’s already an account for this email address. Sign in here:\n${link("/auth/login")}\n`);
    return;
  }
  const [existing] = await db().select().from(schema.accessRequests).where(eq(schema.accessRequests.email, email));
  if (existing) return; // already received; no duplicates or repeat emails
  await db().insert(schema.accessRequests).values({ id: newId("req"), email, name: input.name, practice: input.practice, website: input.website, experience: input.experience, about: input.about, emailConsentAt: input.emailConsent ? new Date() : null });
  await sendMail(email, "We’ve Received Your Request for Astrologers Direct ✨", `Hi ${first},\n\nThank you for your interest in the AstrologersDirect beta. We review every request personally and will email you as soon as there’s a place for you.\n\n— The AstrologersDirect team\n`);
  if (env.contactEmail)
    await sendMail(
      env.contactEmail,
      `Beta Request: ${input.name}`,
      `${input.name} <${email}> asked to join the beta.\n\nPractice: ${input.practice || "—"}\nWebsite: ${input.website || "—"}\nExperience: ${input.experience || "—"}\n\n${input.about || ""}\n\nReview requests in Admin:\n${link("/app/admin")}\n`,
      { replyTo: email },
    );
}

export async function listRequests() {
  const rows = await db().select().from(schema.accessRequests).orderBy(desc(schema.accessRequests.createdAt)).limit(500);
  return rows.map(({ inviteHash, ...r }) => ({ ...r, invited: !!inviteHash }));
}

/** Approve (email a single-use sign-up link) or decline a request. Approving again sends a fresh link. */
export async function decide(id: string, action: "approve" | "decline", adminEmail: string) {
  const [r] = await db().select().from(schema.accessRequests).where(eq(schema.accessRequests.id, id));
  if (!r) throw new HttpError(404, "Request not found.");
  if (action === "decline") {
    await db().update(schema.accessRequests).set({ status: "declined", inviteHash: null, decidedAt: new Date(), decidedBy: adminEmail }).where(eq(schema.accessRequests.id, id));
    return;
  }
  if (await findUserByEmail(r.email)) throw new HttpError(409, "This person already has an account.");
  const { raw, hash } = newToken();
  await db().update(schema.accessRequests).set({ status: "approved", inviteHash: hash, decidedAt: new Date(), decidedBy: adminEmail }).where(eq(schema.accessRequests.id, id));
  await sendMail(
    r.email,
    "You’re In: Welcome to the Astrologers Direct Beta ✨",
    `Hi ${r.name.split(/\s+/)[0]},\n\nGood news: your place in the AstrologersDirect beta is ready.\n\nCreate your account here (this link is just for you):\n${link(`/auth/signup?invite=${raw}`)}\n\nThe beta is free. We’d love to hear what works for you and what doesn’t: just reply to any of our emails.\n\n— The AstrologersDirect team\n`,
    env.contactEmail ? { replyTo: env.contactEmail } : {},
  );
}

/** The approved request behind an invite link, if it's still valid. */
export async function inviteFor(token: string | null | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const [r] = await db().select().from(schema.accessRequests).where(eq(schema.accessRequests.inviteHash, sha256(token)));
  return r && r.status === "approved" ? r : null;
}

/** After the account is created, the link can't be used again. */
export async function markJoined(id: string) {
  await db().update(schema.accessRequests).set({ status: "joined", inviteHash: null }).where(eq(schema.accessRequests.id, id));
}
