import { handler, json, rateLimit, requireUser } from "@/lib/server/http";
import { dashboardLink } from "@/lib/server/payments";

/** A one-time link into the astrologer's Stripe dashboard (payouts, receipts, disputes). */
export const POST = handler(async (req: Request) => {
  const user = await requireUser("owner");
  rateLimit(req, `stripe-dash:${user.practiceId}`, 30, 3_600_000);
  return json({ url: await dashboardLink(user.practiceId) });
});
