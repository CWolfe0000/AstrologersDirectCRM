import "server-only";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db, schema } from "./db";
import { seal, sha256, unseal } from "./crypto";
import { matchTotpStep } from "./totp";

type UserRow = typeof schema.users.$inferSelect;

/** Checks an authenticator code, or consumes a recovery code. */
export async function checkSecondFactor(user: UserRow, code: string) {
  if (!user.totpEnabledAt || !user.totpSecret) return false;
  const c = String(code ?? "").trim().toLowerCase();
  if (/^\d{6}$/.test(c.replace(/\s+/g, ""))) {
    const step = matchTotpStep(unseal<string>(user.totpSecret), c);
    if (step === null) return false;
    // Record the step atomically; a code (or an older one) can't be replayed.
    const updated = await db()
      .update(schema.users)
      .set({ totpLastStep: step })
      .where(and(eq(schema.users.id, user.id), or(isNull(schema.users.totpLastStep), lt(schema.users.totpLastStep, step))))
      .returning({ id: schema.users.id });
    return updated.length === 1;
  }
  if (/^[a-z2-7]{4}-[a-z2-7]{4}$/.test(c)) {
    const before = user.recoveryCodes ?? "[]";
    const hashes: string[] = JSON.parse(before);
    const h = sha256(c);
    if (!hashes.includes(h)) return false;
    // Conditional on the list not having changed, so two requests can't spend the same code.
    const updated = await db()
      .update(schema.users)
      .set({ recoveryCodes: JSON.stringify(hashes.filter((x) => x !== h)) })
      .where(and(eq(schema.users.id, user.id), eq(schema.users.recoveryCodes, before)))
      .returning({ id: schema.users.id });
    return updated.length === 1;
  }
  return false;
}

export function sealSecret(secret: string) {
  return seal(secret);
}
