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
}

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
  { id: "loss", label: "Death of a Loved One", rectify: "other" },
  { id: "parent", label: "Death or Illness of a Parent", rectify: "parent" },
  { id: "move", label: "Move or Change of Home", rectify: "move" },
  { id: "long-move", label: "Long-Distance Move or Emigration", rectify: "long-move" },
  { id: "career", label: "Career Change, Promotion or New Job", rectify: "career" },
  { id: "job-loss", label: "Job Loss or Business Ending", rectify: "career" },
  { id: "education", label: "Education or Graduation", rectify: "career" },
  { id: "health", label: "Accident, Surgery or Illness", rectify: "health" },
  { id: "finance", label: "Major Financial Change", rectify: "other" },
  { id: "legal", label: "Legal Issue, Lawsuit or Court Case", rectify: "legal" },
  { id: "incarceration", label: "Incarceration or Confinement", rectify: "incarceration" },
  { id: "spiritual", label: "Spiritual or Personal Turning Point", rectify: "other" },
  { id: "other", label: "Other Major Event", rectify: "other" },
] as const;

export const lifeEventLabel = (type: string) => LIFE_EVENT_TYPES.find((t) => t.id === type)?.label ?? "Other Major Event";
export const rectifyType = (type: string) => LIFE_EVENT_TYPES.find((t) => t.id === type)?.rectify ?? "other";

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
