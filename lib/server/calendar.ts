import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { getSettings, listCollection } from "./records";
import { ianaZone, zonedToUtc } from "@/lib/timezones";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
/** RFC 5545 line folding (75 octets). */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 74) {
      out.push(cur);
      cur = " " + ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

/**
 * The practitioner's consultations as an iCalendar feed. Deliberately sparse:
 * client first name + last initial, type, location and time. No notes, birth
 * data or email addresses ever go into the feed.
 */
export async function practiceCalendar(practiceId: string) {
  const [consultations, people, settings] = await Promise.all([
    listCollection(practiceId, "consultations"),
    listCollection(practiceId, "people"),
    getSettings(practiceId),
  ]);
  const p = (settings?.practitioner ?? {}) as { practice?: string; timezone?: string };
  const zone = ianaZone(p.timezone);
  const cutoff = Date.now() - 90 * 86_400_000;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AstrologersDirect//Consultations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${p.practice ?? "AstrologersDirect"} — consultations`)}`,
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];
  const now = stamp(new Date());
  for (const k of consultations) {
    const start = zonedToUtc(String(k.start), zone);
    if (start.getTime() < cutoff || k.status === "no-show") continue;
    const end = new Date(start.getTime() + Number(k.durationMin ?? 60) * 60_000);
    const person = people.find((x) => x.id === k.clientId);
    const who = person ? `${person.firstName} ${String(person.lastName ?? "").slice(0, 1)}${person.lastName ? "." : ""}` : "Client";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${k.id}@astrologersdirect`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      fold(`SUMMARY:${esc(`${who} — ${k.type}`)}`),
      `LOCATION:${esc(String(k.location ?? ""))}`,
      `STATUS:${k.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export async function feedPracticeId(tokenHash: string) {
  const [row] = await db().select().from(schema.calendarFeeds).where(eq(schema.calendarFeeds.tokenHash, tokenHash));
  return row?.practiceId ?? null;
}
