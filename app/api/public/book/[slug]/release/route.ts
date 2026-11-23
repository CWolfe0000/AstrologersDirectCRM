import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { abandonCheckout } from "@/lib/server/booking";

/** The client left Stripe Checkout without paying: free the time they were holding. */
export const POST = handler(async (req: Request) => {
  rateLimit(req, "book-release", 60, 3_600_000);
  const { id } = (await readJson(req, 2_000)) as { id?: string };
  await abandonCheckout(String(id ?? ""));
  return json({ ok: true });
});
