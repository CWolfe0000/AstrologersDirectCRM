import { handler, json, requireUser } from "@/lib/server/http";
import { paymentStatus } from "@/lib/server/payments";

/** Where the astrologer stands with Stripe, and recent payments. */
export const GET = handler(async () => {
  const user = await requireUser("owner");
  return json(await paymentStatus(user.practiceId));
});
