import "server-only";
import { ianaZone } from "@/lib/timezones";

export type PlaceResult = { place: string; lat: number; lon: number; tz: string; population?: number };

type Raw = {
  name: string;
  adminName1?: string;
  countryName?: string;
  lat: string;
  lng: string;
  population?: number;
  timezone?: { timeZoneId?: string };
};

const cache = new Map<string, { at: number; results: PlaceResult[] }>();
const TTL = 24 * 3600_000;

export function geonamesEnabled() {
  return !!process.env.GEONAMES_USERNAME;
}

/**
 * Populated places matching a query, from GeoNames (geonames.org), with each
 * place's IANA time zone. The zone carries the place's full history of offsets
 * and daylight saving, which the birth-time conversion uses.
 */
export async function searchPlaces(q: string, lang = "en"): Promise<PlaceResult[]> {
  const key = `${lang}|${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.results;
  const params = new URLSearchParams({
    q,
    maxRows: "8",
    featureClass: "P",
    style: "FULL",
    orderby: "relevance",
    isNameRequired: "true",
    lang,
    username: process.env.GEONAMES_USERNAME ?? "",
  });
  let data: { geonames?: Raw[]; status?: { message: string; value: number } } | null = null;
  let lastError: unknown;
  for (const host of ["https://secure.geonames.org", "http://api.geonames.org"]) {
    try {
      const res = await fetch(`${host}/searchJSON?${params}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`GeoNames HTTP ${res.status}`);
      data = await res.json();
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!data) throw lastError instanceof Error ? lastError : new Error("GeoNames unavailable");
  if (data.status) throw new Error(`GeoNames: ${data.status.message}`);
  const results: PlaceResult[] = [];
  const seen = new Set<string>();
  for (const g of data.geonames ?? []) {
    const tz = g.timezone?.timeZoneId;
    if (!tz) continue;
    const place = [g.name, g.adminName1 && g.adminName1 !== g.name ? g.adminName1 : null, g.countryName].filter(Boolean).join(", ");
    if (seen.has(place)) continue;
    seen.add(place);
    results.push({ place, lat: Number(g.lat), lon: Number(g.lng), tz: ianaZone(tz), population: g.population || undefined });
  }
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), results });
  return results;
}
