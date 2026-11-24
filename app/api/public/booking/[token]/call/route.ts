import { handler, json, rateLimit } from "@/lib/server/http";
import { bookingCall } from "@/lib/server/booking";

/** A client joins their session's call from their booking link (no sign-in). */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "call-join", 60, 3_600_000);
  return json(await bookingCall((await ctx.params).token));
});
