import { sendVerification } from "@/lib/server/accounts";
import { handler, json, rateLimit, requireUser } from "@/lib/server/http";

export const POST = handler(async (req) => {
  rateLimit(req, "resend-verify", 5, 3_600_000);
  const u = await requireUser();
  if (!u.emailVerified) await sendVerification(u.id, u.email, u.name.split(/\s+/)[0] ?? u.name);
  return json({ ok: true });
});
