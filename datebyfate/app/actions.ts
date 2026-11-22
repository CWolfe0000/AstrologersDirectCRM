"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { birthSchema, personFromForm, type PersonKind } from "@/lib/people";
import type { Interval } from "@/lib/plans";
import { elementReading } from "@/lib/reading/elements";
import { ownPattern, placementsOf, type OwnPattern, type Placement } from "@/lib/reading/own";
import { consumeResetToken, createSession, destroySession, hashPassword, issueResetToken, passwordProblem, rateLimit, requireUser, verifyPassword } from "@/lib/server/auth";
import { billingConfigured, cancelSubscriptionNow, checkoutUrl, portalUrl } from "@/lib/server/billing";
import { chartFor } from "@/lib/server/charts";
import { newId } from "@/lib/server/crypto";
import { db, schema } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { sendMail } from "@/lib/server/mail";
import { deletePerson, savePerson } from "@/lib/server/people";

export type FormState = { error?: string; ok?: string } | undefined;

const BUSY = "Too many attempts. Please wait a few minutes and try again.";
const emailSchema = z.string().trim().toLowerCase().email().max(200);

/* ---------- Accounts ---------- */

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("signup", 10, 3_600_000))) return { error: BUSY };
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const email = emailSchema.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!name) return { error: "Enter your first name." };
  if (!email.success) return { error: "Enter a valid email address." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const id = newId("u");
  const created = await db().insert(schema.users).values({ id, email: email.data, name, passwordHash: await hashPassword(password) }).onConflictDoNothing().returning();
  if (created.length === 0) return { error: "There is already an account with that email. Sign in instead." };
  await createSession(id);
  redirect("/app");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 20, 900_000))) return { error: BUSY };
  const email = emailSchema.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  const wrong = { error: "That email and password don’t match." };
  if (!email.success) return wrong;
  const [u] = await db().select().from(schema.users).where(eq(schema.users.email, email.data));
  if (u?.lockedUntil && u.lockedUntil > new Date()) return { error: "Too many wrong passwords. Try again in 15 minutes, or reset your password." };
  if (!(await verifyPassword(password, u?.passwordHash ?? null)) || !u) {
    if (u) {
      const failed = u.failedLogins + 1;
      await db().update(schema.users).set({ failedLogins: failed >= 8 ? 0 : failed, lockedUntil: failed >= 8 ? new Date(Date.now() + 900_000) : null }).where(eq(schema.users.id, u.id));
    }
    return wrong;
  }
  await db().update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, u.id));
  await createSession(u.id);
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function requestReset(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("reset", 5, 3_600_000))) return { error: BUSY };
  const email = emailSchema.safeParse(form.get("email"));
  if (email.success) {
    const [u] = await db().select().from(schema.users).where(eq(schema.users.email, email.data));
    if (u) {
      const token = await issueResetToken(u.id);
      await sendMail(u.email, "Reset your Datebyfate password", `Hi ${u.name},\n\nUse this link to choose a new password. It works once and expires in two hours.\n\n${env.appUrl}/reset?token=${token}\n\nIf you didn’t ask for this, you can ignore this email.`);
    }
  }
  // The same answer whether or not the account exists.
  return { ok: "If there is an account with that email, we’ve sent a link to reset the password." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("reset-use", 10, 3_600_000))) return { error: BUSY };
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const userId = await consumeResetToken(String(form.get("token") ?? ""));
  if (!userId) return { error: "This link has expired or was already used. Ask for a new one." };
  await db().update(schema.users).set({ passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, userId));
  // Signs out every device, then signs this one in.
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await createSession(userId);
  redirect("/app");
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== "delete") return { error: "Type DELETE to confirm." };
  const [u] = await db().select().from(schema.users).where(eq(schema.users.id, user.id));
  if (u?.stripeSubscriptionId && u.subscriptionStatus && !["canceled", "incomplete_expired"].includes(u.subscriptionStatus)) {
    try {
      await cancelSubscriptionNow(u.stripeSubscriptionId);
    } catch (e) {
      console.error("Could not cancel subscription on account deletion", e);
      return { error: "We couldn’t cancel your subscription, so your account was not deleted. Cancel it under Manage billing, then try again." };
    }
  }
  await db().delete(schema.users).where(eq(schema.users.id, user.id)); // people, sessions and tokens go with it
  await destroySession();
  redirect("/?deleted=1");
}

/* ---------- The free reading (no account) ---------- */

export type FreeReading = { error: string } | { pattern: OwnPattern; placements: Placement[]; elements: ReturnType<typeof elementReading> };

export async function freeReading(input: unknown): Promise<FreeReading> {
  if (!(await rateLimit("free-reading", 30, 3_600_000))) return { error: BUSY };
  const birth = birthSchema.safeParse(input);
  if (!birth.success) return { error: birth.error.issues[0]?.message ?? "Check the birth details." };
  const chart = chartFor(birth.data);
  return { pattern: ownPattern(chart), placements: placementsOf(chart), elements: elementReading(chart) };
}

/* ---------- People ---------- */

async function savePersonFrom(kind: PersonKind, form: FormData): Promise<FormState | string> {
  const user = await requireUser();
  const parsed = personFromForm(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  try {
    return await savePerson(user.id, kind, parsed.data, String(form.get("id") ?? "") || undefined);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveSelf(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  form.set("name", user.name);
  const r = await savePersonFrom("self", form);
  if (typeof r !== "string") return r;
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function saveEx(_: FormState, form: FormData): Promise<FormState> {
  const r = await savePersonFrom("ex", form);
  if (typeof r !== "string") return r;
  revalidatePath("/app", "layout");
  redirect("/app/exes");
}

export async function saveMatch(_: FormState, form: FormData): Promise<FormState> {
  const r = await savePersonFrom("match", form);
  if (typeof r !== "string") return r;
  revalidatePath("/app", "layout");
  redirect(`/app/people/${r}`);
}

export async function removePerson(form: FormData) {
  const user = await requireUser();
  await deletePerson(user.id, String(form.get("id") ?? ""));
  revalidatePath("/app", "layout");
  redirect(String(form.get("back") ?? "") === "exes" ? "/app/exes" : "/app/people");
}

/* ---------- Billing ---------- */

export async function startCheckout(form: FormData) {
  const user = await requireUser();
  if (!billingConfigured()) redirect("/pricing?billing=unavailable");
  const interval: Interval = form.get("interval") === "yearly" ? "yearly" : "monthly";
  let url: string;
  try {
    url = await checkoutUrl(user.id, interval);
  } catch (e) {
    console.error("Checkout failed", e);
    redirect("/pricing?billing=error");
  }
  redirect(url);
}

export async function openBillingPortal() {
  const user = await requireUser();
  let url: string;
  try {
    url = await portalUrl(user.id);
  } catch (e) {
    console.error("Billing portal failed", e);
    redirect("/app/account?billing=error");
  }
  redirect(url);
}
