import { and, eq, ne } from "drizzle-orm";
import { handler, json, rateLimit, requireUser } from "@/lib/server/http";
import { db, schema } from "@/lib/server/db";
import { RESERVED_SLUGS, SLUG_RE } from "@/lib/booking/types";

/** Is a profile address free? Checked as the astrologer types (saving checks again). */
export const GET = handler(async (req: Request) => {
  rateLimit(req, "address-check", 600, 3_600_000);
  const user = await requireUser("owner");
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return json({ available: false, reason: "Use 3–40 lowercase letters, numbers and hyphens." });
  if (RESERVED_SLUGS.has(slug)) return json({ available: false, reason: "That address is reserved. Try another." });
  const [taken] = await db()
    .select({ id: schema.bookingProfiles.practiceId })
    .from(schema.bookingProfiles)
    .where(and(eq(schema.bookingProfiles.slug, slug), ne(schema.bookingProfiles.practiceId, user.practiceId)));
  return json(taken ? { available: false, reason: "That address is taken. Try another." } : { available: true });
});
