import type { BodyId, Chart } from "@/lib/astro/types";
import { POINT_NAMES } from "@/lib/astro/zodiac";
import { CHALDEAN, dayOf, type Classical } from "./hours";
import { aspectBasis, aspectsOf } from "./own";

/**
 * Planetary practice. The timing (planetary days and hours, and pairing one planet's hour with
 * another planet's day) and the traditional correspondences follow Jason Miller, "Advanced
 * Planetary Magic", and Dykes & Gibson, "Astrological Magic: Basic Rituals & Meditations".
 * Neither book ties a practice to an aspect in a birth chart, and neither works with Uranus,
 * Neptune or Pluto: matching a practice to your own dynamics is ours. Every practice here is
 * something you do for yourself. The wording is our own; no invocation from either book is used.
 */

export interface PlanetPractice {
  /** What this planet is worked with for, in love. */
  purpose: string;
  /** What to set down and what to cultivate. */
  release: string;
  cultivate: string;
  colour: string;
  scent: string;
  /** Something ordinary to do on its day. */
  act: string;
}

export const PRACTICE: Record<Classical, PlanetPractice> = {
  sun: { purpose: "self-worth, being seen as you are, and knowing what you want", release: "needing to be right, or to be the important one", cultivate: "good judgment, warmth and kindness", colour: "orange or gold", scent: "frankincense, orange or cinnamon", act: "Spend time in daylight, and do one thing you are proud of." },
  moon: { purpose: "your emotional needs, calm, and the habits you fall back on", release: "being carried off by every change of mood", cultivate: "tenderness and peace of mind", colour: "silver or pale blue", scent: "jasmine", act: "Go to bed early, and write down what you dream." },
  mercury: { purpose: "saying what you mean, listening, and the conversation you have been avoiding", release: "being clever in order to avoid the point", cultivate: "honest curiosity", colour: "yellow", scent: "lavender", act: "Write the letter you will not send, or say one plain thing you have been leaving out." },
  venus: { purpose: "receiving affection, enjoying yourself, and being open to love", release: "longing for what is not there, and holding on too tightly", cultivate: "enjoyment, friendliness and a love of beautiful things", colour: "green", scent: "rose or sandalwood", act: "Make something beautiful, bring flowers home, or see a friend purely for pleasure." },
  mars: { purpose: "courage, saying no, desire, and staying composed under pressure", release: "harshness and acting in haste", cultivate: "courage and self-discipline", colour: "red", scent: "ginger or cinnamon", act: "Do something physically demanding, and make one decision you have been putting off." },
  jupiter: { purpose: "generosity, trust, forgiveness and seeing the larger picture", release: "excess, and promising more than you can give", cultivate: "generosity and humility", colour: "violet or deep blue", scent: "cedar or clove", act: "Give something away, or learn something that widens your view." },
  saturn: { purpose: "boundaries, endings, grief, patience and commitment", release: "fooling yourself, and old fear", cultivate: "patience and steady effort", colour: "indigo or black", scent: "myrrh or cypress", act: "Finish something, clear something out, and spend a little time alone." },
};

/** A five-minute practice, the same shape for every planet. */
export const STEPS = [
  "Sit down somewhere you will not be interrupted. Let the day go and breathe slowly for a minute.",
  "Light a candle or set out something in the planet’s colour, with its scent if you have it.",
  "Say, aloud or silently, what you are setting down and what you want to cultivate.",
  "Imagine the planet’s colour filling you from the feet up, and stay with it for a few breaths.",
  "Notice what comes up: a memory, a feeling, a person. Do not argue with it.",
  "Put the candle out, and write two lines about what you noticed.",
];

/**
 * What to do about a pattern in ordinary life, by the heavier planet involved. The advice follows
 * Donna Cunningham, "An Astrological Guide to Self-Awareness", in our own words. She writes it for
 * Venus aspects and for strongly Saturnian or Plutonian people in general; applying it to every
 * pair with that planet is our extension. Her alternative-therapy suggestions are left out.
 */
const ADVICE: Partial<Record<BodyId, string>> = {
  saturn: "Ask yourself regularly, and honestly, what your own part is. Loosen your perfectionism: good enough is enough. Build trust slowly and on purpose, and expect this to ease as you get older.",
  uranus: "Hold relationships loosely without leaving them. Admit to yourself when you are choosing someone unavailable, and practise valuing people who are dependable.",
  neptune: "Notice what rescuing someone gives you. Offer compassion without taking over, and act on the warning signs you already recognise.",
  pluto: "Watch for jealousy, guilt and keeping score, and drop them one at a time. Build a life of your own so that you need less from one person. Say what you feel in company you trust, and if nothing changes, let it go.",
  mars: "Say no at the start, not after agreeing and resenting it. Raise a problem while it is small. Use your body, because exercise takes the edge off irritability. Find the unspoken demand behind your anger and question it.",
};
const PROJECT = "Treat this as a project for a few months: notice where it shows up, write about it, name your own part without blaming anyone, and list what the struggle has already taught you.";

const isClassical = (id: BodyId): id is Classical => (CHALDEAN as string[]).includes(id);

export interface DynamicPractice {
  key: string;
  name: string;
  basis: string;
  body: string;
  /** What to do about it in ordinary life. */
  advice: string;
  /** Timings to use: the hour of one planet on the day of another. */
  timings: { hour: Classical; day: Classical; label: string; note: string }[];
}

/** A practice for each difficult dynamic in a chart. */
export function practicesFor(chart: Chart): DynamicPractice[] {
  return aspectsOf(chart)
    .filter((a) => a.hard)
    .sort((p, q) => p.orb - q.orb)
    .map((a) => {
      const both = isClassical(a.x) && isClassical(a.y);
      const inner = (isClassical(a.x) ? a.x : a.y) as Classical;
      const timing = (hour: Classical, day: Classical) => ({
        hour,
        day,
        label: `${POINT_NAMES[hour]} Hour On ${dayOf(day)}`,
        note: hour === day ? `${POINT_NAMES[hour]} on its own day, undiluted: for ${PRACTICE[hour].purpose}.` : `${POINT_NAMES[hour]} leads and ${POINT_NAMES[day]} colours it: ${PRACTICE[hour].purpose}, with ${PRACTICE[day].cultivate}.`,
      });
      const outer = POINT_NAMES[isClassical(a.x) ? a.y : a.x];
      return {
        key: a.key,
        name: a.name,
        basis: aspectBasis(a),
        body: both
          ? `Both planets can be worked with. Set down ${PRACTICE[a.x as Classical].release}, and ${PRACTICE[a.y as Classical].release}. Cultivate ${PRACTICE[a.x as Classical].cultivate}, and ${PRACTICE[a.y as Classical].cultivate}.`
          : `The tradition these practices come from works with the seven visible planets, so there is no practice for ${outer}. Work with your ${POINT_NAMES[inner]}, the side of this you can steady: set down ${PRACTICE[inner].release}, and cultivate ${PRACTICE[inner].cultivate}.`,
        advice: [ADVICE[a.y] ?? ADVICE[a.x] ?? "", PROJECT].filter(Boolean).join(" "),
        timings: both ? [timing(a.x as Classical, a.y as Classical), timing(a.y as Classical, a.x as Classical)] : [timing(inner, inner)],
      };
    });
}
