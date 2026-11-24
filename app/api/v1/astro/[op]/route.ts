import { z } from "zod";
import { asteroidPositions, searchAsteroids } from "@/lib/server/asteroids";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { birthSchema, settingsSchema } from "@/lib/server/validation";
import { acgChart, davisonChart, motionFrom, natalChart, returnChart, positionsAt, progressedChart, solarArcChart, solarReturnChart } from "@/lib/server/astro";
import { SWISS_INFO, fixedStarsAt } from "@/lib/server/swiss";
import { coupleForecast, forecast, THEMES, type Theme } from "@/lib/server/forecast";
import { FIXED_STARS } from "@/lib/astro/fixed-stars";
import { CIRCUMSTANCES, EVENT_TYPES, IMPACT, moonSpans, moonTable, type Circumstance, type Impact, rectify, risingSpans, type EventType } from "@/lib/server/rectify";
import { findElections } from "@/lib/server/elect";
import { ELECTION_CHECKS, type ElectionCheck } from "@/lib/astro/elect";
import { requirePremium } from "@/lib/server/plan";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const points = z.object({ cusps: z.array(z.number()).length(12), asc: z.number(), mc: z.number() });
const rectSettings = z.object({ zodiac: z.enum(["tropical", "sidereal-lahiri", "sidereal-fagan-bradley"]), houseSystem: z.enum(["placidus", "whole-sign", "koch", "equal", "porphyry", "regiomontanus", "campanus"]) }).passthrough();
const Bodies = {
  natal: z.object({ birth: birthSchema, settings: settingsSchema }),
  positions: z.object({ utc: z.string().max(40), settings: settingsSchema, reference: points.optional() }),
  progressed: z.object({ birth: birthSchema, target: date, settings: settingsSchema }),
  "solar-arc": z.object({ birth: birthSchema, target: date, settings: settingsSchema }),
  acg: z.object({ birth: birthSchema, settings: settingsSchema }),
  elect: z.object({
    from: date,
    to: date,
    dailyFrom: z.string().regex(/^\d{2}:\d{2}$/),
    dailyTo: z.string().regex(/^\d{2}:\d{2}$/),
    stepMin: z.union([z.literal(15), z.literal(30), z.literal(60)]),
    place: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), tz: z.string().min(1).max(80) }),
    settings: settingsSchema,
    checks: z.array(z.enum(Object.keys(ELECTION_CHECKS) as [ElectionCheck, ...ElectionCheck[]])).min(1).max(20),
    natal: birthSchema.optional(),
  }),
  return: z.object({ birth: birthSchema, body: z.enum(["moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "chiron", "node"]), from: date, settings: settingsSchema, place: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).optional() }),
  motion: z.object({ utc: z.string().max(40), settings: z.object({ zodiac: z.enum(["tropical", "sidereal-lahiri", "sidereal-fagan-bradley"]) }).passthrough() }),
  rectify: z.object({
    birth: birthSchema,
    events: z.array(z.object({ date, type: z.enum(Object.keys(EVENT_TYPES) as [EventType, ...EventType[]]), note: z.string().max(300).optional(), impact: z.enum(Object.keys(IMPACT) as [Impact, ...Impact[]]).optional() })).max(40),
    circumstances: z.array(z.enum(Object.keys(CIRCUMSTANCES) as [Circumstance, ...Circumstance[]])).max(12).optional(),
    from: z.string().regex(/^\d{2}:\d{2}$/),
    to: z.string().regex(/^\d{2}:\d{2}$/),
    stepMin: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(5)]),
    settings: rectSettings,
    ascSigns: z.array(z.number().int().min(0).max(11)).max(12).optional(),
    moonSigns: z.array(z.number().int().min(0).max(11)).max(12).optional(),
  }),
  rising: z.object({ birth: birthSchema, settings: rectSettings }),
  stars: z.object({ utc: z.string().max(40), settings: z.object({ zodiac: z.enum(["tropical", "sidereal-lahiri", "sidereal-fagan-bradley"]) }).passthrough() }),
  "asteroid-search": z.object({ q: z.string().max(60) }),
  asteroids: z.object({ utc: z.string().max(40), list: z.array(z.object({ n: z.number().int().min(1).max(10_000_000), name: z.string().max(80) })).min(1).max(30), settings: z.object({ zodiac: z.enum(["tropical", "sidereal-lahiri", "sidereal-fagan-bradley"]) }).passthrough() }),
  forecast: z.object({ birth: birthSchema, settings: rectSettings, from: date, years: z.number().int().min(1).max(6), themes: z.array(z.enum(Object.keys(THEMES) as [Theme, ...Theme[]])).min(1).max(4) }),
  "couple-forecast": z.object({ a: birthSchema, b: birthSchema, settings: rectSettings, from: date, years: z.number().int().min(1).max(4), themes: z.array(z.enum(Object.keys(THEMES) as [Theme, ...Theme[]])).min(1).max(4) }),
  davison: z.object({ a: birthSchema, b: birthSchema, settings: settingsSchema }),
  "solar-return": z.object({ birth: birthSchema, year: z.number().int().min(1800).max(2399), settings: settingsSchema, place: z.object({ lat: z.number(), lon: z.number() }).optional() }),
};

/** Chart calculations (Swiss Ephemeris). Practitioners only. */
export const POST = handler(async (req: Request, ctx: { params: Promise<{ op: string }> }) => {
  const user = await requireUser("owner");
  const { op } = await ctx.params;
  if (!(op in Bodies)) throw new HttpError(404, "Unknown calculation.");
  // Natal charts (and synastry/composite, built from natal charts) are on every plan; timing techniques are Premium.
  if (op !== "natal") await requirePremium(user.practiceId);
  const parsed = Bodies[op as keyof typeof Bodies].safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Invalid chart request.", parsed.error.flatten());
  const b = parsed.data as never as Record<string, never>;
  try {
    switch (op) {
      case "natal":
        return json({ engine: SWISS_INFO, points: natalChart(b.birth, b.settings) });
      case "positions": {
        const utc = new Date(b.utc as string);
        if (Number.isNaN(utc.getTime())) throw new HttpError(422, "Invalid date.");
        return json({ engine: SWISS_INFO, points: positionsAt(utc.toISOString(), b.settings, b.reference) });
      }
      case "progressed":
        return json({ engine: SWISS_INFO, points: await progressedChart(b.birth, b.target, b.settings) });
      case "solar-arc":
        return json({ engine: SWISS_INFO, points: await solarArcChart(b.birth, b.target, b.settings) });
      case "elect": {
        const days = (Date.parse(b.to as string) - Date.parse(b.from as string)) / 86_400_000 + 1;
        if (days < 1 || days > 120) throw new HttpError(422, "Choose a range of up to 120 days.");
        if ((b.dailyFrom as string) > (b.dailyTo as string)) throw new HttpError(422, "The daily window should start before it ends.");
        const [h1, m1] = (b.dailyFrom as string).split(":").map(Number), [h2, m2] = (b.dailyTo as string).split(":").map(Number);
        const slots = days * (Math.floor((h2! * 60 + m2! - h1! * 60 - m1!) / (b.stepMin as number)) + 1);
        if (slots > 6000) throw new HttpError(422, "That’s a lot of moments to check. Shorten the range or the daily window, or check every 30 or 60 minutes.");
        return json({ engine: SWISS_INFO, windows: findElections(b as never) });
      }
      case "acg":
        return json({ engine: SWISS_INFO, acg: acgChart(b.birth, (b.settings as { bodies: never[] }).bodies) });
      case "return": {
        const r = await returnChart(b.birth, b.body, b.from, b.settings, b.place);
        return json({ engine: SWISS_INFO, points: r });
      }
      case "motion":
        return json({ engine: SWISS_INFO, motion: motionFrom(b.utc, b.settings) });
      case "rectify": {
        if (b.from > b.to) throw new HttpError(422, "The window’s end is before its start.");
        if (!(b.events as unknown[]).length && !(b.circumstances as unknown[] | undefined)?.length) throw new HttpError(422, "Add at least one life event or birth circumstance.");
        const out = rectify(b.birth, b.events, b.from, b.to, b.stepMin, b.settings, b.ascSigns, b.moonSigns, b.circumstances);
        if (!out.curve.length) throw new HttpError(422, "No time in this window has the chosen Moon and rising signs.");
        return json({ engine: SWISS_INFO, rectify: out });
      }
      case "stars": {
        const utc = new Date(b.utc as string);
        if (Number.isNaN(utc.getTime())) throw new HttpError(422, "Invalid date.");
        return json({ engine: SWISS_INFO, stars: fixedStarsAt(utc.toISOString(), FIXED_STARS.map((x) => x.name), (b.settings as { zodiac: never }).zodiac) });
      }
      case "asteroid-search":
        return json({ results: await searchAsteroids(b.q as string) });
      case "asteroids": {
        const utc = new Date(b.utc as string);
        if (Number.isNaN(utc.getTime())) throw new HttpError(422, "Invalid date.");
        return json({ source: "NASA JPL Horizons", asteroids: await asteroidPositions(b.list as never, utc.toISOString(), (b.settings as { zodiac: never }).zodiac) });
      }
      case "forecast":
        return json({ engine: SWISS_INFO, forecast: forecast(b.birth, b.settings, b.from, b.years, b.themes) });
      case "couple-forecast":
        return json({ engine: SWISS_INFO, forecast: coupleForecast(b.a, b.b, b.settings, b.from, b.years, b.themes) });
      case "rising":
        return json({ engine: SWISS_INFO, rising: risingSpans(b.birth, b.settings), moon: moonSpans(b.birth, b.settings), moonTable: moonTable(b.birth, b.settings) });
      case "davison":
        return json({ engine: SWISS_INFO, points: davisonChart(b.a, b.b, b.settings) });
      case "solar-return":
        return json({ engine: SWISS_INFO, points: await solarReturnChart(b.birth, b.year, b.settings, b.place) });
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof RangeError) throw new HttpError(422, e.message);
    throw e;
  }
  throw new HttpError(404, "Unknown calculation.");
});
