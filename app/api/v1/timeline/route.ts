import { z } from "zod";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { birthSchema, settingsSchema } from "@/lib/server/validation";
import { birthUtc, natalChart } from "@/lib/server/astro";
import { jdToUtc, lunationsBetween, SWISS_INFO, swissEphemeris } from "@/lib/server/swiss";
import { convergenceTimeline, TIMELINE_ASPECTS } from "@/lib/astro/timeline";
import { PLANET_IDS } from "@/lib/astro/meta";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const body = z.enum(PLANET_IDS as [string, ...string[]]);
const orb = z.number().min(0.1).max(15);
const schema = z.object({
  birth: birthSchema,
  settings: settingsSchema,
  from: date,
  to: date,
  options: z
    .object({
      transits: z.boolean(),
      progressions: z.boolean(),
      solarArcs: z.boolean(),
      lunations: z.boolean(),
      transitBodies: z.array(body).max(12),
      progressedBodies: z.array(body).max(12),
      aspects: z.array(z.enum(TIMELINE_ASPECTS.map((a) => a.id) as [string, ...string[]])).min(1).max(9),
      orbs: z.object({ transit: orb, directed: orb, lunation: orb, eclipse: orb }),
      transitOrbs: z.record(body, orb),
    })
    .partial()
    .strict()
    .optional(),
});

/** Convergence timeline (Swiss Ephemeris). Practitioners only. */
export const POST = handler(async (req: Request) => {
  await requireUser("owner");
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Invalid timeline request.", parsed.error.flatten());
  const { birth, settings, from, to, options } = parsed.data as z.infer<typeof schema> & { birth: never; settings: never; options: never };
  if (to < from) throw new HttpError(422, "The end date is before the start date.");
  try {
    const natal = natalChart(birth, settings);
    const known = (birth as { timeAccuracy: string }).timeAccuracy !== "unknown";
    // Swiss's own eclipse search labels the lunations (the timeline finds the lunations itself, in the chosen zodiac).
    const eclipses = lunationsBetween(`${from}T00:00:00Z`, new Date(Date.parse(`${to}T00:00:00Z`) + 2 * 86_400_000).toISOString())
      .filter((l) => l.eclipse)
      .map((l) => ({ utc: jdToUtc(l.jd), label: l.eclipse! }));
    const result = await convergenceTimeline({
      natal: {
        birthUtc: birthUtc(birth),
        bodies: natal.bodies.map((b) => ({ id: b.id, lon: b.lon })),
        ...(known ? { asc: natal.asc, mc: natal.mc, cusps: natal.cusps } : {}),
      },
      from,
      to,
      eph: swissEphemeris((settings as { zodiac: never }).zodiac),
      options,
      eclipses,
    });
    return json({ engine: SWISS_INFO, timeline: result });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof RangeError || (e instanceof Error && /date range|three years/i.test(e.message))) throw new HttpError(422, e.message);
    throw e;
  }
});
