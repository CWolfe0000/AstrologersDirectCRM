import type { PointId } from "@/lib/astro/types";
import { POINT_NAMES, type AspectName } from "@/lib/astro/zodiac";
import type { Reading } from "./context";

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

/**
 * One person's planets in a house of the other's chart: one reading per house, house 1 first.
 * `core` says what the house is about and what it means that the other person's planets land there
 * (written to work whichever of the two it is). `expressions` are three or four concrete forms the
 * overlay takes in real couples, most constructive first and hardest last. They are forms, not
 * predictions. The house's element (fire 1/5/9, earth 2/6/10, air 3/7/11, water 4/8/12) and its
 * modality (angular, succedent, cadent) shape what the overlay asks for.
 */
export const HOUSE_OVERLAY: Reading[] = [
  {
    core: "The first house is identity, appearance and the manner in which a person meets the world, and the other person’s planets landing here switch on the way each of you is seen. It is a fire, angular house: it asks for spontaneity and direct self-expression, and what lands here is felt at once and in the open.",
    expressions: [
      "One person becomes more visible and more fully themselves in the other’s company, and says so plainly.",
      "The pair are noticed as a pair, and the way each presents themselves begins to echo the other’s style.",
      "First impressions are strong and immediate, and they set the tone for how the two read each other for years.",
      "One person’s self-image is repainted by the other’s view of them, until neither knows which manner is their own and which is borrowed.",
    ],
  },
  {
    core: "The second house is self-worth, money, possessions and whatever a person values and relies on. The other person’s planets landing here touch what each of you holds dear, and as an earth, succedent house it asks for steadiness and proof in practice, not promises.",
    expressions: [
      "Each feels more secure in what they have and what they are worth, and the practical side of life steadies.",
      "Money, possessions and shared spending become a regular subject, handled openly and fairly between you.",
      "Worth becomes tied to what the other gives or approves, so praise lifts confidence and silence lowers it.",
      "Spending, saving and ownership become the ground where control is fought for, and generosity is counted and kept as a score.",
    ],
  },
  {
    core: "The third house is everyday talk, curiosity, siblings, short trips and the constant small exchange of news. The other person’s planets landing here stir the mind, and as an air, cadent house it needs ideas passed back and forth, so the pair come alive when they are talking.",
    expressions: [
      "Conversation runs easily and constantly, with jokes, news and half-finished thoughts passed back and forth all day.",
      "Each sharpens the other’s curiosity, and they take up new subjects, courses and journeys because the other is interested.",
      "Talk becomes the way the pair avoid feeling, so topics are discussed endlessly and nothing is decided.",
      "One person’s ideas and opinions crowd out the other’s, leaving the listener interrupted, scattered and unable to finish a thought.",
    ],
  },
  {
    core: "The fourth house is home, family roots, privacy and the earliest sense of being cared for. The other person’s planets landing here reach the private self, and as a water, angular house it asks for feeling-contact more than words.",
    expressions: [
      "The bond feels like coming home, and building a shared household comes naturally and gives lasting safety.",
      "Old family patterns surface between the pair, and each sees where their upbringing taught them to give or withhold care.",
      "One person starts to play parent to the other, protecting and nurturing until the other feels managed and unable to grow up.",
      "Childhood feelings are reopened with no way to leave them behind, and the home becomes the place where the oldest hurts are replayed.",
    ],
  },
  {
    core: "The fifth house is play, romance, creative self-expression and pleasure for its own sake. The other person’s planets landing here call out warmth, and as a fire, succedent house it needs enthusiasm, risk and a willingness to be seen enjoying oneself.",
    expressions: [
      "Fun, flirtation and shared creative projects keep the bond warm, and each feels more alive and more generous with the other.",
      "Romance is staged and celebrated with gestures, dates and games, and the pair feel they are always in the first flush of love.",
      "Each plays to the other as an audience, and the need for admiration decides how the pair behave.",
      "Infatuation runs ahead of substance, so the intensity of the early days is mistaken for a future and burns out when the novelty ends.",
    ],
  },
  {
    core: "The sixth house is work, routine, health and the craft of daily life. The other person’s planets landing here meet practical duty, and as an earth, cadent house it asks for usefulness, reliability and attention to detail more than grand gestures.",
    expressions: [
      "The pair share the load, help each other refine skills and habits, and build trust through dependable small acts.",
      "Daily routines, health habits and household tasks become a main way that care is shown and received.",
      "Help turns into constant correction, and each hears the other’s advice as a list of faults to be fixed.",
      "Love is earned through service, so one person is always working and the other is always owed.",
    ],
  },
  {
    core: "The seventh house is the committed partner, the one-to-one bond and what a person looks for in others. The other person’s planets landing here are met as the missing half, and as an air, angular house the overlay asks for fairness and exchange between equals.",
    expressions: [
      "Each recognises in the other what they were looking for, and the partnership feels natural and balanced from early on.",
      "The two weigh decisions together, talk problems through and treat each other as equals with an equal say.",
      "Each puts the other’s wishes first to keep the peace, and their own needs go unspoken until they pile up.",
      "Partnership becomes a contest over who leads and who gives way, with each keeping count of who has conceded more.",
    ],
  },
  {
    core: "The eighth house is intimacy, sexuality, shared resources and the deep emotional bond that changes both people. The other person’s planets landing here reach what each keeps private, and as a water, succedent house it asks for real feeling-contact and a willingness to be affected.",
    expressions: [
      "Intimacy goes deep quickly, secrets are confided early, and the bond renews each of them.",
      "Sexual and emotional closeness becomes the centre of the relationship, with a strong pull to merge.",
      "Money, debts and shared property are tied to trust, and every arrangement becomes a test of loyalty.",
      "Old fears of exposure, abandonment and loss of control are stirred, and power is fought over through silence, jealousy and withholding.",
    ],
  },
  {
    core: "The ninth house is belief, learning, travel and the search for meaning. The other person’s planets landing here widen the outlook, and as a fire, cadent house it asks for shared faith, adventure and a sense of purpose.",
    expressions: [
      "The pair travel, study and explore ideas together, and each widens the other’s outlook.",
      "They discuss beliefs, ethics and the point of life, and growth comes from the places where their views differ.",
      "One person’s convictions are pressed on the other as the correct view, and disagreement is treated as ignorance.",
    ],
  },
  {
    core: "The tenth house is career, public standing, reputation and responsibility to the wider world. The other person’s planets landing here meet ambition, and as an earth, angular house it asks for concrete achievement and respect for what each is building.",
    expressions: [
      "Each backs the other’s goals, and the relationship raises both people’s standing and sense of direction.",
      "The pair are seen as a unit by colleagues, family and community, and the roles they hold in public shape how they act together.",
      "One person’s ambitions set the terms of the other’s choices, and the career of one comes first by default.",
    ],
  },
  {
    core: "The eleventh house is friends, groups, shared ideals and hopes for the future. The other person’s planets landing here stir goals, and as an air, succedent house it asks for freedom, shared ideas and room for each to be an individual.",
    expressions: [
      "The pair are friends first, sharing ideals, projects and a wide circle of people.",
      "Each draws out of the other what they want from the future, and vague hopes become plans.",
      "Friends and groups fill the calendar, and the couple spend more time with others than alone together.",
      "Friendship replaces warmth, and detachment keeps the pair pleasant to each other but never close.",
    ],
  },
  {
    core: "The twelfth house is the hidden, the unconscious, solitude, sacrifice and whatever a person cannot see about themselves. The other person’s planets landing here fall on the blind side, and as a water, cadent house the contact works through feeling and intuition beyond words.",
    expressions: [
      "A quiet, wordless understanding forms, with shared compassion, time apart together and creative or spiritual depth.",
      "Each gives to the other without being asked, and care shows as sacrifice, rescue and silent support.",
      "Much of the bond runs out of sight, so the pair keep secrets or sense what is never said and cannot name it.",
      "Self-image dissolves into confusion, escape and loss of direction, and each finds it hard to tell where they end and the other begins.",
    ],
  },
];
