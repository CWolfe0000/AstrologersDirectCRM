import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * "demo": seeded data stored in the browser (the clickable prototype).
 * "server": real accounts and the database.
 */
export const DATA_MODE: "demo" | "server" = process.env.NEXT_PUBLIC_DATA_MODE === "demo" ? "demo" : "server";

/** Date the seeded demonstration data is anchored to. */
export const SEED_DATE = "2026-11-14";

/**
 * "Today" for the interface. In demo mode it is fixed to the seed date so the
 * demonstration always looks the same; with real data it is the actual date.
 */
export const DEMO_TODAY = DATA_MODE === "demo" ? new Date(SEED_DATE + "T09:00:00") : new Date();

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
/** Local calendar date of a Date as YYYY-MM-DD. */
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** Local timestamp YYYY-MM-DDTHH:mm:ss (no zone), matching the stored record format. */
export function isoLocal(d: Date) {
  return `${isoDate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
const LOADED_AT = Date.now();
/** Current moment as a local timestamp. In demo mode the clock starts at the seed date and runs in real time. */
export function nowLocal() {
  return isoLocal(new Date(DEMO_TODAY.getTime() + (Date.now() - LOADED_AT)));
}
/** Today's date (YYYY-MM-DD) in the interface's sense of "today". */
export const TODAY = isoDate(DEMO_TODAY);
/** Date `n` days from today, YYYY-MM-DD. */
export function daysFromToday(n: number) {
  const d = new Date(DEMO_TODAY);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function d(v: string | Date) {
  return typeof v === "string" ? new Date(v.length === 10 ? v + "T12:00:00" : v) : v;
}

/** "Nov 14, 2026" */
export function fmtDate(v: string | Date) {
  const x = d(v);
  return `${MONTHS[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
}
/** "Nov 14" */
export function fmtShort(v: string | Date) {
  const x = d(v);
  return `${MONTHS[x.getMonth()]} ${x.getDate()}`;
}
/** "Saturday, November 14, 2026" */
export function fmtLong(v: string | Date) {
  const x = d(v);
  return `${DAYS_LONG[x.getDay()]}, ${MONTHS_LONG[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
}
/** "Sat, Nov 14" */
export function fmtDay(v: string | Date) {
  const x = d(v);
  return `${DAYS[x.getDay()]}, ${MONTHS[x.getMonth()]} ${x.getDate()}`;
}
/** "2:30 PM" */
export function fmtTime(v: string | Date) {
  const x = d(v);
  let h = x.getHours();
  const m = x.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}
/** "07:42" stored time → "7:42 AM" */
export function fmtClock(hhmm: string) {
  const [hs, ms] = hhmm.split(":");
  let h = parseInt(hs, 10);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${ms} ${ap}`;
}
export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m >= 60) return `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
export function monthName(i: number, long = false) {
  return long ? MONTHS_LONG[i] : MONTHS[i];
}
export function dayName(i: number, long = false) {
  return long ? DAYS_LONG[i] : DAYS[i];
}

export function sameDay(a: string | Date, b: string | Date) {
  const x = d(a), y = d(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** Whole-day difference b - a (positive if b later). */
export function dayDiff(a: string | Date, b: string | Date) {
  const x = d(a), y = d(b);
  const ux = Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const uy = Date.UTC(y.getFullYear(), y.getMonth(), y.getDate());
  return Math.round((uy - ux) / 86400000);
}

/** "Today", "Yesterday", "3 days ago", "in 2 days", or a date. */
export function relDay(v: string | Date, now: Date = DEMO_TODAY) {
  const n = dayDiff(now, v);
  if (n === 0) return "Today";
  if (n === -1) return "Yesterday";
  if (n === 1) return "Tomorrow";
  if (n < 0 && n > -7) return `${-n} days ago`;
  if (n > 0 && n < 7) return `In ${n} days`;
  return fmtDate(v);
}

/** Relative time incl. hours for activity feeds. */
export function relTime(v: string | Date, now: Date = DEMO_TODAY) {
  const x = d(v);
  const mins = Math.round((now.getTime() - x.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24 && sameDay(x, now)) return `${Math.round(mins / 60)}h ago`;
  return relDay(x, now);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function pluralize(n: number, word: string, plural?: string) {
  return `${n} ${n === 1 ? word : plural ?? word + "s"}`;
}

export function isoAt(base: Date, dayOffset: number, hh = 9, mm = 0) {
  const x = new Date(base);
  x.setDate(x.getDate() + dayOffset);
  x.setHours(hh, mm, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(hh)}:${pad(mm)}:00`;
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
