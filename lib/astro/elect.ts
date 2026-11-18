/**
 * Electional astrology: scoring a moment for beginning something, by
 * traditional elective rules (after Bonatti, Lilly and the medieval tradition),
 * optionally with the client's natal chart. Each rule passes or fails with a
 * weight; a void-of-course Moon rules a moment out. The astrologer chooses
 * which rules apply; the scores rank candidate times, they don't decide.
 */
import type { BodyId, ChartPoints, SignId } from "./types";
import { moonNextAspect } from "./horary";

export type ElectionEvent = "general" | "contract" | "relationship" | "launch" | "travel" | "move";
export type ElectionCheck =
  | "moon-voc" | "via-combusta" | "moon-waxing" | "moon-benefic" | "moon-malefic"
  | "mercury-direct" | "mercury-combust" | "venus-direct" | "benefic-angular" | "malefic-angular"
  | "asc-ruler" | "seventh-malefic" | "fourth-malefic" | "eclipse" | "natal-support" | "natal-stress";

type Ctx = { natal?: ChartPoints; eclipseNear?: string | null };
type Rule = { label: string; pass: number; fail: number; required?: boolean; natal?: boolean; test: (p: ChartPoints, ctx: Ctx) => { ok: boolean; detail: string } };

const norm = (x: number) => ((x % 360) + 360) % 360;
const sep = (a: number, b: number) => {
  const d = norm(a - b);
  return d > 180 ? 360 - d : d;
};
const SIGNS: SignId[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const TRAD_RULER: Record<SignId, BodyId> = {
  aries: "mars", taurus: "venus", gemini: "mercury", cancer: "moon", leo: "sun", virgo: "mercury",
  libra: "venus", scorpio: "mars", sagittarius: "jupiter", capricorn: "saturn", aquarius: "saturn", pisces: "jupiter",
};
const NAME: Partial<Record<BodyId, string>> = { sun: "the Sun", moon: "the Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", asc: "the Ascendant" };
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const body = (p: ChartPoints, id: BodyId) => p.bodies.find((b) => b.id === id);
const angular = (h: number) => h === 1 || h === 4 || h === 7 || h === 10;
const HARD = new Set(["conjunction", "square", "opposition"]);

export const ELECTION_CHECKS: Record<ElectionCheck, Rule> = {
  "moon-voc": {
    label: "Moon not void of course",
    pass: 2, fail: 0, required: true,
    test: (p) => {
      const n = moonNextAspect(p);
      return n ? { ok: true, detail: `Next aspect: ${n.aspect} ${NAME[n.body]}.` } : { ok: false, detail: "The Moon makes no further aspect before leaving its sign." };
    },
  },
  "via-combusta": {
    label: "Moon out of the Via Combusta",
    pass: 1, fail: -3,
    test: (p) => {
      const m = norm(body(p, "moon")?.lon ?? 0);
      return m >= 195 && m < 225 ? { ok: false, detail: "The Moon is between 15° Libra and 15° Scorpio." } : { ok: true, detail: "The Moon is clear of 15° Libra–15° Scorpio." };
    },
  },
  "moon-waxing": {
    label: "Moon waxing",
    pass: 2, fail: -1,
    test: (p) => {
      const e = norm((body(p, "moon")?.lon ?? 0) - (body(p, "sun")?.lon ?? 0));
      return e > 0 && e < 180 ? { ok: true, detail: "Increasing in light." } : { ok: false, detail: "Decreasing in light." };
    },
  },
  "moon-benefic": {
    label: "Moon applying to a benefic",
    pass: 3, fail: 0,
    test: (p) => {
      const n = moonNextAspect(p);
      return n && (n.body === "venus" || n.body === "jupiter") ? { ok: true, detail: `${cap(n.aspect)} ${NAME[n.body]} next.` } : { ok: false, detail: "The Moon’s next aspect isn’t to Venus or Jupiter." };
    },
  },
  "moon-malefic": {
    label: "Moon not applying to a malefic",
    pass: 1, fail: -3,
    test: (p) => {
      const n = moonNextAspect(p);
      return n && (n.body === "mars" || n.body === "saturn") && HARD.has(n.aspect) ? { ok: false, detail: `${cap(n.aspect)} ${NAME[n.body]} next.` } : { ok: true, detail: "No hard aspect to Mars or Saturn next." };
    },
  },
  "mercury-direct": {
    label: "Mercury direct",
    pass: 1, fail: -3,
    test: (p) => ((body(p, "mercury")?.speed ?? 1) >= 0 ? { ok: true, detail: "Mercury is direct." } : { ok: false, detail: "Mercury is retrograde." }),
  },
  "mercury-combust": {
    label: "Mercury not combust",
    pass: 0, fail: -2,
    test: (p) => {
      const d = sep(body(p, "mercury")?.lon ?? 0, body(p, "sun")?.lon ?? 180);
      return d > 8.5 ? { ok: true, detail: `${Math.round(d)}° from the Sun.` } : { ok: false, detail: `Within ${d.toFixed(1)}° of the Sun.` };
    },
  },
  "venus-direct": {
    label: "Venus direct",
    pass: 1, fail: -3,
    test: (p) => ((body(p, "venus")?.speed ?? 1) >= 0 ? { ok: true, detail: "Venus is direct." } : { ok: false, detail: "Venus is retrograde." }),
  },
  "benefic-angular": {
    label: "A benefic in the 1st or 10th",
    pass: 3, fail: 0,
    test: (p) => {
      const b = (["venus", "jupiter"] as BodyId[]).map((id) => body(p, id)).find((x) => x && (x.house === 1 || x.house === 10));
      return b ? { ok: true, detail: `${cap(NAME[b.id]!)} in the ${b.house === 1 ? "1st" : "10th"}.` } : { ok: false, detail: "Neither Venus nor Jupiter is in the 1st or 10th." };
    },
  },
  "malefic-angular": {
    label: "Malefics off the angles",
    pass: 1, fail: -3,
    test: (p) => {
      const b = (["mars", "saturn"] as BodyId[]).map((id) => body(p, id)).find((x) => x && angular(x.house));
      return b ? { ok: false, detail: `${cap(NAME[b.id]!)} in the ${b.house}${b.house === 1 ? "st" : "th"} house.` } : { ok: true, detail: "Mars and Saturn are off the angles." };
    },
  },
  "asc-ruler": {
    label: "Ascendant ruler well placed",
    pass: 2, fail: -2,
    test: (p) => {
      const sign = SIGNS[Math.floor(norm(p.asc) / 30)]!;
      const r = body(p, TRAD_RULER[sign]);
      if (!r) return { ok: true, detail: "" };
      const bad = r.speed < 0 ? "retrograde" : [6, 8, 12].includes(r.house) ? `in the ${r.house}th house` : null;
      return bad ? { ok: false, detail: `${cap(NAME[r.id]!)}, ruling the Ascendant, is ${bad}.` } : { ok: true, detail: `${cap(NAME[r.id]!)}, ruling the Ascendant, is direct and in the ${r.house}${r.house === 1 ? "st" : r.house === 2 ? "nd" : r.house === 3 ? "rd" : "th"}.` };
    },
  },
  "seventh-malefic": {
    label: "No malefic in the 7th",
    pass: 1, fail: -3,
    test: (p) => {
      const b = (["mars", "saturn"] as BodyId[]).map((id) => body(p, id)).find((x) => x?.house === 7);
      return b ? { ok: false, detail: `${cap(NAME[b.id]!)} in the 7th house of partners.` } : { ok: true, detail: "The 7th is free of Mars and Saturn." };
    },
  },
  "fourth-malefic": {
    label: "No malefic in the 4th",
    pass: 1, fail: -3,
    test: (p) => {
      const b = (["mars", "saturn"] as BodyId[]).map((id) => body(p, id)).find((x) => x?.house === 4);
      return b ? { ok: false, detail: `${cap(NAME[b.id]!)} in the 4th house of home.` } : { ok: true, detail: "The 4th is free of Mars and Saturn." };
    },
  },
  eclipse: {
    label: "Clear of eclipses",
    pass: 0, fail: -4,
    test: (_p, ctx) => (ctx.eclipseNear ? { ok: false, detail: `Within 3 days of a ${ctx.eclipseNear}.` } : { ok: true, detail: "No eclipse within 3 days." }),
  },
  "natal-support": {
    label: "Supports the client’s chart",
    pass: 3, fail: 0, natal: true,
    test: (p, ctx) => {
      const hit = contact(p, ctx.natal, ["asc", "moon"], ["sun", "moon", "asc", "venus", "jupiter"], ["conjunction", "trine", "sextile"]);
      return hit ? { ok: true, detail: hit } : { ok: false, detail: "No close trine, sextile or conjunction to the client’s Sun, Moon, Ascendant or benefics." };
    },
  },
  "natal-stress": {
    label: "No stress to the client’s chart",
    pass: 1, fail: -3, natal: true,
    test: (p, ctx) => {
      const hit = contact(p, ctx.natal, ["asc", "moon"], ["mars", "saturn"], ["conjunction", "square", "opposition"]);
      return hit ? { ok: false, detail: hit } : { ok: true, detail: "No hard contact to the client’s Mars or Saturn." };
    },
  },
};

const ANG: Record<string, number> = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };
/** The first contact (within 3°) from the elected chart's points to the natal points. */
function contact(p: ChartPoints, natal: ChartPoints | undefined, from: BodyId[], to: BodyId[], aspects: string[]) {
  if (!natal) return null;
  const lonOf = (c: ChartPoints, id: BodyId) => (id === "asc" ? c.asc : body(c, id)?.lon);
  for (const f of from)
    for (const t of to) {
      const a = lonOf(p, f), b = lonOf(natal, t);
      if (a === undefined || b === undefined) continue;
      for (const asp of aspects)
        if (Math.abs(sep(a, b) - ANG[asp]!) <= 3) return `Elected ${NAME[f]!.replace("the ", "")} ${asp} natal ${NAME[t]!.replace("the ", "")}.`;
    }
  return null;
}

export const ELECTION_EVENTS: { id: ElectionEvent; name: string; hint: string; checks: ElectionCheck[] }[] = [
  { id: "general", name: "General", hint: "Any new beginning.", checks: ["moon-voc", "via-combusta", "moon-waxing", "moon-benefic", "moon-malefic", "benefic-angular", "malefic-angular", "asc-ruler", "eclipse"] },
  { id: "contract", name: "Signing & Contracts", hint: "Agreements, applications, important messages.", checks: ["moon-voc", "via-combusta", "moon-waxing", "moon-benefic", "moon-malefic", "mercury-direct", "mercury-combust", "malefic-angular", "asc-ruler", "eclipse"] },
  { id: "relationship", name: "Relationship & Wedding", hint: "Engagements, weddings, commitments.", checks: ["moon-voc", "via-combusta", "moon-waxing", "moon-benefic", "moon-malefic", "venus-direct", "seventh-malefic", "benefic-angular", "asc-ruler", "eclipse"] },
  { id: "launch", name: "Business Launch", hint: "Opening, launching, first sale.", checks: ["moon-voc", "via-combusta", "moon-waxing", "moon-benefic", "moon-malefic", "mercury-direct", "benefic-angular", "malefic-angular", "asc-ruler", "eclipse"] },
  { id: "travel", name: "Travel", hint: "Setting out on a journey.", checks: ["moon-voc", "via-combusta", "moon-benefic", "moon-malefic", "mercury-direct", "malefic-angular", "asc-ruler", "eclipse"] },
  { id: "move", name: "Moving Home", hint: "Moving in, buying or signing for a home.", checks: ["moon-voc", "via-combusta", "moon-waxing", "moon-benefic", "moon-malefic", "fourth-malefic", "malefic-angular", "asc-ruler", "eclipse"] },
];

export type ElectionResult = { id: ElectionCheck; label: string; ok: boolean; detail: string; required: boolean };

/** Score a moment. `percent` is 0–100 across the chosen rules; `excluded` when a required rule fails. */
export function scoreElection(p: ChartPoints, checks: ElectionCheck[], ctx: Ctx = {}) {
  let score = 0, min = 0, max = 0, excluded = false;
  const results: ElectionResult[] = [];
  for (const id of checks) {
    const rule = ELECTION_CHECKS[id];
    if (!rule || (rule.natal && !ctx.natal)) continue;
    const { ok, detail } = rule.test(p, ctx);
    score += ok ? rule.pass : rule.fail;
    min += Math.min(rule.pass, rule.fail);
    max += Math.max(rule.pass, rule.fail);
    if (!ok && rule.required) excluded = true;
    results.push({ id, label: rule.label, ok, detail, required: !!rule.required });
  }
  const percent = max > min ? Math.round(((score - min) / (max - min)) * 100) : 100;
  return { score, percent: excluded ? 0 : percent, excluded, results };
}
