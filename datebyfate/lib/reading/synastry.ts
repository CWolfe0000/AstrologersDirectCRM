import type { PointId } from "@/lib/astro/types";
import { POINT_NAMES, type AspectName } from "@/lib/astro/zodiac";

/**
 * Contacts between two people's charts.
 *
 * The method and themes follow Steven and Jodie Forrest, "Skymates, Volume 1" (chs. 12–14):
 * every contact runs both ways; the planets say what is at stake and the aspect sets the tone;
 * sextiles and trines are "flowing", squares and oppositions "challenging", and the conjunction
 * is a fusion, the strongest form, read mainly through the flowing text. No aspect is good or
 * bad: easy contacts carry risks and hard ones carry passion and growth. Contacts with the
 * lunar nodes are left out, as the Forrests do not read them this way. The wording is our own.
 *
 * In the texts, {A}/{a} is the owner of the first planet in the key and {B}/{b} the owner of the
 * second, as a possessive ("Your"/"your" or "Sam’s").
 */

/** Sun, Moon and Ascendant first: the bedrock of a bond. */
export const ORDER: PointId[] = ["sun", "moon", "asc", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
export const TRIAD = new Set<PointId>(["sun", "moon", "asc"]);

/** [flowing, challenging] */
const PAIRS: Record<string, [string, string]> = {
  "sun-sun": ["You are on the same side: easy friendship and mutual encouragement. The risk is sharing the same blind spots.", "Two characters that run on different systems, and your values may clash. You make a strong team if each accepts that the other is right in their own way. Otherwise it turns into a contest of egos."],
  "sun-moon": ["{A} Sun lifts {b} mood and spirits, and {b} Moon gives {a} Sun somewhere to rest. One of the surest signs of a lasting bond.", "Something in {a} Sun’s manner grates on {b} feelings, and {b} moods dampen {a} Sun’s spontaneity. It is workable: {b} Moon has to get past reflex reactions, and {a} Sun has to be more tender and less self-absorbed."],
  "sun-asc": ["{A} Sun and {b} style bring out the colour and confidence in each other. Watch for shared illusions.", "{B} style rubs {a} Sun up the wrong way, and {a} Sun’s self-concern makes {b} side shut down. The root is pride on both sides."],
  "sun-mercury": ["Easy mutual understanding, and interests that complement each other.", "The same words from different dictionaries. {A} Sun should avoid laying down the law, and {b} Mercury should avoid flooding the air with talk."],
  "sun-venus": ["{A} Sun stirs {b} affection and warmth, and {b} Venus brings grace into {a} Sun’s life.", "{A} Sun’s ego is at odds with what {b} Venus finds romantic. It is uncomfortable, and it keeps things intense. {A} Sun does well to learn how {b} Venus likes to be treated, and {b} Venus does well to love the real person."],
  "sun-mars": ["Passion and fierce loyalty. Your fights are big and end usefully, and the fire lasts.", "Irritation on a hair trigger: {a} Sun looks haughty to {b} Mars, and {b} Mars looks abrasive to {a} Sun. Both are partly right. Learn each other’s style and stop the pointless escalations."],
  "sun-jupiter": ["{B} Jupiter is {a} Sun’s biggest supporter, and {a} Sun inspires {b} larger aims. One of the happiest contacts there is.", "Still warm and good-humoured, but each expects too much of the other. Humility helps."],
  "sun-saturn": ["{A} Sun warms the guarded parts of {b} Saturn, and {b} Saturn supports {a} Sun’s maturity. Commitment grows more valuable each year: a mark of a bond that lasts.", "The script to avoid: {b} Saturn becomes the one who polices, and {a} Sun rebels like a child. Resentment drains the bond unless you catch it early."],
  "sun-uranus": ["You loosen each other up, and life together is less conventional.", "{A} Sun brings out the rebel in {b} Uranus, and {b} Uranus brings out the autocrat in {a} Sun. Protect each other’s right to a life outside the relationship."],
  "sun-neptune": ["A sense of depth and of something sacred between you. {B} Neptune guides the shared inner life and gains from {a} Sun’s grounding.", "Neither of you sees the other clearly: hopes with no basis get dashed, or fears with no basis cause hurt. Time together in silence helps."],
  "sun-pluto": ["Never light, even when it flows. You help each other grow through risky honesty, with a sense of being on the same side.", "The same honesty, delivered explosively. It is valuable only if you both know when enough is enough, and when a hug beats a critique."],
  "moon-moon": ["Instinctive sympathy and moods that fit. Living together is easy.", "Your hearts lack natural sympathy, and clashes of mood are hard to pin down. Keep some separate space at home, take time apart when it sours, and then listen without interrupting."],
  "moon-asc": ["{B} style coaxes {a} Moon’s shy inner self out, and {a} Moon quietly steadies {b} poise.", "{A} Moon can look moody to {b} side, and {b} manner can look shallow to {a} Moon. Nobody means it. Humour helps, and each needs somewhere to be fully themselves."],
  "moon-mercury": ["Easy everyday talk that comforts.", "Heart and mouth do not match. {A} Moon should look for the feeling behind the words, and {b} Mercury should listen for what is left unsaid."],
  "moon-venus": ["Sweetness, forgiveness and trust: one of the deepest instinctive bonds. The risk is too much peace and too few boundaries.", "{B} Venus’s romantic approach makes {a} Moon shy and withdrawn. It needs patience from {b} Venus and a decision to open up from {a} Moon. The bond is deep all the same."],
  "moon-mars": ["Heated, and unstable even at its best. {A} Moon builds {b} confidence, and {b} Mars goes straight to {a} instincts. Wonderful for desire, explosive in a quarrel.", "{A} Moon still stokes {b} fire, and {b} Mars can then come on too strong, leaving {a} Moon touchy. Hard on calm at home, and a strong sign that desire lasts."],
  "moon-jupiter": ["{B} Jupiter makes {a} Moon smile, and {a} Moon nurtures {b} confidence and dreams. Good mood and comfort.", "Mild. Well-meant cheering up that misses the mark."],
  "moon-saturn": ["Practical support, loyalty and reliability that improve with the years: a sign of being able to live together for a long time.", "Two languages. {B} Saturn offers sound advice when {a} Moon needs kindness, and {a} Moon offers reassurance when {b} Saturn needs clarity and commitment. It takes patience and translation."],
  "moon-uranus": ["Spontaneity and mischief, and an unconventional home.", "{B} Uranus disrupts the peace {a} Moon needs, and {a} Moon seems closed and cautious to {b} Uranus. Humour on both sides."],
  "moon-neptune": ["Undefended closeness and near-telepathic empathy. {A} Moon nurtures {b} dreams and imagination.", "The same closeness becomes too much merging. Everyone needs some boundaries and space, so take time apart on purpose."],
  "moon-pluto": ["{A} Moon disarms {b} defences, and honest talk about painful things makes for rare intimacy, provided it goes both ways.", "{B} Pluto’s truth-telling needs kindness, and {a} Moon does well to remember that honesty is a form of love. Each can look defensive or harsh to the other."],
  "asc-asc": ["Your styles, pace and body language fit, usually without your noticing.", "A low-level friction of style, like the tiredness of being abroad. Name it without judging."],
  "asc-venus": ["One of the most valuable links: each makes tenderness and physical expression easy for the other, which helps desire stay spontaneous.", "No disaster. {B} Venus’s signals of affection do not always land, and {a} side can feel judged. Be direct."],
  "asc-mars": ["Liveliness, candour and a physical charge even in ordinary moments. Small spats are frequent, and healthy.", "Prickly: {a} style gets on {b} Mars’s nerves. The tension is about style, not substance."],
  "asc-jupiter": ["Faith in each other, encouragement and luck.", "{B} Jupiter’s support misreads what {a} side wants, and feels overbearing."],
  "asc-saturn": ["Slow and valuable: {a} side helps {b} long projects along, and {b} Saturn lends {a} side dignity and authority.", "{A} spontaneity presses {b} Saturn’s buttons, {b} Saturn judges, and {a} side digs in. {B} Saturn needs to loosen, and {a} side to adjust a little out of love."],
  "asc-uranus": ["Playful, and unbothered by what people think. You are freer together.", "{A} side sets off defiance in {b} Uranus and then treats it as childish, and the loop repeats. Cool off, and use common sense."],
  "asc-neptune": ["The ability to look into each other’s eyes. {A} side usually has to make the quiet time happen.", "{A} side makes {b} Neptune vaguer or more passive. {B} Neptune first goes along with it and then overreacts."],
  "asc-pluto": ["Good at serious, searching talk: {a} side starts it, and {b} deeper issues come into the open.", "There is work to do, and your styles clash. {A} side has to commit to openness, and {b} Pluto has to drop the analyst’s manner. You bring out each other’s worst, which with forgiveness can be healed."],
  "mercury-mercury": ["Ideas pour out between you.", "Different ways of thinking. Real listening turns it into insight."],
  "mercury-venus": ["{A} Mercury helps {b} Venus put feelings into words, and {b} Venus makes {a} Mercury feel interesting.", "{A} way of talking dampens {b} openness, and {b} Venus is probably being too polite to say so."],
  "venus-venus": ["Basic affection, and shared tastes and manners.", "Attracted, and not quite comfortable: different romantic styles and assumptions. The passion lives in the difference."],
  "venus-mars": ["As much physical attraction as two charts can show: ease, spontaneity and enthusiasm. {A} Venus tends to receive and {b} Mars to pursue.", "A strong first attraction; whether it lasts depends on the rest. {A} Venus can feel jostled by {b} Mars’s directness, and {b} Mars can feel looked down on."],
  "venus-jupiter": ["{B} Jupiter builds {a} confidence in love, and {a} Venus’s kindness supports {b} generosity.", "Real promise with inflated expectations: elation, then let-down. Accept human limits."],
  "venus-saturn": ["Sober, thoughtful and lasting. {B} Saturn steadies {a} Venus, and {a} Venus charms its way into {b} guarded places. Promises are kept.", "Something in {b} Saturn inhibits {a} Venus’s warmth, so {b} Saturn needs to loosen. {A} Venus’s own trust issues can also make {b} Saturn look more controlling than it is. It still favours staying together."],
  "venus-uranus": ["{B} Uranus freshens {a} love life, and {a} Venus steadies the part of {b} Uranus that would bolt.", "Lightning and sudden change. {A} Venus has to allow freedom without reading it as rejection, and {b} Uranus has to admit to a fear of commitment."],
  "venus-neptune": ["A communion that goes beyond body and personality. Make time for it, and treat the high moments as gifts.", "The same magic, unstable: illusions, groundless jealousy, and misreadings of how the other sees the relationship. Clear, timely talk keeps it grounded."],
  "venus-pluto": ["Not natural friends, even when it flows. {B} Pluto brings a confronting intensity to {a} patterns in love; {a} Venus becomes more honest, and {b} Pluto learns patience and timing.", "Fireworks. {B} Pluto pushes harder than it knows until {a} Venus flares. There is a real risk of hurting each other unless it is handled with patience, humour and forgiveness."],
  "mars-mars": ["Passion, fierce loyalty and strength in a crisis. Volatility is the price.", "Chronic annoyance: each fears the other’s anger and gets angry first. Say that you are scared once more before you attack."],
  "mars-jupiter": ["High spirits: {b} Jupiter enlarges {a} vigour, and {a} Mars pushes {b} Jupiter to ask more of life.", "{A} Mars finds {b} Jupiter high-handed, and {b} Jupiter finds {a} Mars petty. It is a silly loop of ego. Name it and laugh."],
  "mars-saturn": ["You can work through differences with respect, and {b} Saturn helps the original passion last.", "A dynamic to watch: {b} Saturn quietly checks {a} anger and exuberance until {a} Mars explodes, {b} Saturn withdraws into coldness, and that sets {a} Mars off again."],
  "mars-uranus": ["Lively, teasing and adventurous. Do not hide tenderness behind comradeship.", "Frequent short outbursts, which wear away the sense of safety at home. {A} Mars has to accept {b} need for space, and {b} Uranus has to stay present when {a} Mars has a grievance."],
  "mars-neptune": ["Physical passion and a sense of something larger, trying to join.", "Warrior and mystic. {A} Mars must not trample {b} hidden sensitivity, and {b} Neptune must not treat desire as something lesser."],
  "mars-pluto": ["Fierce chemistry that carries you through thin patches, and a drive to go deeper into each other. Expect old fears to be uncovered in {a} Mars.", "The two most combative planets against each other: vicious rows, and undercurrents that damage trust. Fear is at the root. {B} Pluto needs humour and timing, and {a} Mars needs to own its prickliness."],
  "saturn-saturn": ["A quiet strength: over the years you build a great deal together. Watch that you do not agree to avoid the same things.", "Your needs for solitude and independence clash, and each one’s caution irritates the other. Each has to make an effort, and neither should give up too much privacy."],
};

/** What each planet can do to another person's planet: as a gift, and as a theft. */
const GIFT: Partial<Record<PointId, [string, string]>> = {
  sun: ["vitalise and encourage", "overshadow"],
  moon: ["deepen and comfort", "smother or unsettle"],
  asc: ["draw out", "trivialise"],
  mercury: ["inform and stimulate", "fluster or talk over"],
  venus: ["warm and soften", "lull or blind"],
  mars: ["excite and embolden", "irritate or frighten"],
  jupiter: ["brighten and enlarge", "flatter or inflate"],
  saturn: ["focus and steady", "repress or control"],
  uranus: ["free and surprise", "disrupt"],
  neptune: ["inspire and enchant", "confuse or glamorise"],
  pluto: ["reveal and deepen", "dominate"],
};

export type ContactKind = "conjunction" | "flowing" | "challenging";
export const kindOf = (aspect: AspectName): ContactKind => (aspect === "conjunction" ? "conjunction" : aspect === "square" || aspect === "opposition" ? "challenging" : "flowing");

const FUSION = " As a conjunction the two fuse: this is the strongest form, and the challenging side can show as well.";

/**
 * One contact in words. `yours` and `theirs` are the two points; `name` is the other person's
 * name, or null for "their".
 */
export function synastryText(yours: PointId, theirs: PointId, kind: ContactKind, name: string | null): { body: string; sourced: boolean } {
  const them = name ? `${name}’s` : "their";
  const Them = name ? `${name}’s` : "Their";
  const youFirst = ORDER.indexOf(yours) <= ORDER.indexOf(theirs);
  const [first, second] = youFirst ? [yours, theirs] : [theirs, yours];
  const fill = (t: string) => t.replaceAll("{A}", youFirst ? "Your" : Them).replaceAll("{a}", youFirst ? "your" : them).replaceAll("{B}", youFirst ? Them : "Your").replaceAll("{b}", youFirst ? them : "your");
  const pair = PAIRS[`${first}-${second}`];
  if (pair) return { body: fill(pair[kind === "challenging" ? 1 : 0]) + (kind === "conjunction" ? FUSION : ""), sourced: true };
  // Every contact runs both ways: each planet can give to the other or take from it.
  const [g1, t1] = GIFT[first] ?? ["touch", "unsettle"];
  const [g2, t2] = GIFT[second] ?? ["touch", "unsettle"];
  const general = fill(`{A} ${POINT_NAMES[first]} can ${g1} {b} ${POINT_NAMES[second]}, or ${t1} it. In turn {b} ${POINT_NAMES[second]} can ${g2} {a} ${POINT_NAMES[first]}, or ${t2} it.`);
  const tail = kind === "conjunction" ? FUSION : kind === "flowing" ? " By sextile or trine, the gift comes more easily." : " By square or opposition it takes more care, and brings more energy.";
  return { body: general + tail, sourced: false };
}

/** One person's planets in a house of the other's chart. At best, and at worst. */
export const HOUSE_OVERLAY = [
  "Self and style. At best more poise and self-awareness; at worst feeling awkward, or remodelled.",
  "Self-worth and resources. One of the most telling overlays: confidence is built up or worn down, and material resources with it.",
  "Talk and curiosity. At best never bored; at worst talked over and scattered.",
  "Roots, home and the inner life. Easy to make a home with, and able to heal old family patterns or reopen them. Handle with care.",
  "Play, romance and creativity. At best laughter, and falling in love again and again; at worst childishness, and infatuation without a future.",
  "Work, skill and daily responsibility. At best a shared load and useful critique; at worst earning love through tasks.",
  "Partnership itself: the sense of having found a missing half, very common between couples. The danger is losing yourself, or a fight over who leads.",
  "Instinct, sex and psychological depth. Feelings intensify, and secrets are confided early. At best deeper bonding; at worst old fears stirred up.",
  "Meaning, belief and travel. At best wider horizons; at worst feeling preached at.",
  "Work and public life. Raises visibility and ambition. Make sure the role fits the real person.",
  "Goals, the future and friends. Makes you say what you want, and brings people in.",
  "Letting go. It comes from the blind side and undoes the story a person tells about themselves. At best a spiritual opening; at worst confusion and loss.",
];
