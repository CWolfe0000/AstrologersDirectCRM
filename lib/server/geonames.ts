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
  // While typing ("Porto Ale"), match the start of the name; a full query ("Paris, Texas") uses word search.
  // Prefix results fall back to word search when nothing starts with what was typed.
  const prefix = !q.includes(",");
  let results = await query(prefix ? { name_startsWith: q, orderby: "population", maxRows: "25" } : { q, orderby: "relevance", isNameRequired: "true", maxRows: "8" }, lang);
  if (prefix) {
    const want = fold(q);
    results = results.filter((r) => fold(r.name).startsWith(want) || fold(r.place).startsWith(want));
    if (results.length === 0) results = await query({ q, orderby: "relevance", isNameRequired: "true", maxRows: "8" }, lang);
  }
  const out: PlaceResult[] = [];
  const seen = new Set<string>();
  for (const { name, ...r } of results) {
    void name;
    if (seen.has(r.place)) continue;
    seen.add(r.place);
    out.push(r);
    if (out.length === 8) break;
  }
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), results: out });
  return out;
}

/** Lower-case, accents removed: "São" matches "sao". */
function fold(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function query(extra: Record<string, string>, lang: string): Promise<(PlaceResult & { name: string })[]> {
  const params = new URLSearchParams({ ...extra, featureClass: "P", style: "FULL", lang, username: process.env.GEONAMES_USERNAME ?? "" });
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
  return (data.geonames ?? [])
    .filter((g) => g.timezone?.timeZoneId)
    .map((g) => ({
      name: g.name,
      place: [g.name, g.adminName1 && g.adminName1 !== g.name ? g.adminName1 : null, g.countryName].filter(Boolean).join(", "),
      lat: Number(g.lat),
      lon: Number(g.lng),
      tz: ianaZone(g.timezone!.timeZoneId!),
      population: g.population || undefined,
    }));
}
