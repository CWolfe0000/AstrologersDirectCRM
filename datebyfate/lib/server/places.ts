import "server-only";
import { cityMapping } from "city-timezones";

export type PlaceResult = { place: string; lat: number; lon: number; tz: string };

/** Lower-case, accents removed: "São" matches "sao". */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

let index: { key: string; pop: number; result: PlaceResult }[] | undefined;
function builtIn() {
  index ??= cityMapping
    .filter((c) => c.timezone && Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map((c) => ({
      key: fold(c.city),
      pop: c.pop || 0,
      result: { place: [c.city, c.province && c.province !== c.city ? c.province : null, c.country].filter(Boolean).join(", "), lat: c.lat, lon: c.lng, tz: c.timezone },
    }))
    .sort((a, b) => b.pop - a.pop);
  return index;
}

async function geonames(q: string): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ name_startsWith: q, orderby: "population", maxRows: "8", featureClass: "P", style: "FULL", username: process.env.GEONAMES_USERNAME! });
  const res = await fetch(`https://secure.geonames.org/searchJSON?${params}`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`GeoNames HTTP ${res.status}`);
  const data = (await res.json()) as { geonames?: { name: string; adminName1?: string; countryName?: string; lat: string; lng: string; timezone?: { timeZoneId?: string } }[] };
  return (data.geonames ?? [])
    .filter((g) => g.timezone?.timeZoneId)
    .map((g) => ({
      place: [g.name, g.adminName1 && g.adminName1 !== g.name ? g.adminName1 : null, g.countryName].filter(Boolean).join(", "),
      lat: Number(g.lat),
      lon: Number(g.lng),
      tz: g.timezone!.timeZoneId!,
    }));
}

/**
 * Birthplace search. Uses GeoNames when GEONAMES_USERNAME is set (every town),
 * and otherwise, or if GeoNames fails, a built-in list of about 7,300 cities.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const q = fold(query.split(",")[0] ?? "");
  if (q.length < 2) return [];
  if (process.env.GEONAMES_USERNAME) {
    try {
      const found = await geonames(q);
      if (found.length) return found;
    } catch (e) {
      console.warn("GeoNames search failed; using the built-in list.", e);
    }
  }
  const all = builtIn();
  const starts = all.filter((c) => c.key.startsWith(q));
  const contains = starts.length < 8 ? all.filter((c) => !c.key.startsWith(q) && c.key.includes(q)) : [];
  const seen = new Set<string>();
  return [...starts, ...contains].map((c) => c.result).filter((r) => !seen.has(r.place) && seen.add(r.place)).slice(0, 8);
}
