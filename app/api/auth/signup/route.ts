import { z } from "zod";
import { createSession, passwordProblem } from "@/lib/server/auth";
import { createPractice, findUserByEmail, normEmail } from "@/lib/server/accounts";
import { inviteFor, inviteOnly, markJoined } from "@/lib/server/access";
import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  practice: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  /** Optional: without one, the account signs in with emailed links. */
  password: z.string().optional(),
  timezone: z.string().max(80).optional(),
  /** Private beta: the single-use link from an approved access request. */
  invite: z.string().max(200).optional(),
  /** Agreement to emails from AstrologersDirect (account, beta, product news), required to join. */
  emailConsent: z.boolean().optional(),
});

export const POST = handler(async (req) => {
  rateLimit(req, "signup", 10, 3_600_000);
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Please fill in your name, practice name and email.");
  if (parsed.data.emailConsent !== true) throw new HttpError(422, "Please agree to the Terms, Privacy Policy and emails from AstrologersDirect.");
  const problem = parsed.data.password ? passwordProblem(parsed.data.password) : null;
  if (problem) throw new HttpError(422, problem);
  const invite = await inviteFor(parsed.data.invite);
  if (await inviteOnly()) {
    if (!invite) throw new HttpError(403, "AstrologersDirect is in private beta. Request access, and we’ll email you a link to create your account.");
    if (invite.email !== normEmail(parsed.data.email)) throw new HttpError(403, "Please use the email address your invitation was sent to.");
  }
  if (await findUserByEmail(parsed.data.email)) throw new HttpError(409, "An account with this email already exists. Sign in instead.");
  const { invite: _i, emailConsent: _c, ...input } = parsed.data;
  void _c;
  void _i;
  const { userId } = await createPractice(input);
  if (invite) await markJoined(invite.id);
  await createSession(userId);
  return json({ ok: true }, 201);
});
