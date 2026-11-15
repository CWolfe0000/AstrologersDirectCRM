/** RFC 4180 CSV parsing with delimiter detection (comma, semicolon, tab) and BOM handling. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  const delim = counts.sort((a, b) => b[1] - a[1])[0]![1] > 0 ? counts[0]![0] : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === "") quoted = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

export type ImportField =
  | "fullName" | "firstName" | "lastName" | "email" | "phone" | "birthDate" | "birthTime"
  | "birthPlace" | "latitude" | "longitude" | "timezone" | "tags" | "notes";

export const IMPORT_FIELDS: { id: ImportField; label: string; synonyms: string[] }[] = [
  { id: "fullName", label: "Full name", synonyms: ["name", "full name", "client", "client name", "contact"] },
  { id: "firstName", label: "First name", synonyms: ["first name", "first", "given name", "forename", "firstname"] },
  { id: "lastName", label: "Last name", synonyms: ["last name", "last", "surname", "family name", "lastname"] },
  { id: "email", label: "Email", synonyms: ["email", "e-mail", "email address", "mail"] },
  { id: "phone", label: "Phone", synonyms: ["phone", "telephone", "mobile", "cell", "phone number"] },
  { id: "birthDate", label: "Birth date", synonyms: ["birth date", "date of birth", "dob", "birthday", "birthdate", "date"] },
  { id: "birthTime", label: "Birth time", synonyms: ["birth time", "time of birth", "time", "tob", "birthtime"] },
  { id: "birthPlace", label: "Birth place", synonyms: ["birth place", "place of birth", "birthplace", "place", "city", "location", "pob"] },
  { id: "latitude", label: "Latitude", synonyms: ["latitude", "lat"] },
  { id: "longitude", label: "Longitude", synonyms: ["longitude", "lon", "lng", "long"] },
  { id: "timezone", label: "Time zone", synonyms: ["time zone", "timezone", "tz", "zone"] },
  { id: "tags", label: "Tags", synonyms: ["tags", "labels", "category", "categories"] },
  { id: "notes", label: "Notes", synonyms: ["notes", "note", "comments", "summary"] },
];

const norm = (s: string) => s.toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();

/** Best guess at which column holds each field. */
export function guessMapping(headers: string[]): Partial<Record<ImportField, number>> {
  const out: Partial<Record<ImportField, number>> = {};
  const used = new Set<number>();
  for (const f of IMPORT_FIELDS) {
    const i = headers.findIndex((h, idx) => !used.has(idx) && f.synonyms.some((syn) => norm(syn) === norm(h)));
    if (i >= 0) {
      out[f.id] = i;
      used.add(i);
    }
  }
  return out;
}

/** Dates: ISO (YYYY-MM-DD) always; slashed/dotted dates read as US (M/D/Y) or international (D/M/Y). */
export function parseDate(v: string, order: "us" | "intl"): string | null {
  const s = v.trim();
  let y: number, m: number, d: number;
  let mm = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (mm) [y, m, d] = [Number(mm[1]), Number(mm[2]), Number(mm[3])];
  else if ((mm = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) {
    const a = Number(mm[1]), b = Number(mm[2]);
    y = Number(mm[3]);
    [m, d] = order === "us" ? [a, b] : [b, a];
  } else {
    const t = Date.parse(s);
    if (Number.isNaN(t) || !/[a-z]/i.test(s)) return null;
    const dt = new Date(t);
    [y, m, d] = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d || y < 1000 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Times: 14:05, 14:05:30, 2:05 pm, 2pm, 1405. */
export function parseTime(v: string): string | null {
  const s = v.trim().toLowerCase().replace(/\./g, "");
  let mm = s.match(/^(\d{1,2})(?::?(\d{2}))?(?::\d{2})?\s*(am|pm|a|p)?$/);
  if (!mm) return null;
  let h = Number(mm[1]);
  const mi = Number(mm[2] ?? 0);
  const ap = mm[3];
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap.startsWith("p") && h !== 12) h += 12;
    if (ap.startsWith("a") && h === 12) h = 0;
  }
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export function parseCoord(v: string, kind: "lat" | "lon"): number | null {
  const s = v.trim().toUpperCase();
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*([NSEW])?$/);
  if (!m) return null;
  let n = Number(m[1]);
  if (m[2] === "S" || m[2] === "W") n = -Math.abs(n);
  const max = kind === "lat" ? 90 : 180;
  return Math.abs(n) <= max ? n : null;
}
