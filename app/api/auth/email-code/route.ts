import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { signInWithCode } from "@/lib/server/emailauth";

/** Sign in with the 6-digit code from the sign-in email. */
export const POST = handler(async (req) => {
  rateLimit(req, "email-code", 30, 15 * 60_000);
  const { email, code } = (await readJson(req)) as { email?: string; code?: string };
  const r = await signInWithCode(String(email ?? "").trim().toLowerCase(), String(code ?? ""));
  if (!r) throw new HttpError(401, "That code didn’t work. Check the newest email, or ask for a new code.");
  return json(r);
});
