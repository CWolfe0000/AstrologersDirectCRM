import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { sendSignInEmail } from "@/lib/server/emailauth";

/** Email a sign-in link and code. Always answers the same way, whether or not the address has an account. */
export const POST = handler(async (req) => {
  rateLimit(req, "email-link", 10, 15 * 60_000);
  const { email } = (await readJson(req)) as { email?: string };
  const e = String(email ?? "").trim().toLowerCase();
  if (e && e.length <= 200) {
    rateLimit(req, `email-link:${e}`, 5, 15 * 60_000, { global: true });
    await sendSignInEmail(e);
  }
  return json({ ok: true });
});
