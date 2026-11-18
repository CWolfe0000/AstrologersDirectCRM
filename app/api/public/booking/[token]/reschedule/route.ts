import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { reschedule } from "@/lib/server/booking";

/** Move the session to another open time (public, by private link). */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "booking-change", 10, 3_600_000);
  const { start, tz } = (await readJson(req, 5_000)) as { start?: string; tz?: string };
  if (typeof start !== "string" || !start) throw new HttpError(422, "Choose a new time.");
  return json(await reschedule((await ctx.params).token, start, String(tz ?? "")));
});
