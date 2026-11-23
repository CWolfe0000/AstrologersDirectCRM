import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { confirmCheckout } from "@/lib/server/booking";

type Ctx = { params: Promise<{ slug: string }> };

/** Back from Stripe Checkout: confirm the payment and show the booking. */
export const POST = handler(async (req: Request, ctx: Ctx) => {
  rateLimit(req, "book-confirm", 120, 3_600_000);
  const { session } = (await readJson(req, 2_000)) as { session?: string };
  return json(await confirmCheckout((await ctx.params).slug, String(session ?? "")));
});
