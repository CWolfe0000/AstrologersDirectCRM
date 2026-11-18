import { handler, json, rateLimit } from "@/lib/server/http";
import { slotsFor } from "@/lib/server/booking";

/** Bookable start times (UTC) for a service (public). */
export const GET = handler(async (req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  rateLimit(req, "book-slots", 600, 3_600_000);
  const service = new URL(req.url).searchParams.get("service") ?? "";
  return json({ slots: await slotsFor((await ctx.params).slug, service) });
});
