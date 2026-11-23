import { issueToken } from "@/lib/server/auth";
import { findUserByEmail } from "@/lib/server/accounts";
import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { link, sendMail } from "@/lib/server/mail";

/** Always answers 200 so the form never reveals whether an account exists. */
export const POST = handler(async (req) => {
  rateLimit(req, "reset", 5, 15 * 60_000);
  const { email } = (await readJson(req)) as { email?: string };
  const user = email ? await findUserByEmail(email) : null;
  if (user) {
    const token = await issueToken(user.id, "reset", 1);
    await sendMail(
      user.email,
      "Reset Your Astrologers Direct Password",
      `Hi ${user.name.split(/\s+/)[0]},\n\nUse this link to choose a new password:\n\n${link(`/auth/reset?token=${token}`)}\n\nThe link expires in 1 hour. If you didn't ask for this, you can ignore this email; your password hasn't changed.`,
    );
  }
  return json({ ok: true });
});
