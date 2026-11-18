import { handler, json, rateLimit } from "@/lib/server/http";
import { manageView } from "@/lib/server/booking";

/** A booked session, by the client's private link (public). */
export const GET = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "booking-manage", 300, 3_600_000);
  return json(await manageView((await ctx.params).token));
});
