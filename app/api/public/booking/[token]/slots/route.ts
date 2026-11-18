import { handler, json, rateLimit } from "@/lib/server/http";
import { manageSlots } from "@/lib/server/booking";

/** Times the session can move to (public, by private link). */
export const GET = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "booking-manage", 300, 3_600_000);
  return json({ slots: await manageSlots((await ctx.params).token) });
});
