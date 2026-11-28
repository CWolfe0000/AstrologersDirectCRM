import "server-only";
import { cityMapping } from "city-timezones";

export type PlaceResult = { place: string; lat: number; lon: number; tz: string };

/** Lower-case, accents removed: "São" matches "sao". */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Entry = { key: string; pop: number; result: () => PlaceResult };
let index: Entry[] | undefined;
const countryName = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * The built-in list: about 135,000 towns of 1,000 people or more (GeoNames data, via the
 * all-the-cities package), with the time zone worked out from the coordinates. The older list of
 * about 7,300 cities is the fallback if that data cannot be loaded, and supplies province names.
 */
function builtIn(): Entry[] {
  if (index) return index;
  const small: Entry[] = cityMapping
    .filter((c) => c.timezone && Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map((c) => {
      const result = { place: [c.city, c.province && c.province !== c.city ? c.province : null, c.country].filter(Boolean).join(", "), lat: c.lat, lon: c.lng, tz: c.timezone };
      return { key: fold(c.city), pop: c.pop || 0, result: () => result };
    });
  let towns: Entry[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cities = require("all-the-cities") as { name: string; country: string; adminCode: string; population: number; loc: { coordinates: [number, number] } }[];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tzOf = require("tz-lookup") as (lat: number, lon: number) => string;
    // A big city keeps its fuller name from the older list ("London, Westminster, United Kingdom").
    const known = new Set(small.map((c) => `${c.key}|${Math.round(c.result().lat)}|${Math.round(c.result().lon)}`));
    towns = cities
      .filter((c) => !known.has(`${fold(c.name)}|${Math.round(c.loc.coordinates[1])}|${Math.round(c.loc.coordinates[0])}`))
      .map((c) => ({
        key: fold(c.name),
        pop: c.population || 0,
        result: () => {
          const [lon, lat] = c.loc.coordinates;
          let country = c.country;
          try { country = countryName.of(c.country) ?? c.country; } catch { /* keep the code */ }
          // Letter codes are states and provinces people recognise ("ID", "ON"); numeric ones are not.
          const region = /^[A-Z]{2,3}$/.test(c.adminCode) ? c.adminCode : null;
          return { place: [c.name, region, country].filter(Boolean).join(", "), lat, lon, tz: tzOf(lat, lon) };
        },
      }));
  } catch (e) {
    console.warn("The large town list could not be loaded; using the smaller built-in list.", e);
  }
  index = [...small, ...towns].sort((a, b) => b.pop - a.pop);
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
 * and otherwise, or if GeoNames fails, the built-in list of about 135,000 towns.
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
  return [...starts.slice(0, 40), ...contains.slice(0, 40)].map((c) => c.result()).filter((r) => !seen.has(r.place) && seen.add(r.place)).slice(0, 8);
}
