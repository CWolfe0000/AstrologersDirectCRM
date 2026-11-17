import "server-only";
import { associatedPeople, clientPeople, clients } from "@/lib/data/people";
import * as seed from "@/lib/data/records";
import { SEED_DATE } from "@/lib/utils";
import { upsertRecord } from "./records";
import type { Collection } from "./db/schema";

const DAY = 86_400_000;

/** Shift every date in the seed by `days`, except birth data (which must stay exact). */
function shift<T>(value: T, days: number, key = ""): T {
  if (key === "birth") return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d!) + days * DAY);
    return (dt.toISOString().slice(0, 10) + value.slice(10)) as T;
  }
  if (Array.isArray(value)) return value.map((v) => shift(v, days)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shift(v, days, k)])) as T;
  }
  return value;
}

/**
 * Load the demonstration practice (12 clients, charts, consultations…) into a
 * practice, with dates moved so "today" in the sample is the real today.
 */
export async function loadSampleData(practiceId: string, today = new Date()) {
  const anchor = Date.parse(SEED_DATE + "T00:00:00Z");
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((now - anchor) / DAY);
  const sets: [Collection, unknown[]][] = [
    ["people", [...clientPeople, ...associatedPeople]],
    ["clients", clients],
    ["charts", seed.charts],
    ["consultations", seed.consultations],
    ["observations", seed.observations],
    ["tasks", seed.tasks],
    ["readings", seed.readings],
    ["recordings", seed.recordings],
    ["files", seed.files],
    ["notifications", seed.notifications],
    ["activity", seed.activity],
    ["portalNotifications", seed.portalNotifications],
    ["clientWork", seed.clientWork],
    ["workResponses", seed.workResponses],
  ];
  let count = 0;
  for (const [collection, rows] of sets) {
    for (const row of rows) {
      await upsertRecord(practiceId, collection, shift(row, days));
      count++;
    }
  }
  return { count, shiftedDays: days };
}
