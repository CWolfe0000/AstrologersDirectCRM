import { handler, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { onboardingLink } from "@/lib/server/payments";

/** Start or continue Stripe's onboarding; returns the Stripe page to send the astrologer to. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser("owner");
  rateLimit(req, `stripe-connect:${user.practiceId}`, 20, 3_600_000);
  const { returnTo } = (await readJson(req, 1_000).catch(() => ({}))) as { returnTo?: string };
  return json({ url: await onboardingLink(user.practiceId, user.email ?? null, returnTo === "setup" ? "/app/welcome" : "/app/settings?section=payments") });
});
