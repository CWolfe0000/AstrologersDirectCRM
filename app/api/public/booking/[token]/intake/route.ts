import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { bookingIntake, submitBookingIntake } from "@/lib/server/booking";

/** The intake form for a booked session (public, by the client's private booking link). */
export const GET = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "booking-manage", 300, 3_600_000);
  return json(await bookingIntake((await ctx.params).token));
});

export const POST = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(req, "intake-submit", 30, 3_600_000);
  const { answers } = (await readJson(req, 200_000)) as { answers?: unknown };
  return json(await submitBookingIntake((await ctx.params).token, answers ?? {}));
});
