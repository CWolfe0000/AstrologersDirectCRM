import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { sha256, unseal } from "@/lib/server/crypto";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { matchTotpStep, newRecoveryCodes } from "@/lib/server/totp";

/** Confirm setup with a code from the app. Returns one-time recovery codes. */
export const POST = handler(async (req) => {
  rateLimit(req, "2fa-enable", 10, 15 * 60_000);
  const u = await requireUser();
  const { code } = (await readJson(req)) as { code?: string };
  const [row] = await db().select().from(schema.users).where(eq(schema.users.id, u.id));
  if (!row?.totpSecret || row.totpEnabledAt) throw new HttpError(400, "Start setup again.");
  const step = matchTotpStep(unseal<string>(row.totpSecret), String(code ?? ""));
  if (step === null) throw new HttpError(400, "That code didn’t match. Check the time on your phone and try the newest code.");
  const codes = newRecoveryCodes();
  await db().update(schema.users).set({ totpEnabledAt: new Date(), totpLastStep: step, recoveryCodes: JSON.stringify(codes.map(sha256)) }).where(eq(schema.users.id, u.id));
  return json({ ok: true, recoveryCodes: codes });
});
