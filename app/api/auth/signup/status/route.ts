import { handler, json, rateLimit } from "@/lib/server/http";
import { inviteFor, inviteOnly } from "@/lib/server/access";

/** Whether sign-up is open, and who an invite link is for. */
export const GET = handler(async (req: Request) => {
  rateLimit(req, "signup-status", 120, 3_600_000);
  const invite = await inviteFor(new URL(req.url).searchParams.get("invite"));
  return json({ open: !(await inviteOnly()), invite: invite ? { email: invite.email, name: invite.name, practice: invite.practice } : null });
});
