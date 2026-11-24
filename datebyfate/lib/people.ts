import { z } from "zod";
import type { Birth } from "./astro/types";

export type PersonKind = "self" | "ex" | "match";

export interface PersonData {
  name: string;
  birth: Birth;
  /** The relationship: the day you met, the day it began and, for a past partner, the day it ended (YYYY-MM-DD). */
  metDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  /** Kept for records saved before full dates were asked for; filled from the dates when they are given. */
  startYear?: number | null;
  endYear?: number | null;
  stayedFriends?: boolean | null;
  children?: boolean | null;
  livedTogether?: boolean | null;
  married?: boolean | null;
  /** Who ended it. */
  ending?: "me" | "them" | "mutual" | null;
  /** Where the two of you first met in person: the relationship’s chart is cast for this place. */
  met?: Home | null;
  /** The member only: where they live now, for planetary hours. */
  home?: Home | null;
}

export type Home = Pick<Birth, "place" | "lat" | "lon" | "tz">;

export interface Person extends PersonData {
  id: string;
  kind: PersonKind;
}

const validZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const birthSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a birth date.")
    .refine((d) => {
      const t = Date.parse(d + "T00:00:00Z");
      return !Number.isNaN(t) && t > Date.parse("1900-01-01") && t < Date.now() && new Date(t).toISOString().slice(0, 10) === d;
    }, "Enter a real date between 1900 and today."),
  time: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.null()]),
  place: z.string().trim().min(1, "Choose a birthplace from the list.").max(160),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tz: z.string().max(64).refine(validZone, "Choose a birthplace from the list."),
});

const year = z.number().int().min(1940).max(new Date().getFullYear());
const pastDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => {
    const t = Date.parse(d + "T00:00:00Z");
    return !Number.isNaN(t) && t > Date.parse("1940-01-01") && t <= Date.now() && new Date(t).toISOString().slice(0, 10) === d;
  }, "Enter a real date, not in the future.")
  .nullish();
const yesNo = z.boolean().nullish();
export const personSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name or nickname.").max(60),
    birth: birthSchema,
    metDate: pastDate,
    startDate: pastDate,
    endDate: pastDate,
    startYear: year.nullish(),
    endYear: year.nullish(),
    stayedFriends: yesNo,
    children: yesNo,
    livedTogether: yesNo,
    married: yesNo,
    ending: z.enum(["me", "them", "mutual"]).nullish(),
    met: birthSchema.pick({ place: true, lat: true, lon: true, tz: true }).nullish(),
  })
  .refine((p) => !p.startDate || !p.endDate || p.endDate >= p.startDate, { message: "The end date is before the date it began.", path: ["endDate"] })
  .refine((p) => !p.metDate || !p.startDate || p.startDate >= p.metDate, { message: "The date it began is before the date you met.", path: ["startDate"] });

/** Reads the fields of the person form (components/person-form.tsx). */
export function personFromForm(form: FormData) {
  const date = (k: string) => (form.get(k) ? String(form.get(k)) : null);
  const yn = (k: string) => (form.get(k) === "yes" ? true : form.get(k) === "no" ? false : null);
  const yearOf = (d: string | null) => (d ? Number(d.slice(0, 4)) : null);
  const time = String(form.get("time") ?? "");
  return personSchema.safeParse({
    name: String(form.get("name") ?? ""),
    birth: {
      date: String(form.get("date") ?? ""),
      time: form.get("timeUnknown") || !time ? null : time,
      place: String(form.get("place") ?? ""),
      lat: Number(form.get("lat") ?? NaN),
      lon: Number(form.get("lon") ?? NaN),
      tz: String(form.get("tz") ?? ""),
    },
    metDate: date("metDate"),
    startDate: date("startDate"),
    endDate: date("endDate"),
    startYear: yearOf(date("startDate") ?? date("metDate")),
    endYear: yearOf(date("endDate")),
    stayedFriends: yn("stayedFriends"),
    children: yn("children"),
    livedTogether: yn("livedTogether"),
    married: yn("married"),
    ending: form.get("ending") || null,
    met: form.get("metPlace") ? { place: String(form.get("metPlace")), lat: Number(form.get("metLat")), lon: Number(form.get("metLon")), tz: String(form.get("metTz")) } : null,
  });
}

export const homeSchema = birthSchema.pick({ place: true, lat: true, lon: true, tz: true });
