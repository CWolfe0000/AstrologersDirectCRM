import "server-only";
import { HttpError } from "./http";
import { siderealOffset } from "./swiss";
import type { ZodiacType } from "@/lib/astro/types";

/**
 * Any numbered asteroid, from NASA JPL: the Small-Body Database to find it by
 * name or number, and Horizons for its position. Positions are apparent
 * geocentric ecliptic longitude of date (the same frame as the Swiss
 * Ephemeris tropical zodiac; checked against Swiss for Ceres and Vesta to
 * better than an arcsecond). The main asteroids stay on the Swiss Ephemeris.
 */

const SBDB = "https://ssd-api.jpl.nasa.gov/sbdb.api";
const HORIZONS = "https://ssd.jpl.nasa.gov/api/horizons.api";

export interface AsteroidRef { n: number; name: string }

const searchCache = new Map<string, AsteroidRef[]>();

/** "433 Eros (A898 PA)" → { n: 433, name: "Eros" }; unnamed ones keep their designation. */
function parseFull(full: string): AsteroidRef | null {
  const m = full.trim().match(/^(\d+)\s+(.+?)(?:\s+\(([^)]+)\))?$/);
  if (!m) return null;
  return { n: Number(m[1]), name: m[2]!.trim() };
}

export async function searchAsteroids(q: string): Promise<AsteroidRef[]> {
  const query = q.trim();
  if (query.length < 2 || query.length > 60) return [];
  const key = query.toLowerCase();
  const hit = searchCache.get(key);
  if (hit) return hit;
  const sstr = /^\d+$/.test(query) ? query : `${query.replace(/[*?]/g, "")}*`;
  const res = await fetch(`${SBDB}?sstr=${encodeURIComponent(sstr)}`, { signal: AbortSignal.timeout(15_000) }).catch(() => null);
  if (!res) throw new HttpError(502, "The asteroid search isn’t answering right now. Try again in a moment.");
  const d = (await res.json().catch(() => ({}))) as { object?: { fullname?: string; kind?: string }; list?: { pdes: string; name: string }[] };
  let out: AsteroidRef[] = [];
  if (d.object?.fullname && d.object.kind?.startsWith("a")) {
    const r = parseFull(d.object.fullname);
    if (r) out = [r];
  } else if (d.list) {
    out = d.list.filter((x) => /^\d+$/.test(x.pdes)).map((x) => parseFull(x.name)).filter((x): x is AsteroidRef => !!x).slice(0, 25);
  }
  // An exact name first, then by number (the well-known ones are low-numbered).
  out.sort((a, b) => Number(b.name.toLowerCase() === key) - Number(a.name.toLowerCase() === key) || a.n - b.n);
  searchCache.set(key, out);
  if (searchCache.size > 2000) searchCache.delete(searchCache.keys().next().value!);
  return out;
}

const posCache = new Map<string, { lon: number; lat: number; speed: number }>();
const jdOf = (utc: string) => Date.parse(utc) / 86_400_000 + 2440587.5;

/** One asteroid at one moment (and half a day later, for its speed and direction). */
async function horizons(n: number, jd: number) {
  const key = `${n}|${jd.toFixed(5)}`;
  const hit = posCache.get(key);
  if (hit) return hit;
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${n};'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    TLIST: `'${jd.toFixed(6)}' '${(jd + 0.5).toFixed(6)}'`,
    TLIST_TYPE: "'JD'",
    TIME_TYPE: "'UT'",
    QUANTITIES: "'31'",
    ANG_FORMAT: "'DEG'",
    CSV_FORMAT: "'YES'",
  });
  const res = await fetch(`${HORIZONS}?${params}`, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
  if (!res?.ok) throw new HttpError(502, "Asteroid positions aren’t available right now. Try again in a moment.");
  const d = (await res.json().catch(() => ({}))) as { result?: string };
  const r = d.result ?? "";
  const body = r.slice(r.indexOf("$$SOE") + 5, r.indexOf("$$EOE"));
  const rows = body.trim().split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((x) => x.length >= 5);
  const pick = (row: string[]) => ({ lon: Number(row[3]), lat: Number(row[4]) });
  if (rows.length < 2) throw new HttpError(502, `No position for asteroid ${n}.`);
  const a = pick(rows[0]!), b = pick(rows[1]!);
  if (!Number.isFinite(a.lon) || !Number.isFinite(b.lon)) throw new HttpError(502, `No position for asteroid ${n}.`);
  const speed = ((((b.lon - a.lon + 540) % 360) - 180) * 2); // degrees per day
  const out = { lon: a.lon, lat: a.lat, speed };
  posCache.set(key, out);
  if (posCache.size > 20_000) posCache.delete(posCache.keys().next().value!);
  return out;
}

export async function asteroidPositions(list: AsteroidRef[], utc: string, zodiac: ZodiacType = "tropical") {
  const jd = jdOf(utc);
  if (!Number.isFinite(jd)) throw new HttpError(422, "Invalid date.");
  const off = siderealOffset(utc, zodiac);
  const got = await Promise.all(list.map((a) => horizons(a.n, jd).then((p) => ({ ...a, ...p, lon: (((p.lon - off) % 360) + 360) % 360 }), (e: Error) => ({ ...a, error: e.message }))));
  return got;
}
