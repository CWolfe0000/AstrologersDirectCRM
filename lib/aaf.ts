/**
 * AAF — the Astrological Exchange Format used by Solar Fire, Astrodienst and
 * others. Each chart is two lines:
 *   #A93:Surname,First name,sex,14.3.1879g,11:30,Ulm,D
 *   #B93:2407422.97917,48n24,10e00,…
 * #A93 holds the name and the local date, time and place; #B93 the Julian day
 * (Universal Time) and the coordinates. When #B93 is present its moment is
 * used, so historical time zones and local mean time come through exactly.
 */
import tzlookup from "tz-lookup";

export interface AafChart {
  first: string;
  last: string;
  /** Local date and time in the birthplace's IANA zone (time null when unknown). */
  date: string;
  time: string | null;
  place: string;
  lat: number;
  lon: number;
  tz: string;
  /** Something the importer should double-check. */
  note?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "48n24", "122w41", "48n24:30", "48.4" → signed degrees. */
export function parseAafCoord(v: string): number | null {
  const s = v.trim().toLowerCase();
  const m = s.match(/^(\d{1,3})([nsew])(\d{1,2})(?:[:'](\d{1,2}))?$/);
  if (m) {
    const deg = Number(m[1]) + Number(m[3]) / 60 + Number(m[4] ?? 0) / 3600;
    return m[2] === "s" || m[2] === "w" ? -deg : deg;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Local wall time of a UTC instant in an IANA zone. */
function localParts(ms: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  // Julian days in files are rounded (5–6 decimals ≈ a second): round to the nearest minute.
  const p = Object.fromEntries(f.formatToParts(new Date(Math.round(ms / 60_000) * 60_000)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function isAaf(text: string) {
  return /^\s*#A93:/m.test(text);
}

export function parseAaf(text: string): { charts: AafChart[]; problems: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const charts: AafChart[] = [];
  const problems: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]!.startsWith("#A93:")) continue;
    const a = lines[i]!.slice(5).split(",").map((x) => x.trim());
    const bLine = lines.slice(i + 1, i + 4).find((l) => l.startsWith("#B93:"));
    const b = bLine ? bLine.slice(5).split(",").map((x) => x.trim()) : [];
    const [surname = "", first = "", , dateRaw = "", timeRaw = "", place = "", country = ""] = a;
    const name = first && first !== "*" ? first : surname;
    const last = first && first !== "*" && surname !== "*" ? surname : "";
    const label = `${name} ${last}`.trim() || `Chart ${charts.length + 1}`;
    const lat = b[1] ? parseAafCoord(b[1]) : null;
    const lon = b[2] ? parseAafCoord(b[2]) : null;
    if (lat === null || lon === null) {
      problems.push(`${label}: no coordinates (the #B93 line is missing or unreadable).`);
      continue;
    }
    let tz: string;
    try {
      tz = tzlookup(lat, lon);
    } catch {
      problems.push(`${label}: couldn’t find a time zone for ${lat.toFixed(2)}, ${lon.toFixed(2)}.`);
      continue;
    }
    const dm = dateRaw.match(/^(\d{1,2})\.(\d{1,2})\.(-?\d{1,4})([gj]?)$/i);
    if (!dm) {
      problems.push(`${label}: can’t read the date “${dateRaw}”.`);
      continue;
    }
    const julianCal = dm[4]!.toLowerCase() === "j";
    const unknownTime = !timeRaw || timeRaw === "*";
    const jd = b[0] && b[0] !== "*" ? Number(b[0]) : NaN;
    let date = `${dm[3]!.padStart(4, "0")}-${pad(Number(dm[2]))}-${pad(Number(dm[1]))}`;
    let time: string | null = unknownTime ? null : (timeRaw.match(/^(\d{1,2}):(\d{2})/) ? `${pad(Number(timeRaw.split(":")[0]))}:${timeRaw.split(":")[1]!.slice(0, 2)}` : null);
    let note: string | undefined;
    if (Number.isFinite(jd) && !unknownTime) {
      // The Julian day is the exact moment: express it as local time under the zone's rules.
      const local = localParts((jd - 2440587.5) * 86_400_000, tz);
      if (local.date !== date || local.time !== time) note = `Local time adjusted from ${dm[1]}.${dm[2]}.${dm[3]} ${timeRaw} to keep the exact moment from the file.`;
      date = local.date;
      time = local.time;
    }
    if (julianCal) note = [note, "The file marks this date as Julian calendar; check it."].filter(Boolean).join(" ");
    const y = Number(date.slice(0, 4));
    if (y < 1000 || y > 2100) {
      problems.push(`${label}: the year ${y} is outside the supported range.`);
      continue;
    }
    charts.push({ first: name || "Unnamed", last, date, time, place: [place, country].filter((x) => x && x !== "*").join(", "), lat, lon, tz, note });
  }
  return { charts, problems };
}

/** As a table the CSV importer understands (ISO dates, decimal coordinates, IANA zones). */
export function aafToTable(charts: AafChart[]): string[][] {
  return [
    ["First name", "Last name", "Birth date", "Birth time", "Birth place", "Latitude", "Longitude", "Time zone", "Notes"],
    ...charts.map((c) => [c.first, c.last, c.date, c.time ?? "", c.place, String(c.lat), String(c.lon), c.tz, c.note ?? ""]),
  ];
}
