import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { newId } from "./crypto";
import { hashPassword, issueToken } from "./auth";
import { link, sendMail } from "./mail";
import { putSettings } from "./records";
import { DEFAULT_SETTINGS } from "@/lib/astro/meta";
import { ianaZone } from "@/lib/timezones";

export function normEmail(e: unknown) {
  return typeof e === "string" ? e.trim().toLowerCase() : "";
}

export async function findUserByEmail(email: string) {
  const [u] = await db().select().from(schema.users).where(eq(schema.users.email, normEmail(email)));
  return u ?? null;
}

export async function createPractice(input: { name: string; practice: string; email: string; password: string; timezone?: string }) {
  const practiceId = newId("prc");
  const userId = newId("usr");
  const email = normEmail(input.email);
  await db().transaction(async (tx) => {
    await tx.insert(schema.practices).values({ id: practiceId, name: input.practice });
    await tx.insert(schema.users).values({ id: userId, practiceId, email, name: input.name, role: "owner", passwordHash: await hashPassword(input.password) });
  });
  const first = input.name.split(/\s+/)[0] ?? input.name;
  await putSettings(
    practiceId,
    { name: input.name, firstName: first, title: "Consulting Astrologer", email, phone: "", practice: input.practice, website: "", timezone: ianaZone(input.timezone), bio: "", plan: "Beta", reminders: { clients: false, hoursBefore: 24 } },
    DEFAULT_SETTINGS,
  );
  await sendVerification(userId, email, first);
  return { practiceId, userId };
}

export async function sendVerification(userId: string, email: string, firstName: string) {
  const token = await issueToken(userId, "verify", 48);
  await sendMail(
    email,
    "Confirm your AstrologersDirect email",
    `Hi ${firstName},\n\nConfirm your email address to finish setting up your practice:\n\n${link(`/auth/verify?token=${token}`)}\n\nThis link expires in 48 hours. If you didn't create an account, you can ignore this email.`,
  );
}
