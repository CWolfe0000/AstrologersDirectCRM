import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { seal, sha256, unseal } from "./crypto";
import { verifyTotp } from "./totp";

type UserRow = typeof schema.users.$inferSelect;

/** Checks an authenticator code, or consumes a recovery code. */
export async function checkSecondFactor(user: UserRow, code: string) {
  if (!user.totpEnabledAt || !user.totpSecret) return false;
  const c = String(code ?? "").trim().toLowerCase();
  if (/^\d{6}$/.test(c.replace(/\s+/g, ""))) return verifyTotp(unseal<string>(user.totpSecret), c);
  if (/^[a-z2-7]{4}-[a-z2-7]{4}$/.test(c)) {
    const hashes: string[] = JSON.parse(user.recoveryCodes ?? "[]");
    const h = sha256(c);
    if (!hashes.includes(h)) return false;
    await db().update(schema.users).set({ recoveryCodes: JSON.stringify(hashes.filter((x) => x !== h)) }).where(eq(schema.users.id, user.id));
    return true;
  }
  return false;
}

export function sealSecret(secret: string) {
  return seal(secret);
}
