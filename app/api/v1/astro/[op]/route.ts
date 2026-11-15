import { z } from "zod";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { birthSchema, settingsSchema } from "@/lib/server/validation";
import { natalChart, positionsAt, progressedChart, solarArcChart, solarReturnChart } from "@/lib/server/astro";
import { SWISS_INFO } from "@/lib/server/swiss";
import { requirePremium } from "@/lib/server/plan";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const points = z.object({ cusps: z.array(z.number()).length(12), asc: z.number(), mc: z.number() });
const Bodies = {
  natal: z.object({ birth: birthSchema, settings: settingsSchema }),
  positions: z.object({ utc: z.string().max(40), settings: settingsSchema, reference: points.optional() }),
  progressed: z.object({ birth: birthSchema, target: date, settings: settingsSchema }),
  "solar-arc": z.object({ birth: birthSchema, target: date, settings: settingsSchema }),
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
