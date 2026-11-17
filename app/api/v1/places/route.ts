import { handler, HttpError, json, rateLimit, requireUser } from "@/lib/server/http";
import { geonamesEnabled, searchPlaces } from "@/lib/server/geonames";

/** Birthplace search (GeoNames). Practitioners only. 503 when not configured, so the UI uses its built-in list. */
export const GET = handler(async (req: Request) => {
  rateLimit(req, "places", 600, 3_600_000);
  await requireUser("owner");
  if (!geonamesEnabled()) throw new HttpError(503, "Place search isn’t configured.");
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return json({ results: [] });
  try {
    return json({ results: await searchPlaces(q) });
  } catch (e) {
    console.error("[places]", e);
    throw new HttpError(502, "Place search is unavailable right now.");
  }
});
