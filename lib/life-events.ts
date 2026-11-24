/**
 * Life events: what clients (or astrologers) record about a life, for the
 * timeline and for rectification. An event has one date (a marriage, a death
 * in the family) or a start and end date (a period: living somewhere, a job,
 * a relationship). Dates can be marked approximate ("sometime that month").
 */
export interface LifeEvent {
  id: string;
  /** YYYY-MM-DD: the date, or the start of a period. */
  date: string;
  /** YYYY-MM-DD: the end of a period. */
  end?: string;
  /** A period that's still going (no end yet). */
  ongoing?: boolean;
  /** The client only knows the month (or roughly when). */
  approx?: boolean;
  type: string;
  note?: string;
  /** Who added it: the client in an intake form, or the astrologer. */
  source?: "client" | "astrologer";
  /** For rectification: how hard it hit (the astrologer's judgment; otherwise the usual for its type). */
  impact?: Impact;
}

/** How hard an event hit. Mirrors IMPACT in lib/server/rectify.ts. */
export type Impact = "major" | "significant" | "milestone";
export const IMPACTS: { id: Impact; label: string }[] = [
  { id: "major", label: "Major Loss or Crisis" },
  { id: "significant", label: "Significant" },
  { id: "milestone", label: "Milestone" },
];

/**
 * Categories clients choose from. `rectify` is the rectification event type
 * whose angle weights apply (see lib/server/rectify.ts); categories without
 * a clear angle are scored as "other".
 */
export const LIFE_EVENT_TYPES = [
  { id: "marriage", label: "Marriage or Committed Partnership", rectify: "marriage" },
  { id: "relationship", label: "Relationship Began", rectify: "marriage" },
  { id: "separation", label: "Separation or Divorce", rectify: "separation" },
  { id: "child", label: "Birth of a Child", rectify: "child" },
  { id: "loss", label: "Death of a Loved One", rectify: "loss" },
  { id: "parent", label: "Death or Illness of a Parent", rectify: "parent" },
  { id: "move", label: "Move or Change of Home", rectify: "move" },
  { id: "long-move", label: "Long-Distance Move or Emigration", rectify: "long-move" },
  { id: "career", label: "Career Change, Promotion or New Job", rectify: "career" },
  { id: "job-loss", label: "Job Loss or Business Ending", rectify: "job-loss" },
  { id: "education", label: "Education or Graduation", rectify: "career" },
  { id: "health", label: "Accident, Surgery or Illness", rectify: "health" },
  { id: "finance", label: "Major Financial Change", rectify: "finance" },
  { id: "crime", label: "Victim of Crime, Abuse or Arrest", rectify: "crime" },
  { id: "honors", label: "Honors, Award or Recognition", rectify: "honors" },
  { id: "retirement", label: "Retirement", rectify: "retirement" },
  { id: "legal", label: "Legal Issue, Lawsuit or Court Case", rectify: "legal" },
  { id: "incarceration", label: "Incarceration or Confinement", rectify: "incarceration" },
  { id: "spiritual", label: "Spiritual or Personal Turning Point", rectify: "other" },
  { id: "other", label: "Other Major Event", rectify: "other" },
] as const;

export const lifeEventLabel = (type: string) => LIFE_EVENT_TYPES.find((t) => t.id === type)?.label ?? "Other Major Event";
export const rectifyType = (type: string) => LIFE_EVENT_TYPES.find((t) => t.id === type)?.rectify ?? "other";

/** The usual impact of each kind of event (after Tebbs: losses and crises show most clearly). Mirrors DEFAULT_IMPACT on the server. */
const USUAL_IMPACT: Record<string, Impact> = {
  marriage: "milestone", separation: "major", child: "milestone", career: "milestone", move: "milestone", "long-move": "significant",
  parent: "major", health: "major", legal: "significant", incarceration: "major", loss: "major", "job-loss": "significant",
  finance: "significant", crime: "major", honors: "milestone", retirement: "milestone", other: "significant",
};
export const usualImpact = (type: string): Impact => USUAL_IMPACT[rectifyType(type)] ?? "significant";

/**
 * How far a rectification can be trusted from its events (Tebbs: a dozen or
 * more, 20 better, mostly the hard ones).
 */
export function rectifyReliability(events: Pick<LifeEvent, "type" | "impact">[]) {
  const n = events.length;
  const major = events.filter((e) => (e.impact ?? usualImpact(e.type)) === "major").length;
  if (n < 6) return { level: "Weak" as const, n, major, advice: `${n} event${n === 1 ? "" : "s"}. Aim for a dozen or more, with several hard ones (losses, accidents, divorce): they show most clearly.` };
  if (n < 12 || major < 3) return { level: "Fair" as const, n, major, advice: `${n} events, ${major} major. A dozen or more, with at least three major losses or crises, makes the result firmer.` };
  return { level: n >= 20 && major >= 5 ? ("Strong" as const) : ("Good" as const), n, major, advice: `${n} events, ${major} major.${n < 20 ? " Twenty or more is better still." : ""}` };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const one = (d: string, approx?: boolean) => {
  const [y, m, day] = d.split("-").map(Number) as [number, number, number];
  return approx ? `${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${day}, ${y}`;
};
/** "Jun 14, 2019", "Jun 2019 (approximate)", "Mar 2020 – Aug 2023", "Mar 2020 – Present". */
export function lifeEventWhen(e: Pick<LifeEvent, "date" | "end" | "approx" | "ongoing">, ongoing = !!e.ongoing) {
  const start = one(e.date, e.approx);
  if (e.end) return `${start} – ${one(e.end, e.approx)}`;
  if (ongoing) return `${start} – Present`;
  return e.approx ? `${start} (Approximate)` : start;
}
