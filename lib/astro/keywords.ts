/**
 * Keywords for reading a direction: the planet, the houses it rules and sits
 * in, the aspect, and the natal point with its sign and house. The lists are
 * the practice's working vocabulary and are meant to be edited; the 7th and
 * 8th carry the derived meanings (open enemies; the partner's money) that
 * proved necessary when the readings were checked against real events.
 */
import { BODIES, SIGNS, ordinal } from "./index";
import type { NatalModel } from "./activation";
import type { TargetId, TimelineContact } from "./timeline";
import type { AspectId } from "./types";

export const PLANET_KEYS: Partial<Record<TargetId, string>> = {
  sun: "identity, visibility, vitality, the father",
  moon: "home, mother, feelings, the body's rhythms",
  mercury: "messages, contracts, trade, siblings",
  venus: "love, money, pleasure, agreement",
  mars: "action, conflict, cutting, heat, speed",
  jupiter: "growth, luck, excess, teaching, law",
  saturn: "authority, limits, duty, delay, bones",
  uranus: "sudden change, freedom, shock, technology",
  neptune: "illusion, secrets, scandal, faith, dissolving",
  pluto: "power, control, coercion, endings, other people's leverage",
  node: "direction, fated meetings",
  southnode: "release, the familiar",
  chiron: "wounds, healing, teaching from experience",
  asc: "you, the body, how you are seen",
  mc: "career, reputation, public standing",
};

export const SIGN_KEYS = [
  "beginnings, speed, going first", "money, possessions, steadiness", "talking, trading, two of something", "home, family, protection",
  "pride, children, performance", "work, health, detail", "partnership, fairness, law", "secrets, shared money, intensity",
  "belief, travel, teaching", "career, structure, institutions", "friends, groups, the unconventional", "the hidden, sacrifice, the spiritual",
];

export const HOUSE_KEYS = [
  "self, body, appearance", "income, possessions, self-worth", "siblings, neighbours, vehicles, short trips", "home, parents, property",
  "children, romance, creative work, speculation", "daily work, health, routines", "partners, contracts, open enemies", "the partner's money, debt, shared resources, crisis",
  "travel, study, law, belief", "career, reputation, authority", "friends, groups, hopes", "the hidden, isolation, secrets, undoing",
];

export const ASPECT_KEYS: Partial<Record<AspectId, string>> = {
  conjunction: "arrives, merges, begins",
  opposition: "confrontation, a break, another person",
  square: "friction, crisis, forced action",
  trine: "ease, support, flow",
  sextile: "opening, opportunity",
  quincunx: "adjustment, strain",
  semisquare: "irritation",
  sesquiquadrate: "agitation",
};

export interface KeywordLine {
  label: string;
  text: string;
}

const signIdx = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const houseKey = (h: number) => `${ordinal(h)} (${HOUSE_KEYS[h - 1]})`;

/** A natal point's own keywords, the houses it rules (traditional rulers), and optionally its sign and house. */
function pointKeys(n: NatalModel, id: TargetId, place: boolean) {
  const p = n.byId.get(id);
  const parts = [PLANET_KEYS[id] ?? ""];
  const ruled = n.cusps && id !== "asc" && id !== "mc" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => n.houseRulers(h)[0] === id) : [];
  if (ruled.length) parts.push(`rules the ${ruled.map(houseKey).join(" and ")}`);
  if (p && place) parts.push(`in ${SIGNS[signIdx(p.lon)]!.name} (${SIGN_KEYS[signIdx(p.lon)]})`);
  if (p?.house && id !== "asc" && id !== "mc") parts.push(`${place ? "in" : "natally in"} the ${houseKey(p.house)}`);
  return parts.filter(Boolean).join(" · ");
}

/** The keywords behind a solar arc or progression: mover, aspect, natal point. */
export function anchorKeywords(n: NatalModel, c: TimelineContact): KeywordLine[] {
  const src = c.source as TargetId;
  const prefix = c.technique === "solar-arc" ? "Solar Arc" : c.technique === "progressed" ? "Progressed" : "Transiting";
  if (c.technique === "eclipse")
    return [
      { label: c.source === "new-moon" ? "Solar Eclipse" : "Lunar Eclipse", text: c.source === "new-moon" ? "a door opens or closes, a new chapter, something seeded" : "a culmination, something revealed or ended, a relationship in the light" },
      { label: c.aspect.charAt(0).toUpperCase() + c.aspect.slice(1), text: ASPECT_KEYS[c.aspect] ?? "" },
      { label: `Natal ${BODIES[c.target].name}`, text: pointKeys(n, c.target, true) },
    ];
  return [
    { label: `${prefix} ${BODIES[src]?.name ?? c.source}`, text: n.byId.has(src) || PLANET_KEYS[src] ? pointKeys(n, src, false) : "" },
    { label: c.aspect.charAt(0).toUpperCase() + c.aspect.slice(1), text: ASPECT_KEYS[c.aspect] ?? "" },
    { label: `Natal ${BODIES[c.target].name}`, text: pointKeys(n, c.target, true) },
  ].filter((l) => l.text);
}
