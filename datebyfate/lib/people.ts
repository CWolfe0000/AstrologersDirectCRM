import { z } from "zod";
import type { Birth } from "./astro/types";

export type PersonKind = "self" | "ex" | "match";

export interface PersonData {
  name: string;
  birth: Birth;
  /** Past relationships only. */
  startYear?: number | null;
  endYear?: number | null;
  /** Who ended it. */
  ending?: "me" | "them" | "mutual" | null;
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
export const personSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name or nickname.").max(60),
    birth: birthSchema,
    startYear: year.nullish(),
    endYear: year.nullish(),
    ending: z.enum(["me", "them", "mutual"]).nullish(),
  })
  .refine((p) => !p.startYear || !p.endYear || p.endYear >= p.startYear, { message: "The end year is before the start year.", path: ["endYear"] });

/** Reads the fields of the person form (components/person-form.tsx). */
export function personFromForm(form: FormData) {
  const num = (k: string) => (form.get(k) ? Number(form.get(k)) : null);
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
    startYear: num("startYear"),
    endYear: num("endYear"),
    ending: form.get("ending") || null,
  });
}

export const homeSchema = birthSchema.pick({ place: true, lat: true, lon: true, tz: true });
