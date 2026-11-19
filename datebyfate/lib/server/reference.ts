import "server-only";
import type { Chart } from "@/lib/astro/types";
import { signaturesOf } from "@/lib/reading/exes";
import { bodiesAt } from "./swiss";

/** Small seeded generator (mulberry32): the same member always gets the same comparison group. */
export function seeded(seed: string) {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Signature sets for random people born between two years, measured against
 * your chart. This is the comparison group for the pattern across partners.
 */
export function referenceSignatures(you: Chart, fromYear: number, toYear: number, random: () => number, size = 500) {
  const start = Date.UTC(fromYear, 0, 1);
  const span = Math.min(Date.now(), Date.UTC(toYear + 1, 0, 1)) - start;
  const out: Set<string>[] = [];
  for (let i = 0; i < size; i++) {
    const ms = start + Math.floor(random() * span);
    out.push(signaturesOf(you, { chart: { bodies: bodiesAt(ms), houses: null, moonSignCertain: true, utc: "" }, hasTime: true }));
  }
  return out;
}
