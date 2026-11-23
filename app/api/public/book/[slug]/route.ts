import { handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { book, bookingRequest, publicBooking, publicView, takesPayments } from "@/lib/server/booking";

type Ctx = { params: Promise<{ slug: string }> };

/** A published booking page (public). */
export const GET = handler(async (req: Request, ctx: Ctx) => {
  rateLimit(req, "book-view", 300, 3_600_000);
  const b = await publicBooking((await ctx.params).slug);
  return json(publicView(b, await takesPayments(b)));
});

/** Book a session (public). */
export const POST = handler(async (req: Request, ctx: Ctx) => {
  rateLimit(req, "book", 10, 3_600_000);
  const parsed = bookingRequest.safeParse(await readJson(req, 50_000));
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  if (parsed.data.website) throw new HttpError(422, "Please check the form and try again."); // bots fill the hidden field
  return json(await book((await ctx.params).slug, parsed.data));
});
