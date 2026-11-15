import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { HttpError } from "./http";

/** After this many consecutive failures (password or code), the account is locked for LOCK_MINUTES. */
const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;

type UserRow = typeof schema.users.$inferSelect;

export function assertNotLocked(user: Pick<UserRow, "lockedUntil">) {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now())
    throw new HttpError(429, "Too many unsuccessful attempts. For your security this account is paused for 15 minutes — try again then, or reset your password.");
}

/** Count a failed sign-in attempt; locks the account after MAX_FAILURES. */
export async function recordFailure(userId: string) {
  await db()
    .update(schema.users)
    .set({
      failedLogins: sql`${schema.users.failedLogins} + 1`,
      lockedUntil: sql`case when ${schema.users.failedLogins} + 1 >= ${MAX_FAILURES} then now() + interval '${sql.raw(String(LOCK_MINUTES))} minutes' else ${schema.users.lockedUntil} end`,
    })
    .where(eq(schema.users.id, userId));
}

export async function clearFailures(userId: string) {
  await db().update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, userId));
}
