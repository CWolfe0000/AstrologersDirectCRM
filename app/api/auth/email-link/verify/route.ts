import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { signInWithLink } from "@/lib/server/emailauth";

/** Sign in with an emailed link (the page posts the token after a click, so link scanners can't use it up). */
export const POST = handler(async (req) => {
  rateLimit(req, "email-link-verify", 30, 15 * 60_000);
  const { token } = (await readJson(req)) as { token?: string };
  const r = await signInWithLink(String(token ?? ""));
  if (!r) throw new HttpError(400, "This sign-in link has expired or was already used. Ask for a new one.");
  return json(r);
});
