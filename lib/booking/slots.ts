import { zonedToUtc } from "@/lib/timezones";
import type { BookingRules, Day } from "./types";

const DAY_KEYS: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Today's date in a time zone. */
export function localDate(ms: number, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

/**
 * Bookable start times (UTC ISO) for a session of `durationMin`, from the
 * astrologer's weekly hours (in their time zone `tz`), leaving `bufferMin`
 * clear around existing sessions (`busy`, epoch ms), after the minimum notice
 * and within the booking window.
 */
export function availableSlots(opts: { rules: BookingRules; tz: string; durationMin: number; busy: { start: number; end: number }[]; now: number; days?: number }) {
  const { rules, tz, durationMin, busy, now } = opts;
  const earliest = now + rules.minNoticeHours * 3_600_000;
  const latest = now + rules.maxAdvanceDays * 86_400_000;
  const buffer = rules.bufferMin * 60_000;
  const out: string[] = [];
  const first = localDate(now, tz);
  const n = Math.min(opts.days ?? rules.maxAdvanceDays + 1, rules.maxAdvanceDays + 1);
  for (let i = 0; i <= n; i++) {
    const day = addDays(first, i);
    const key = DAY_KEYS[new Date(`${day}T12:00:00Z`).getUTCDay()]!;
    for (const r of rules.weekly[key] ?? []) {
      for (let m = toMin(r.start); m + durationMin <= toMin(r.end); m += rules.stepMin) {
        const start = zonedToUtc(`${day}T${hhmm(m)}:00`, tz).getTime();
        const end = start + durationMin * 60_000;
        if (start < earliest || start > latest) continue;
        if (busy.some((b) => start < b.end + buffer && end > b.start - buffer)) continue;
        out.push(new Date(start).toISOString());
      }
    }
  }
  return [...new Set(out)].sort();
}
