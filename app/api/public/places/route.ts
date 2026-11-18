import { handler, HttpError, json, rateLimit } from "@/lib/server/http";
import { geonamesEnabled, searchPlaces } from "@/lib/server/geonames";

/** Birthplace search for public booking forms (rate-limited). 503 when not configured. */
export const GET = handler(async (req: Request) => {
  rateLimit(req, "places-public", 200, 3_600_000);
  if (!geonamesEnabled()) throw new HttpError(503, "Place search isn’t configured.");
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return json({ results: [] });
  try {
    return json({ results: await searchPlaces(q) });
  } catch {
    throw new HttpError(502, "Place search is unavailable right now.");
  }
});
