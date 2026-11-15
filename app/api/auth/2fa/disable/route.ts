import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { checkSecondFactor } from "@/lib/server/twofactor";

/** Turn two-factor off. Requires the password and a current code (or recovery code). */
export const POST = handler(async (req) => {
  rateLimit(req, "2fa-disable", 10, 15 * 60_000);
  const u = await requireUser();
  const { password, code } = (await readJson(req)) as { password?: string; code?: string };
  const [row] = await db().select().from(schema.users).where(eq(schema.users.id, u.id));
  if (!row?.totpEnabledAt) throw new HttpError(400, "Two-factor authentication is already off.");
  if (!(await verifyPassword(String(password ?? ""), row.passwordHash))) throw new HttpError(400, "Your password isn’t right.");
  if (!(await checkSecondFactor(row, String(code ?? "")))) throw new HttpError(400, "That code didn’t match.");
  await db().update(schema.users).set({ totpSecret: null, totpEnabledAt: null, recoveryCodes: null }).where(eq(schema.users.id, u.id));
  return json({ ok: true });
});
