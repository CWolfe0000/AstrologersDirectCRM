import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { cancelBooking } from "@/lib/server/booking";

/** Cancel the session (public, by private link). */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "booking-change", 10, 3_600_000);
  const { reason } = (await readJson(req, 5_000)) as { reason?: string };
  return json(await cancelBooking((await ctx.params).token, String(reason ?? "")));
});
