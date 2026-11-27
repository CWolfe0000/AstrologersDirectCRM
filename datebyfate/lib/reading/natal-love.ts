/**
 * Natal love texts: the Sun, Moon, rising sign, Venus and Mars by sign, and
 * the planets in houses 4 to 8.
 *
 * Every reading has two parts. `core` says what the placement is and what the
 * person needs in love. `expressions` lists three or four distinct forms the
 * same placement takes in real lives, ordered from the most constructive to
 * the hardest.
 *
 * Nothing here is softened. The core is stated at full strength, and each
 * expression is a plain description with no hedging words and no labels such
 * as "at best". They are forms the placement takes, not predictions about the
 * reader: the app lists them in order and says separately which way the
 * chart's aspects lean (see `weigh` in ./context). Strength comes from saying
 * plainly what happens, never from labelling the person, and nothing is
 * asserted about the reader's past.
 *
 * Themes follow the Forrests' "Skymates, Volume 1", chs. 4–11; the wording is
 * our own.
 *
 * Arrays of twelve are in zodiac order, Aries first.
 */

import type { Reading } from "./context";

export type { Reading };

/** The Sun in each sign, in love: what feeds you, and the forms it takes. */
export const SUN_LOVE: Reading[] = [
  // Aries
  {
    core: "You need robust, full-strength contact and a partner with the nerve to spar with you. Blunt honesty reassures you more than tact does, and when love goes sleepy you rock the boat.",
    expressions: [
      "You say the hard thing early, the two of you have it out, and the air between you is clearer afterwards.",
      "You bring momentum to a relationship that has gone quiet, proposing the trip, the change or the conversation nobody else will start.",
      "You pick a fight about very little because a fight at least feels alive, and both of you come away more guarded.",
      "Quarrels with no real subject become the habit, and a corrosive mistrust settles in where the heat used to be.",
    ],
  },
  // Taurus
  {
    core: "You love for the long term and are not taken in by surface shine. Touch and tangible signs of affection are how love becomes real for you, and your dogged persistence carries a bond through its storms.",
    expressions: [
      "You stay steady through a bad season, and your partner learns that your affection does not depend on things going well.",
      "You show love with your hands and with things that last: a meal cooked, a shoulder rubbed, a gift chosen to be kept.",
      "You mistake a secure arrangement for contentment, dig in, and hold your position long after it has stopped making you happy.",
    ],
  },
  // Gemini
  {
    core: "Stimulation feeds you and routine drains you. What looks like fickleness is appetite for experience, and you commit fully to one person when you are free to keep lively friendships and the two of you go on learning together. Love at its best for you is one unending conversation.",
    expressions: [
      "You and a partner keep finding new things to do and talk about, and years in you are still curious about each other.",
      "You keep a wide circle of friends and interests with your partner’s blessing, and come home with more to give.",
      "Routine closes in, your attention scatters across a dozen things, and you are physically present while your mind is elsewhere.",
      "You move fast across the surface of everything, the relationship included, and overextend yourself until your nerves are frayed.",
    ],
  },
  // Cancer
  {
    core: "You open in stages, because once someone is inside you are fully exposed. A partner has to show gentleness, honesty, commitment and a willingness to make a home before you show your whole self, and until then they meet your shell.",
    expressions: [
      "Someone proves gentle over time, you let them all the way in, and your care for them runs very deep.",
      "You make a home with a partner and pour yourself into it, and they know exactly where they are safe.",
      "You offer wit, coolness or looking-after in place of yourself, so a partner is cared for without ever quite meeting you.",
      "You stay inside the shell for years, even in physical closeness, and the relationship goes on without your tender core ever entering it.",
    ],
  },
  // Leo
  {
    core: "Courtship comes naturally to you: telling your story, praise, play, romance. You stay in love only while appreciation keeps flowing both ways, so staleness is fatal unless courtship is renewed, and you need a partner with colour and presence of their own.",
    expressions: [
      "You keep courting a long-term partner with praise, surprises and play, and they do the same for you.",
      "You risk showing what you have made or who you are, it is welcomed, and you become more generous for it.",
      "Feeling unappreciated, you perform for approval, giving people what pleases them in place of saying what you need.",
      "You withdraw behind pride, say nothing is wrong, and wait in silence to be noticed.",
    ],
  },
  // Virgo
  {
    core: "You prize grown-up realism and a partner who hears an honest observation and actually changes. Love for you has to keep evolving through shared projects and plans, and you do not give your heart until someone has proved trustworthy.",
    expressions: [
      "You and a partner tell each other the truth, act on it, and the relationship is visibly better each year.",
      "You show love through competence, noticing what needs doing and doing it without being asked.",
      "Your eye for improvement turns on your partner as a stream of corrections, and the joy drains out of ordinary days.",
      "Self-doubt persuades you that you deserve no better, and you put up with a selfish or domineering partner.",
    ],
  },
  // Libra
  {
    core: "Relationship is the main proving ground of your life, and you need the give and take of a real equal to feel alive. You bring fairness, courtesy and the ability to hold two sides at once.",
    expressions: [
      "You negotiate with an equal, both of you give ground, and you end up with something fairer than either started with.",
      "You bring courtesy and a sense of beauty to daily life together, and your partner feels considered.",
      "You haggle endlessly over small questions of fairness while the real rift goes unspoken.",
      "You lose your own centre and orbit the other person, until you no longer know what you yourself want.",
    ],
  },
  // Scorpio
  {
    core: "Your vitality and your sanity depend on regular, deep emotional encounter. Sex without psychological depth does not satisfy you, and you bring the same unsparing honesty you ask for.",
    expressions: [
      "You and a partner regularly go to the bottom of what you feel, and you come out lighter, with your humour intact.",
      "You stay present through a partner’s darkest material and are not shocked by any of it.",
      "Depth is missing, and you brood, turn moody and go silent for days.",
      "You use the truth to sting, choosing the accurate thing that hurts most.",
    ],
  },
  // Sagittarius
  {
    core: "Freedom is a real necessity for you. You need a partner with their own interests and friends, open to change and free of jealousy, and you want love to belong to a larger search for meaning. Romance with nothing in it does not hold you.",
    expressions: [
      "You share the search with a partner, travelling, studying and arguing about what matters, and it is richer for being shared.",
      "You and a partner each keep your own friends and pursuits, and you choose each other again without being held.",
      "A dull patch arrives and you read it as the end, leaving before you reach the depth that lies on the other side of it.",
      "You go through a string of brief, shallow connections or repeated infidelities, and nobody gets close enough to matter.",
    ],
  },
  // Capricorn
  {
    core: "Commitment is easy for you; the puzzle is what to do inside it. You bring integrity and staying power, you value a dependable, self-sufficient partner who also has some sparkle, and love feeds you only when you say what you feel and ask for what you want.",
    expressions: [
      "You tell a partner plainly what you feel and what you want, and your reliability becomes warmth they can feel.",
      "You build a life with someone step by step and keep every promise you make along the way.",
      "Feeling goes unspoken and love turns into dutiful ritual, correct in every detail and unrewarding.",
      "Having buried your own needs, you choose a partner who acts them out, become the parent to their child, and endure it as a point of honour.",
    ],
  },
  // Aquarius
  {
    core: "Every script for how a relationship should look is open to question for you, and you design your own form with a partner. Respect for each person’s individuality is the core of love for you.",
    expressions: [
      "You and a partner invent an arrangement that suits the two of you, whatever anyone else makes of it, and it holds.",
      "You back a partner’s oddest ambitions and expect the same latitude, and both of you become more yourselves.",
      "You stage a rebellion over trivia, refusing a small request on principle because it felt like a rule.",
      "You step back from feeling altogether and watch your own relationship from a distance, and your partner experiences you as absent.",
    ],
  },
  // Pisces
  {
    core: "You are deeply tender, and only a bond with a spiritual basis lasts for you, which means two inner lives actually in contact, most often in shared silence. You need quiet time together, nature and gentle light.",
    expressions: [
      "You sit in silence with a partner, by water or by candlelight, and feel wholly met.",
      "You meet a partner’s failings with compassion and humour, and they feel forgiven.",
      "A hard conversation comes due and you slip away into whatever is pleasant: a screen, a drink, a daydream.",
      "Escape becomes the pattern, and you are absent from your own relationship while still living in it.",
    ],
  },
];

/** The Moon in each sign: what must be fed for your heart to trust. */
export const MOON_LOVE: Reading[] = [
  // Aries
  {
    core: "Your heart trusts someone who meets your fire without flinching. Showing a partner your anger directly is an act of trust, you are instinctively loyal, and your feelings need adventure to stay well.",
    expressions: [
      "You show your anger to someone you trust, they stand their ground, and you feel closer than before.",
      "You defend the people you love by instinct and are first on your feet when one of them is threatened.",
      "Starved of adventure, you become touchy and competitive over things that do not matter.",
      "Home runs as one crisis after another, with you at the centre of each.",
    ],
  },
  // Taurus
  {
    core: "Your heart is fed by touch, creature comforts and unhurried quiet. Your need to touch and be touched is high, you are unembarrassed about your body once you trust someone, and animals, plants and nature at home steady you.",
    expressions: [
      "You spend a silent evening against a partner’s side and need nothing else.",
      "You make home a place of good food, soft surfaces and growing things, and people relax as they walk in.",
      "You sidestep a conflict to keep the peace and swallow the annoyance.",
      "The swallowed resentment builds for months and then detonates all at once over something small.",
    ],
  },
  // Gemini
  {
    core: "Communication is your core need, light banter included, because talk itself is what makes you feel connected. Fresh shared experiences feed the bond, and you are at home in a busy, slightly chaotic household.",
    expressions: [
      "You and a partner talk all day about everything and nothing, and that is the closeness.",
      "You keep trying new places and things together, and each one gives you more to say to each other.",
      "Life goes routine, and you turn restless and vaguely discontented without knowing why.",
      "You fill every silence with chatter that keeps you occupied and brings you no closer.",
    ],
  },
  // Cancer
  {
    core: "Your tender core is deeply hidden, often behind a quite different outward manner, and takes a long time to reach. You nurture by nature, and you need a warm, enclosing home where your heart settles.",
    expressions: [
      "Someone waits long enough to reach you, and you give them a tenderness few people ever see.",
      "You make a snug, sheltering home and feed and tend everyone in it.",
      "You look after a partner in place of being close to them, and the care becomes your hiding place.",
      "You choose people who need care and cannot return it, which keeps your own heart safely unasked for.",
    ],
  },
  // Leo
  {
    core: "Your heart needs applause and is shy about asking for it. You need a partner in the front row, visibly enjoying what you create, whether a meal or a new look, and a home you are proud of.",
    expressions: [
      "A partner delights openly in what you make, and you grow playful, generous and more daring.",
      "You pour yourself into a creative outlet and into a home you are proud to show.",
      "You go unnoticed, it hurts more than you let on, and you say nothing.",
      "You sulk, turn distant, and an estrangement sets in that neither of you names.",
    ],
  },
  // Virgo
  {
    core: "A constant discontent runs through you, and it is either petty worry or the drive that builds a life with care. Closeness for you depends on free-flowing talk, when you trust someone you share your self-doubts, and you run a tight ship at home.",
    expressions: [
      "You look at yourself honestly, give concrete support, and build a shared life methodically, one improvement at a time.",
      "You tell a trusted partner your doubts about yourself, and the telling is your intimacy.",
      "The discontent turns to worry over small things, and you cannot let a detail lie.",
      "Home becomes a list of tasks with no rest in it, for you or for anyone who lives with you.",
    ],
  },
  // Libra
  {
    core: "Your heart needs courtesy, gentleness and beauty around it, and you treat intimacy as an art. A crude or careless remark puts you off at once, and even the cleanliness of a room affects how you feel.",
    expressions: [
      "You make a serene, beautiful home and bring care to the smallest exchanges in it.",
      "You sense a partner’s mood before they speak and adjust with tact.",
      "You smooth over a disagreement so thoroughly that you no longer know what you wanted.",
      "You live behind sweet agreeableness, and a partner has no idea who is behind it or what you need.",
    ],
  },
  // Scorpio
  {
    core: "Your heart hungers for honesty that keeps deepening, and without it every relationship feels unsatisfying. You periodically descend into yourself and go distant, and you need a partner who respects that rhythm, is fully present when you return, and tolerates feelings shown bare at home.",
    expressions: [
      "You and a partner keep telling each other more of the truth, and your trust deepens every year.",
      "You go under for a while, come back, and share what you found there.",
      "The hunger goes unfed and shows as moods that simmer for days.",
      "You erupt over a thin pretext, and neither of you can say what the fight was really about.",
    ],
  },
  // Sagittarius
  {
    core: "Your heart needs not to need. You have to feel that you choose a partner freely, so you keep your practical self-sufficiency, and you want a colourful, unconventional home life.",
    expressions: [
      "You stay able to stand on your own feet, and you choose your partner afresh from that position.",
      "You make a home full of travel plans, unusual friends and open questions.",
      "You put a partner on a pedestal and keep them at arm’s length in the same breath.",
      "Commitment feels like a trap closing, and you treat the person you love as the one who set it.",
    ],
  },
  // Capricorn
  {
    core: "Your inner weather is solitude, which is not loneliness. You need time alone and large projects of your own, an orderly home, and a partner who is content to be loved without being strictly needed.",
    expressions: [
      "You take your time alone, return rested, and share what you have been building.",
      "You love a partner steadily without leaning on them, and they feel respected.",
      "You assume everyone is finally alone, share nothing of your inner life, and your partner feels shut out.",
      "Caution hardens into fear, and you take control of the money, the home, the conversation and your partner.",
    ],
  },
  // Aquarius
  {
    core: "Your heart needs breathing room, and short separations heal you. You have to know who you are apart from everyone’s expectations before you commit, and you need a partner whose own idea of a relationship is unconventional.",
    expressions: [
      "You spend time apart, come back glad to see each other, and the bond is stronger for it.",
      "You make an exotic, rule-breaking home that looks like nobody else’s.",
      "Ordinary closeness feels claustrophobic, and you find reasons to be in another room.",
      "You commit before you know yourself, feel stifled, and your partner lives with someone detached and out of reach.",
    ],
  },
  // Pisces
  {
    core: "Your heart wants a merging of spirits, in quiet and in physical love, and home has to be a sanctuary. You bring great gentleness, and you have to ask for what you want and lead a partner into depth.",
    expressions: [
      "You tell a partner what you want and draw them into the depth you live in, and physical love becomes a meeting of spirits.",
      "You keep a hushed, sheltered home where both of you recover from the world.",
      "A harsh, jangling atmosphere sends you off into dreamland, present in body only.",
      "You sacrifice yourself piece by piece and go through the motions of the relationship, sleepy and quietly martyred.",
    ],
  },
];

/** The rising sign: what you lead with and look for in a first meeting. */
export const RISING_LOVE: Reading[] = [
  // Aries
  {
    core: "You meet people head on, with candour and energy, and your interest is plain from the first minute. You stay forthright, and you let a new person see the warmth and loyalty that come with it.",
    expressions: [
      "You say what you want at the outset, the other person answers in kind, and nothing has to be guessed.",
      "You show your warmth alongside your frankness, and a new person relaxes into your directness.",
      "You come in at full force, the other person steps back, and you are left wondering what happened.",
      "You meet every newcomer with a challenge, and people who would have loved you well leave before they see your loyalty.",
    ],
  },
  // Taurus
  {
    core: "You lead with a disarming naturalness and honesty, and you are at ease in your body. Familiarity arises fast around you, and in a first meeting you look for someone unhurried and real.",
    expressions: [
      "You are simply yourself on a first meeting, and the other person drops their guard within minutes.",
      "You offer food, a walk or a comfortable silence, and intimacy grows without anything being said about it.",
      "You plant yourself in what is comfortable and will not be moved, even when the relationship needs you to change.",
    ],
  },
  // Gemini
  {
    core: "You lead with quickness, alertness and good cheer, and conversation is how you first reach someone. The bright surface hides real feeling, and your strongest move is a short, plain statement from the heart followed by silence.",
    expressions: [
      "You say one plain sentence about what you feel, stop talking, and the other person finally sees you.",
      "You charm a new person with questions and stories, and they leave feeling interesting.",
      "You answer a tender moment with a joke or a new topic, and it passes.",
      "You talk over your own feelings for so long that a partner concludes there is little underneath, and treats you accordingly.",
    ],
  },
  // Cancer
  {
    core: "You lead with care and caution, and you study a person closely before you let them near. Getting a foot in your door is the hard part, and once someone passes, your care arrives in a flood.",
    expressions: [
      "You watch someone long enough to trust them, and then you open completely and look after them wholeheartedly.",
      "You notice what a new person needs before they ask and quietly provide it.",
      "You keep the study going long after the evidence is in, and the other person tires of waiting at the door.",
      "Someone who would have been good for you meets only your reserve and goes away.",
    ],
  },
  // Leo
  {
    core: "You lead with a regal presence that seems to need nothing. Behind it are a hunger to be appreciated and a real insecurity, and sincere praise is what opens you.",
    expressions: [
      "Someone praises you sincerely, the dignified front softens, and they meet a warm and playful person.",
      "You carry yourself with presence, and people feel that an occasion has begun when you arrive.",
      "You wait to be admired and never say that you need it, so most people assume you are fine.",
      "Starved of appreciation, you turn to stone: composed, silent and unreachable.",
    ],
  },
  // Virgo
  {
    core: "You lead with competence and precision, and people ask for your help early. You talk in exact, abundant detail, you need support for your work, and the task for anyone close is to get beneath the words to your heart.",
    expressions: [
      "You let someone past the detail to what you feel, and they find you far more tender than your precision suggested.",
      "You are the capable one people turn to, and you help them well.",
      "Feeling insecure, you start doing things for a partner in place of opening up to them.",
      "You bury every feeling under explanation and errands, and a partner lives with your service and never your heart.",
    ],
  },
  // Libra
  {
    core: "You lead with warmth and a gift for rapport that tells people you are on the same page. You work to reduce friction, and love plays a larger part in your life story than in most.",
    expressions: [
      "You put a stranger at ease in minutes and find the real common ground between you.",
      "You bring grace to a first meeting, and the other person feels attended to.",
      "You agree your way through the early weeks, and the other person overestimates how alike you are.",
      "The differences you smoothed away surface later, and a partner feels they committed to someone who was not there.",
    ],
  },
  // Scorpio
  {
    core: "You lead with intensity and a searching attention that goes straight past small talk. You need a real meeting of inner lives and a partner in growth, and without them all feeling fades.",
    expressions: [
      "You look closely at someone, they look back just as honestly, and the conversation goes deep in the first hour.",
      "You find a partner who wants to grow, and your intensity becomes the engine of the relationship.",
      "You fall fast into a dramatic closeness with someone as intense as you, and neither of you knows what to do next.",
      "No meeting of inner lives happens, your feeling drains away completely, and you are gone in all but body.",
    ],
  },
  // Sagittarius
  {
    core: "You lead with humour, generosity and a wide-open interest in the world, and that draws romantic attention. You need novelty, and your quarrel is never with commitment itself, only with commitments that feel like prison.",
    expressions: [
      "You commit to a relationship with room to move in it, and you are generous and wholehearted there.",
      "You arrive laughing, with a story from somewhere far away, and people want to come along.",
      "A commitment starts to feel like a cell, and you grow restless and short-tempered inside it.",
      "You walk away from the whole relationship when your real objection was only to the lack of room.",
    ],
  },
  // Capricorn
  {
    core: "You lead with composure, shrewdness and a poker face, and you watch carefully before you show your hand. For love you have to become transparent, and letting someone see behind the composed face is how love begins for you.",
    expressions: [
      "You decide someone is steady, show them what is behind the composure, and love starts from that moment.",
      "You bring good judgement to a new relationship and are not rushed into anything.",
      "You keep the poker face in place too long, and a partner cannot tell how you feel.",
      "You never become transparent, and someone spends years beside you without being let in.",
    ],
  },
  // Aquarius
  {
    core: "You lead with friendliness and an independent mind, and you are cooler at close quarters than at a distance. Pressure to conform pushes you to show a normal-looking version of yourself, and you thrive with a partner who cheers on your wildness.",
    expressions: [
      "A partner cheers on your strangest side, and you bring all of yourself into the room.",
      "You are everyone’s friendly equal, and you leave people free to be exactly who they are.",
      "You present a conventional version of yourself to fit in, and a partner senses that someone is missing.",
      "You hide behind the normal-looking front so completely that a partner feels they are living with a projection.",
    ],
  },
  // Pisces
  {
    core: "You lead with sensitivity and adaptability, and you fit into any setting or company. You need a partner who makes room for your quiet time, your reflection and your creative life, and those three are the measure of how a relationship is treating you.",
    expressions: [
      "You keep your quiet hours and your creative work inside a relationship, and you stay recognisably yourself.",
      "You sense what a room or a person needs and meet it gracefully.",
      "You take on a partner’s tastes, schedule and expectations without noticing you have done it.",
      "Your contemplative and creative life shrinks to nothing, and you play a part in someone else’s life.",
    ],
  },
];

/** Venus in each sign: what warms you, how you attract, what you need in a partner. */
export const VENUS_LOVE: Reading[] = [
  // Aries
  {
    core: "You warm to independence, directness and spirit, and you attract by being bold and throwing down a challenge. You need a relationship where strong feelings, pleasant or not, are said aloud, because unspoken anger deadens love for you.",
    expressions: [
      "You and a partner say everything, the furious things included, and you both grow braver for it.",
      "You pursue someone openly and enjoy a little healthy competition with them.",
      "Anger goes unspoken, and your affection goes flat within days.",
      "You provoke a confrontation in order to feel something, and choose the fight over the peace every time.",
    ],
  },
  // Taurus
  {
    core: "You warm to earthy people at ease in their bodies and outdoors, and you attract through physical ease and soothing company. You want a lasting bond that keeps you calm, simple and close to your instincts, and you have no patience for histrionics.",
    expressions: [
      "You and a partner touch easily and often, and physical love between you is natural and unforced.",
      "You calm the people you love simply by being near them.",
      "A partner raises their voice or stages a scene, and you close off until it is over.",
      "You refuse all emotional weather, and a partner with a real grievance finds nobody willing to hear it.",
    ],
  },
  // Gemini
  {
    core: "You warm to curious people with many interests, and you attract through conversation, stories and flirting. You need a relationship that keeps your mind open and unjudging, and you are never boring company.",
    expressions: [
      "You and a partner keep discovering things and bringing them home to each other.",
      "You flirt with ideas, with strangers and with your own partner, and the relationship stays light on its feet.",
      "A partner turns fixed and judging, and your affection cools at once.",
      "Your interest slides to whoever is newest, and you sample and move on without choosing anyone.",
    ],
  },
  // Cancer
  {
    core: "You attract by being tender, protective and a place to come home to. You need a gentle, nurturing partner and a relationship that is safe and lasting, and you open only after gentleness has been shown over time.",
    expressions: [
      "Someone proves gentle over months, you open, and you enjoy their imagination and whimsy as much as their kindness.",
      "You become a partner’s home base, the person they return to.",
      "You wait for more proof than anyone could supply, and a kind person gives up.",
      "You protect your feelings so thoroughly that you never risk them, and love stays theoretical.",
    ],
  },
  // Leo
  {
    core: "You warm to presence and charisma, and you attract with drama, generosity, humour and noble gestures. You need an atmosphere of spontaneity and guaranteed mutual approval, in which both of you shine.",
    expressions: [
      "You and a partner applaud each other openly, and both of you are funnier and braver together.",
      "You make the grand gesture, the party, the gift or the public declaration, and mean every part of it.",
      "You sense judgement, and your warmth switches off until you are sure of your welcome.",
      "You need a partner’s approval confirmed again and again, and no amount of it settles you.",
    ],
  },
  // Virgo
  {
    core: "You warm to people devoted to their work or craft and serious about growing, with wit and discernment. You attract by honesty, attention to detail and making yourself indispensable, and you need a relationship of active mutual help that keeps developing.",
    expressions: [
      "You and a partner actively help each other grow, and each of you is better at your work and your life for it.",
      "You notice the small thing a partner needs and quietly see to it.",
      "A relationship stalls, you cannot bear it, and your wish to mend it arrives as a list of corrections.",
      "You make yourself indispensable and stay on the strength of being useful, long after the affection has thinned.",
    ],
  },
  // Libra
  {
    core: "You are drawn to creative, warm, tactful people, and you attract through social grace, fairness and love of beauty. You need romance, courtesy and constant attention to each other’s feelings, and crudity repels you.",
    expressions: [
      "You and a partner read each other closely and treat each other with unfailing courtesy.",
      "You bring beauty into shared life, in the table you lay and the way you speak.",
      "You keep an evening pleasant by leaving out the thing you needed to say.",
      "You hold on to the appearance of harmony at any cost, and the relationship turns into a lovely surface with nothing true beneath it.",
    ],
  },
  // Scorpio
  {
    core: "You warm to people capable of radical honesty who do not flee emotional depth. You attract through mystery, power and a simmering sexuality, and you need room for both of you to be nakedly human together without judgement.",
    expressions: [
      "You and a partner show each other everything, and neither of you is judged for it.",
      "You draw someone in with what you leave unsaid, and they want to know more.",
      "You catch a hint of evasion and begin watching a partner closely for the next one.",
      "One deception, however small, and your trust is gone and does not return on request.",
    ],
  },
  // Sagittarius
  {
    core: "You warm to easygoing, tolerant, funny, principled people with an appetite for experience. You attract as an explorer or philosopher who promises adventure, ideas and fascinating friends, and you need a relationship that widens your view and restores your delight in love.",
    expressions: [
      "You and a partner travel, read and argue together, and life gets larger.",
      "You bring a partner into a circle of interesting friends and big questions.",
      "Restriction or boredom sets in, and you feel you have settled for less.",
      "You look past the person in front of you towards the next horizon, and leave a good relationship because it stopped being new.",
    ],
  },
  // Capricorn
  {
    core: "You warm to responsible, self-contained, practical people, often ones with real mastery of something, and you attract through reserve and still waters. You are not afraid of commitment, and you want a grown-up bond built on integrity, with solitude for each of you.",
    expressions: [
      "You commit to an adult who keeps their word, and the bond deepens steadily for decades.",
      "You show love by being dependable and by respecting a partner’s privacy and your own.",
      "A partner leans on you heavily or behaves childishly, and your respect for them drops.",
      "Your reserve deepens until your affection is invisible, and a partner concludes you have stopped caring.",
    ],
  },
  // Aquarius
  {
    core: "You warm to free-spirited, non-possessive people who break rules, and you attract through originality, truth-telling and the message that someone is free to be themselves with you. You need a great deal of space in love and give as much.",
    expressions: [
      "You and a partner give each other wide freedom and are closer for having chosen it.",
      "You tell a partner the truth and welcome everything unusual in them.",
      "The space you give widens into detachment, and a partner feels unattended.",
      "You feel useful to someone without being seen by them, and you go absent in intimacy, present in body and nowhere else.",
    ],
  },
  // Pisces
  {
    core: "You warm to visionary, otherworldly people, and you attract as a mystic, poet or dreamer who offers refuge from the everyday. You need a bond between two consciousnesses that joins the sexual and the spiritual, and harsh light and hard questioning drive you away.",
    expressions: [
      "You and a partner make love as a meeting of two inner lives, and both of you feel restored.",
      "You offer a partner a refuge from the ordinary, with music, low light and imagination.",
      "A partner interrogates you or the atmosphere turns harsh, and you retreat inward.",
      "You slip out of reach altogether while still in the room, and a partner cannot find you.",
    ],
  },
];

/** Mars in each sign: what you desire, how you pursue, what gives you energy. */
export const MARS_LOVE: Reading[] = [
  // Aries
  {
    core: "You desire openly and pursue directly, and you enjoy the chase and a contest for someone’s heart. You are fiercely protective, and challenge and winning give you energy.",
    expressions: [
      "You go after the person you want with nothing hidden, and they know exactly where they stand.",
      "You take on a challenge you chose, win it, and bring that vitality home.",
      "You have no challenge of your own, and your temper looks for an outlet at home.",
      "Defeat follows defeat, your drive collapses, and old anger turns on whoever is closest.",
    ],
  },
  // Taurus
  {
    core: "You want sensual pleasure without shame, and you pursue as the provider of comfort: food, touch, scent, time outdoors. You relax the person you want, you are determined once you have decided, and contact with your body and with nature feeds you.",
    expressions: [
      "You cook for someone, take them outside, touch them without hurry, and desire follows naturally.",
      "You decide on a person and pursue them patiently until they are sure too.",
      "You stay indoors and in your head too long, and your desire dulls.",
      "You override your instincts and feel shame about wanting, and physical love becomes something you avoid.",
    ],
  },
  // Gemini
  {
    core: "You hunger for variety and for a free exchange of ideas, and you pursue with wit, messages, stories and new things to do together. You open a dialogue and keep it going, and ideas, debate and novelty give you energy.",
    expressions: [
      "You court with conversation, and years later you are still sending a partner things to read and argue about.",
      "You argue with questions and enjoy a debate that changes your mind.",
      "A partner turns certain and incurious, and your energy for them drains.",
      "Your desire scatters towards whoever is new, and you handle it with a carelessness you have not examined.",
    ],
  },
  // Cancer
  {
    core: "You want a safe setting for real bonding, and you pursue by proving how nurtured and protected someone would be with you, privately hoping for the same in return. You defend your home fiercely, and having someone to nurture gives you energy.",
    expressions: [
      "You make someone safe, they make you safe in return, and desire comes freely inside that.",
      "You stand between your household and anything that threatens it.",
      "You give care and hope silently for it to be returned, and say nothing when it is not.",
      "You fear desire running out of control and causing pain, so you hold it down, and you are used as a carer with nowhere to retreat.",
    ],
  },
  // Leo
  {
    core: "You express desire with warmth, confidence and healthy pride, and you are a master of courtly romance: loyal, generous and well staged. Play, humour, praise and leading in something that matters give you energy.",
    expressions: [
      "You stage a courtship with real flair, and the other person feels chosen.",
      "You lead something you care about, and the confidence carries into your love life.",
      "The fun goes out of a relationship, criticism replaces it, and your desire wilts.",
      "You hide what you want for fear of being laughed at, and nobody sees your desire at all.",
    ],
  },
  // Virgo
  {
    core: "You show desire by being useful, and you pursue by demonstrating how much you help. You treat a relationship as a craft to be perfected, and you bring real competence to looking after a partner.",
    expressions: [
      "You learn exactly what a partner needs and become skilled at giving it.",
      "You work at the relationship as at a craft, and it improves under your hands.",
      "Your help arrives as scrutiny and correction, and a partner feels inspected.",
      "Guilt drives you to keep earning your place, and you hector a partner and yourself without rest.",
    ],
  },
  // Libra
  {
    core: "You pursue as the understanding counsellor, the peacemaker and the romantic, and you want to bridge the distance that suppressed anger creates. Once you engage, conflict energises you, at its best as honest exploration of real differences.",
    expressions: [
      "You bring a real difference into the open, argue it fairly, and both of you feel closer.",
      "You court with understanding and romance, and the other person feels heard.",
      "You put off a necessary conflict for fear of where it leads, and the distance grows.",
      "The anger stays buried on both sides, and you end up isolated inside a polite relationship.",
    ],
  },
  // Scorpio
  {
    core: "You want a relentless, honest, shared process of self-examination that changes you both, and you pursue with magnetic intensity and probing conversation. Passion, deep closeness and the exploration of what is forbidden give you energy.",
    expressions: [
      "You and a partner examine yourselves together without flinching, and both of you are changed.",
      "You pursue with complete attention, and the other person feels seen to the bone.",
      "You show only a sliver of yourself, and your energy drains away.",
      "You suspect deceit and probe until you find something, and the relationship turns into an interrogation.",
    ],
  },
  // Sagittarius
  {
    core: "You want erotic excitement and variety, and you want to act ethically, and the two pull against each other. They meet in a lofty commitment freely chosen. You pursue by offering adventure and your ideals, and travel, causes, humour and new ideas give you energy.",
    expressions: [
      "You choose a commitment freely and on principle, and your appetite for adventure goes into it.",
      "You win someone with a journey, a cause or an idea worth living for.",
      "Routine and confinement close in, and your energy drops.",
      "Appetite and conscience split, and you either stray and despise yourself or stay and feel caged.",
    ],
  },
  // Capricorn
  {
    core: "You show desire through responsible action more than display, and you pursue strategically, with practical reasons why you are the right choice. You want to protect and provide for the one you love, and long-term projects and solitude give you energy.",
    expressions: [
      "You build something lasting for the two of you, and your partner feels protected by it.",
      "You court patiently and deliberately, and you deliver everything you promise.",
      "You get no time alone, and you turn tired and curt.",
      "You pour your drive into the wrong goals and carry a private shame over every way you feel you have failed the one you love.",
    ],
  },
  // Aquarius
  {
    core: "You claim the right to be spontaneously, even rebelliously, yourself in desire, and you pursue as the original thinker or reformer who offers truth and the freedom to be oneself. Freedom of mind and speech, rule-breaking and new frontiers give you energy.",
    expressions: [
      "You desire in your own way, say so, and find a partner who is delighted by it.",
      "You offer a partner honesty and room, and they become freer with you.",
      "Convention and petty control hem you in, and your energy drops.",
      "You resist anything that resembles a rule, including the reasonable requests of someone who loves you.",
    ],
  },
  // Pisces
  {
    core: "You want erotic and spiritual passion fused, and you pursue gently, with enchantment, poetry and imagination, wanting to touch someone’s soul. What you are after is the strength to surrender, and contemplation, dreaming and devotion to an ideal give you energy.",
    expressions: [
      "You surrender fully with someone you trust, and desire becomes a kind of devotion.",
      "You court with imagination and gentleness, and the other person feels their inner life has been reached.",
      "You get no dreaming time, and your desire goes quiet.",
      "You swing between renouncing desire and being swept away by it, and harshness shuts you down entirely.",
    ],
  },
];

export type LoveHouse = 4 | 5 | 6 | 7 | 8;

export const HOUSE_LOVE: Record<
  LoveHouse,
  {
    /** What this house is about in love, one or two sentences. */
    meaning: string;
    /** What it means to have no planets there, one sentence, if the notes say; else a neutral line. */
    empty: string;
    /** Each planet in this house. "node" is the North Node, "southnode" the South Node. */
    planets: Record<
      | "sun"
      | "moon"
      | "mercury"
      | "venus"
      | "mars"
      | "jupiter"
      | "saturn"
      | "uranus"
      | "neptune"
      | "pluto"
      | "node"
      | "southnode",
      Reading
    >;
  }
> = {
  4: {
    meaning:
      "The fourth house is about home, roots and family. It comes alive when you share a roof, money and daily routine with someone, and it shows what home must be for you and which family patterns you might repeat.",
    empty:
      "No planets here does not mean home matters less to you, only that your chart describes what you need at home through other placements.",
    planets: {
      sun: {
        core: "Inwardness, privacy and time to reflect feed your vitality, and that is not shyness. You have a deep capacity to commit to home and family, and you need someone who respects silence, puts home first and puts down roots in one place with you.",
        expressions: [
          "You root yourself in one home with one person and give it the best of your energy.",
          "You withdraw to think, come back restored, and a partner who respects the silence gets your full presence.",
          "Someone intrudes on your privacy, and your trust in them drops.",
          "You retreat so far into yourself that the people you live with cannot find you.",
        ],
      },
      moon: {
        core: "You need solitude, deep roots and a warm hearth of long, familiar bonds. An emotionally available partner at home is what lets your heart rest, and coldness under your roof is the one thing you cannot live with.",
        expressions: [
          "You keep a home full of long-standing attachments, and your heart is at rest in it.",
          "You take the downtime you need and are tender and present afterwards.",
          "You go without quiet, and you grow vague and unavailable.",
          "A partner is emotionally distant at home, and you shut down and live there as if alone.",
        ],
      },
      mercury: {
        core: "You want home to be a salon of ideas and conversation where anything is discussed. You need to live with someone curious, communicative and energetic, and a closed mind under your roof is unbearable to you.",
        expressions: [
          "Your kitchen table is where everything gets talked through, and guests stay late.",
          "You and a partner read, argue and report the day to each other every evening.",
          "A partner stops responding, and you feel unheard in the one place you most want to speak.",
          "Home falls silent, and you go silent with it, your thoughts kept to yourself.",
        ],
      },
      venus: {
        core: "You are slow to trust, and you grow on people. You need privacy with a partner and a beautiful, harmonious nest, and home is where your love is actually lived. Your habits of loving run deep and go unquestioned until you look at them; looked at, they leave you capable of a lasting bond that is close to sacred.",
        expressions: [
          "You look hard at your own habits of loving, keep the good ones, and build a bond of unusual depth and length.",
          "You make a private, beautiful home with a partner, and your trust in them grows year on year.",
          "You keep things pleasant on the surface at home, smiling over what you feel.",
          "You steer a partner through charm and indirection in place of asking, and neither of you knows what is real.",
        ],
      },
      mars: {
        core: "You have core resilience, and you are fiercely protective of home and the people in it. You need a strong, loyal, adventurous partner with the nerve to stand in front of your anger and hear it out.",
        expressions: [
          "You say you are angry while it is still small, a partner stays and listens, and it is finished in an hour.",
          "You defend your household without hesitation and hold up under strain that would flatten others.",
          "You hold anger in silence, and the house fills with it.",
          "The anger explodes all at once, and a partner who shrinks from it loses your respect.",
        ],
      },
      jupiter: {
        core: "You want a generous, abundant home with an open door. You need to share it with someone optimistic, humorous and free of pettiness, and you do not tolerate meanness or needless austerity under your roof.",
        expressions: [
          "You keep an open house where there is always enough, and people leave it feeling larger.",
          "You and a partner laugh a great deal at home and plan expansively.",
          "A partner is constantly negative or pinches every penny, and the bond weakens.",
          "You fight any feeling of scarcity with excess, overspending and overpromising to keep the house feeling full.",
        ],
      },
      saturn: {
        core: "You are learning to take the vows of a shared home with full seriousness, and you bring reliability and staying power to them. Being that exposed to another person makes you wary, and you need a mature, competent partner with integrity who is grounded in what is real.",
        expressions: [
          "You commit to a shared home and keep that commitment through every difficulty.",
          "You build the household carefully, with the finances sound and every promise kept.",
          "You hold back from fully sharing a home, in one way or another, wary of being that exposed.",
          "A partner proves immature or self-indulgent, your wariness is confirmed, and you live together behind a wall.",
        ],
      },
      uranus: {
        core: "You need a home that supports your individuality, and your household and way of living look nothing like the conventional one. You do not fit the mould of the clan, and you need an independent partner who is immune to social pressure.",
        expressions: [
          "You and a partner set up a household on your own terms, and it suits you both exactly.",
          "You keep your independence under a shared roof and give a partner theirs.",
          "The atmosphere at home turns domineering or blindly conventional, and you feel stifled.",
          "You feel like the odd one out in your own family and your own house, and you keep one foot out of the door.",
        ],
      },
      neptune: {
        core: "You need a hearth that shelters your sensitivity and your inner life, a sanctuary where quiet is respected. Noise and bad moods jangle you easily, and you need a sensitive partner who is open to the mystical side of life.",
        expressions: [
          "You make home a sanctuary, and both of you come back to yourselves there.",
          "You share quiet, contemplative hours with a partner who values them.",
          "Noise and ill temper fill the house, and you are unsettled for days.",
          "A partner dismisses your quiet states as nonsense, and you hide your inner life from the person you live with.",
        ],
      },
      pluto: {
        core: "You need a home where intensity, the working-through of feeling and total psychological honesty are welcome. You bring depth to family life, you brood when home life stays on the surface, and you need an intense, honest partner willing to look deeply at both of you.",
        expressions: [
          "You and a partner talk through everything at home, the family history included, and it loses its grip.",
          "You make a household where nobody has to pretend about anything.",
          "Home life stays superficial, and you brood behind a closed door.",
          "Unspoken family pain weighs on the house, and you carry it alone and in silence.",
        ],
      },
      node: {
        core: "Making a real home is your least familiar task and the one that develops you most. Putting home and private life ahead of your public role feels awkward, and it is right.",
        expressions: [
          "You put home first, awkwardly at the start, and find a private life that feeds you.",
          "You learn the ordinary skills of living with someone, one clumsy attempt at a time.",
          "Work and public duty keep winning, and home remains something you mean to get to.",
          "Your public role swallows your life, and there is no room in it for anyone to be close to you.",
        ],
      },
      southnode: {
        core: "Family and clan are your familiar ground, and you know the ways of the household you come from by heart. You are far more likely than most to re-enact those patterns in your own relationships and home unless you examine them.",
        expressions: [
          "You look plainly at how your family did things and choose which of it to keep.",
          "You bring real skill at family life into a home of your own making.",
          "You run your household exactly as your family ran theirs, without ever having decided to.",
          "You replay your family’s oldest quarrels with a partner cast in a relative’s part.",
        ],
      },
    },
  },
  5: {
    meaning:
      "The fifth house is about falling in love, play and enjoyment. It shows what has to be present at the start for a relationship to have a chance, and what renews a long one.",
    empty:
      "No planets here means romance and play are not a main emphasis of your chart, though the need to enjoy each other still applies to you.",
    planets: {
      sun: {
        core: "You have a legitimate need to be seen, and play and creative self-expression soften you and bring out your warmth. To start or renew love you need shared play, creativity and taking turns as each other’s audience.",
        expressions: [
          "You and a partner play, make things and applaud each other in turn.",
          "You show what you have created, are seen, and soften.",
          "Someone judges you for wanting attention, and the feeling goes flat.",
          "You are drawn to a person who needs to dominate you, and the affair turns into a contest over who gets to be seen.",
        ],
      },
      moon: {
        core: "You heal by being heard, by performing and by frankly having a good time, and you take joy in nurturing, through cooking, listening or play with children. To start or renew love you need imagination, tenderness and the sharing of innermost feelings.",
        expressions: [
          "You cook, listen and play with the people you love, and you are restored by it.",
          "You and a partner share your innermost feelings, and romance begins again.",
          "Joy runs short, and you make up the deficit with too much food, drink or sex.",
          "You attach to someone who becomes dependent on you or needs you dependent on them, and it passes for love.",
        ],
      },
      mercury: {
        core: "You need your voice heard, and love for you is a conversation that runs late into the night for decades. To start or renew it you need wit, real mental rapport and shared interests.",
        expressions: [
          "You and a partner are still talking at two in the morning, years in.",
          "You find a shared interest, and the relationship wakes up.",
          "A partner meets you with stony silence or a determination to be bored, and the feeling dies quickly.",
          "You are caught by a glib, clever talker who hides their heart behind words, and you hide yours the same way.",
        ],
      },
      venus: {
        core: "You are renewed by style, conscious sensuality and making beautiful things, and you are drawn to charming, refined, creative people. To start or renew love you need grace, harmony, care in how each of you presents yourself, and each of you romancing the other.",
        expressions: [
          "You and a partner keep romancing each other, dressing for it and making an occasion of it.",
          "You make something beautiful together, and desire returns.",
          "Coarseness or carelessness appears, and the feeling goes.",
          "You fall for apparent perfection, polished charm with a tangled history behind it, and learn what it covers only later.",
        ],
      },
      mars: {
        core: "You have a strong, even angry, need to release your life force in play, sport and physical love, and a fear of letting it out. To start or renew a relationship you need adrenaline, heat, intensity and things to do together.",
        expressions: [
          "You and a partner compete, sweat and make love with full energy, and both of you are more alive.",
          "You say directly what you want, and the heat between you is immediate.",
          "You hold the energy in, and it presses to get out as irritation.",
          "You are pulled towards someone carrying unresolved anger, and the affair runs on fighting.",
        ],
      },
      jupiter: {
        core: "You want relationships that make life larger, and pleasure and expansiveness renew your faith in life. To start or renew love you need an open, questing spirit and an appreciation of fun, with someone robust, funny, optimistic and principled.",
        expressions: [
          "You and a partner say yes to the big trip or the big plan, and your faith in life comes back.",
          "You enjoy pleasure without guilt and treat body and spirit as allies.",
          "Pettiness or prudishness enters, and the feeling shrinks.",
          "You are swept up by someone who promises far more than they deliver, and you believe them longer than the evidence warrants.",
        ],
      },
      saturn: {
        core: "You take quiet satisfaction in accomplishment more than in wild fun, and you do not give your heart away quickly. To start or renew love you need maturity and respect for your serious side, with a self-sufficient adult who is unafraid of commitment and in no hurry.",
        expressions: [
          "You take your time, choose a grown adult, and give your heart completely.",
          "You and a partner build or achieve something together, and that is your romance.",
          "You say far less than you feel, and a partner has to guess.",
          "You meet someone closed and fearful who never opens, and the two of you keep a careful distance for years.",
        ],
      },
      uranus: {
        core: "You want to be treated as one of a kind, never by formula, and you are drawn to free spirits who give and want space. To start or renew love you need freedom, individuality and the unexpected, and you create with no concern for anyone’s verdict.",
        expressions: [
          "You and a partner surprise each other, and no two years of the relationship look alike.",
          "You take up with someone your circle did not expect, and you do not mind the raised eyebrows.",
          "The relationship turns predictable and anxious about opinion, and the feeling flattens.",
          "You fall for someone committed only to their own independence, who stays out of reach however long you wait.",
        ],
      },
      neptune: {
        core: "Romance for you is mixed with mysticism and a longing that has no name, and you are drawn to gentle, soulful people and wordless connection. To start or renew love you need mystery, magic and otherworldliness, and the right people want only your presence.",
        expressions: [
          "You and a partner sit together without speaking and feel entirely connected.",
          "You bring magic back with music, water or a night under the stars.",
          "Hard practicality takes over, and the feeling evaporates.",
          "You are drawn to a lost soul looking for escape, who leans on you until you are drained.",
        ],
      },
      pluto: {
        core: "Relaxing and trusting in romance is hard won for you, and its cure is emotionally deep self-expression, pain turned into art. To start or renew love you need passion, depth, honesty and intensity, with someone willing to begin a hard conversation.",
        expressions: [
          "You turn what hurts into something made, a song, a page or a confession, and you relax into love.",
          "You and a partner start the hard conversation, and passion returns with it.",
          "You cannot relax at the start of an affair and wait for the catch.",
          "You are drawn to someone who plays your analyst, full of insight into you and defensive the moment you offer any back.",
        ],
      },
      node: {
        core: "Play, courtship and spontaneous self-expression are unfamiliar to you, and they are the direction that develops you most. You grow by learning to play, dropping the strategy and exploring new relationships.",
        expressions: [
          "You let yourself enjoy a new connection with no plan for it.",
          "You try something creative badly and in public, and find you like it.",
          "You stay strategic on a date, managing it like a meeting.",
          "You treat pleasure as something to be earned first, and the earning never ends.",
        ],
      },
      southnode: {
        core: "Romance, pleasure and creativity are your familiar ground, and you are at home in the early, intoxicating stage of love. Your risk is being unable to move past that stage.",
        expressions: [
          "You bring real gifts for courtship and play into a relationship that also has a future.",
          "You think constructively about where a relationship is going and take the next step.",
          "The romance fades, and you grow restless and look for a fresh audience.",
          "You leave each relationship at the point where the work begins, and start again with someone new.",
        ],
      },
    },
  },
  6: {
    meaning:
      "The sixth house is about humility and responsibility in love, which means seeing your own part in your relationship troubles and accepting that neither you nor a partner is perfect. It also describes the role models who can teach you how to love well.",
    empty:
      "No planets here means this house is not a main emphasis of your chart, though honesty about your own part still matters in any relationship.",
    planets: {
      sun: {
        core: "You hide your heart behind supportiveness and duty, and that breeds hidden anger and a private sense of superiority. You have every right to exist, to ask and to be seen as you are, flaws included, and you learn it from colourful people who take up space and shine.",
        expressions: [
          "You ask for what you want, let yourself be seen as you are, and your support becomes a gift freely given.",
          "You apprentice yourself to someone who shines without apology, and you take up more room.",
          "You stay helpful and dutiful and keep your heart out of sight.",
          "Resentment builds under the service, along with a quiet conviction that you are the better person.",
        ],
      },
      moon: {
        core: "You are afraid of being seen without defences, and you show love only through what you do. You learn most from warm, emotionally present people who teach that intimacy comes through openness, eye contact and touch.",
        expressions: [
          "You let someone look at you and hold you with nothing to do for them, and you stay.",
          "You learn from an emotionally present person how to receive care.",
          "You express love by fixing, fetching and arranging, and never say it.",
          "You slide into servitude, endlessly useful and never known.",
        ],
      },
      mercury: {
        core: "You need help with intimate dialogue. Your verbal skill and your well-made arguments block two-way connection, and you learn most from storytellers who are even better listeners, people who make you want to tell them everything.",
        expressions: [
          "You ask a question, wait, and draw a partner out until they have said it all.",
          "You learn listening from someone who does it superbly.",
          "You win the argument and lose the conversation.",
          "You talk so well that nobody near you gets a word of their own in, and intimacy never starts.",
        ],
      },
      venus: {
        core: "Lasting sexual love is an art and a craft, and you do not yet have its full measure. You learn it from gracious, magnetic, romantic people who know how to keep the magic alive, how to be alluring and how to raise hard subjects with diplomacy.",
        expressions: [
          "You study how lasting couples do it and practise, and your relationship keeps its magic.",
          "You learn to raise a hard subject gracefully, and it lands.",
          "You assume romance looks after itself, and it fades for want of attention.",
          "You let attraction die and take that as proof that love was never there.",
        ],
      },
      mars: {
        core: "You eclipse your hotter side. You learn most from fiery, direct people who release anger cleanly, state their sexual needs frankly and know they have the right to be difficult.",
        expressions: [
          "You state your anger cleanly and your desire frankly, and both are received.",
          "You let yourself be difficult when the situation calls for it.",
          "You keep the fierce side out of sight and present only the agreeable one.",
          "Anger and desire both go unstated for years, and you live as a muted version of yourself.",
        ],
      },
      jupiter: {
        core: "You are attached to humility, and you settle for too little. You learn most from confident, expansive, generous people whose faith in you is contagious and who leave everyone around them feeling better about themselves.",
        expressions: [
          "You ask more of love than you thought you were allowed, and receive it.",
          "You keep company with someone who believes in you, and you start to believe it too.",
          "You accept the smaller portion out of habit and call it modesty.",
          "You settle for a relationship far below what you are worth and defend the choice as humility.",
        ],
      },
      saturn: {
        core: "You bring discipline and a strong sense of duty to the people you love, and the pattern of the servant, dressed up as virtue, threatens to consume you. You learn most from serious, accomplished people who harnessed their discipline to a vision they believed in.",
        expressions: [
          "You put your discipline behind something you believe in, and your love is strong and willing.",
          "You learn from an accomplished person the difference between devotion and drudgery.",
          "You give effort nobody asked for and count it as virtue.",
          "You lose yourself in thankless duty until nothing of your own life remains.",
        ],
      },
      uranus: {
        core: "Your wild, unconventional side is an underachiever. It deserves far more room in your relationships than you give it, and you learn most from original thinkers and risk-takers who refused to compromise who they are and came through intact.",
        expressions: [
          "You give your unconventional side real room, and a partner meets the whole of you.",
          "You take one risk a role model would take, and survive it.",
          "You shrink that side to fit in and feel a dull restlessness.",
          "You live a tidy, approved life in which your wild side has no place at all.",
        ],
      },
      neptune: {
        core: "You have sensitive, psychic gifts, and unmanaged they hurt you. You learn most from wise, imaginative, quietly spiritual people who steady and train that sensitivity.",
        expressions: [
          "You train your sensitivity with a steady practice, and it becomes a way of knowing the people you love.",
          "You find a wise guide and learn to tell your own feelings from other people’s.",
          "You soak up a partner’s moods and cannot say which feelings are yours.",
          "You are flooded by everything you take in and end up overwhelmed, exhausted and hurt.",
        ],
      },
      pluto: {
        core: "Your natural intensity is under-represented in the face you show. It belongs in your relationships, and you learn most from deep truth-tellers who look into your eyes and treat that way of being as wholly legitimate.",
        expressions: [
          "You show your full intensity to a partner, and it is welcomed.",
          "You find a deep, truthful person who treats your depth as normal, and the shame lifts.",
          "You show a fraction of what you feel and keep the rest back.",
          "You treat your own intensity as something shameful, and a partner never meets it.",
        ],
      },
      node: {
        core: "Service, practical care and guiding others are your path. You have stood apart for long enough, and being useful to the people you love in ordinary daily ways is what develops you.",
        expressions: [
          "You do the humble daily things for someone you love, and it grounds you.",
          "You pass on what you know and guide someone younger or newer.",
          "You stay in your own inner world while someone close needs practical help.",
          "You become so absorbed in yourself that a partner is alone in the relationship.",
        ],
      },
      southnode: {
        core: "Learning from teachers and authorities is your familiar ground, and you know how to take good advice. The time for deferring is over, and your own guidance is ready to be trusted.",
        expressions: [
          "You trust your own judgement about your relationship and act on it.",
          "You use what your teachers gave you without asking their permission.",
          "You consult a friend, a book or an expert before every decision about your love life.",
          "You hand the authority over your relationship to someone else and follow their answer against your own.",
        ],
      },
    },
  },
  7: {
    meaning:
      "The seventh house is about commitment, trust and seeing a partner as a separate person. You are drawn to people who show its qualities, and they are best taken as examples of traits you can develop yourself, not as suppliers of what you lack.",
    empty:
      "No planets here does not mean partnership is absent or unimportant, only that your chart describes what you need in commitment through other placements.",
    planets: {
      sun: {
        core: "Your life is shaped by a handful of people who change you and whom you change, and mutuality feeds your vitality. What looks like approval-seeking is a search for real agreement. To commit you need full reciprocity with someone who has a solid sense of self and negotiates.",
        expressions: [
          "You state your needs, hear your partner’s, and reach an agreement that holds for both.",
          "You and a few close people change each other for the better over decades.",
          "You orbit a partner and never state your needs.",
          "You stay with someone evasive who keeps trying to dominate you, or you overcorrect and insist on your own way in everything.",
        ],
      },
      moon: {
        core: "You are made for deep, mutually nurturing one-to-one bonding, and your well-being improves greatly when you live in partnership. You are loyal, caring and a natural counsellor, and to commit you need tenderness and room for all feelings, not only the acceptable ones.",
        expressions: [
          "You and a partner tell each other every feeling, including the unpresentable ones, and both of you are cared for.",
          "You listen to the people close to you so well that they find their own answers.",
          "A partner brushes your feelings aside, and your trust weakens.",
          "A partner’s needs eclipse your own direction, and you lose track of where your life was going.",
        ],
      },
      mercury: {
        core: "You need lively communication in every close bond, and the life of your relationship depends on staying interested. To commit you need excellent mental rapport with a partner who is curious and still learning, and your discipline is to listen freshly and expect to be surprised.",
        expressions: [
          "You listen to a long-term partner as if for the first time, and they surprise you.",
          "You and a partner keep learning and bring each other the news.",
          "You are bored or unheard, and your trust thins.",
          "You finish a partner’s sentences, decide you know everything they will say, and manufacture the boredom that ends the love.",
        ],
      },
      venus: {
        core: "You want to create intimacy marked by grace, refinement and warm mutual respect, and you bring all three. To commit you need courtesy and high intentions on both sides. The charm and beauty you admire in others are yours to develop.",
        expressions: [
          "You develop your own grace and charm, and meet a partner as an equal in both.",
          "You and a partner treat each other with courtesy every day, in private as in public.",
          "A partner turns crass or unkind, and your trust weakens.",
          "You decide you lack charm, choose a dazzling partner to supply it, and live in fear of losing them.",
        ],
      },
      mars: {
        core: "You are learning how to fight: real conflicts brought into the open and either resolved or accepted. You are demanding, blunt and very loyal, you are drawn to spirited people who stay in the ring, and to commit you need courage and energy in both of you.",
        expressions: [
          "You and a partner fight fairly about real things, settle them, and trust each other more.",
          "You stand by a partner with total loyalty and tell them the truth to their face.",
          "Passion fades, and you stir the pot to bring it back.",
          "A partner retreats into niceness and passivity, you lose respect for them, and the fights you needed never happen.",
        ],
      },
      jupiter: {
        core: "You are generous, supportive and above pettiness, and a relationship feels alive to you only while it is moving toward an ideal. To commit you need a sense of limitless possibility and a partner who believes in you more than you do. With forgiveness, humour and humility you are capable of a grand romance.",
        expressions: [
          "You forgive, laugh and stay humble, and you and a partner have a grand romance.",
          "You back a partner’s largest hopes, and they back yours.",
          "A partner turns narrow or cuts an ethical corner, and your trust drops.",
          "Nothing meets the ideal, you are never satisfied, and you drift into the niggling criticism you despise.",
        ],
      },
      saturn: {
        core: "You take a vow with full seriousness and are capable of deep, sober, honourable commitment. The great work of your life in love is the ability to trust, and that requires a trustworthy partner: a full adult with integrity and realism whose word holds.",
        expressions: [
          "You give your word to someone whose word is good, and the commitment lasts a lifetime.",
          "You extend trust carefully, one kept promise at a time, and it holds.",
          "You withhold trust from someone who has earned it and make them prove it again.",
          "You are seriously let down, never address it, and never show your heart to anyone again.",
        ],
      },
      uranus: {
        core: "Your task is to become yourself inside love. You need more space and freedom than most, conventional closeness is claustrophobic for you, and instability comes only from choosing a partner under social pressure. To commit you need a shared resolve to write your own rules.",
        expressions: [
          "You know yourself well enough to choose truly, and you and a partner write your own rules and keep them.",
          "You and a partner give each other unusual freedom, and the bond is stable because of it.",
          "A partner turns possessive or worries what people think, and your trust weakens.",
          "You choose the partner others expected, feel trapped, and break out abruptly.",
        ],
      },
      neptune: {
        core: "At its height this is a relationship with a truly spiritual basis and a closeness that hardly needs words. To commit you need an inner life in both of you together with the ability to function in the world, and you need to check the everyday facts before you leap into trust.",
        expressions: [
          "You and a partner share an inner life and run a practical household, and the closeness is near telepathic.",
          "You see the best in someone, check the ordinary facts as well, and commit with open eyes.",
          "A partner shows no compassion or admits nothing beyond the everyday, and your trust thins.",
          "You fall for a beautiful soul, overlook the irresponsibility or addiction that comes with it, and wake up disillusioned.",
        ],
      },
      pluto: {
        core: "Trust is the deep question you bring to commitment, and intimacy works for you only when whatever has hurt your trust is brought up and felt through. You bring a probing, questioning quality to anyone close, and to commit you need passion, gut-level honesty and the ability to go deep in both of you.",
        expressions: [
          "You and a partner go through the dark material together, and you come out trusting them completely.",
          "You give a proven partner the benefit of the doubt and stop fighting battles that ended long ago.",
          "You question a partner’s every motive, and they feel permanently on trial.",
          "Trust becomes the only subject, and you keep probing someone who earned it long ago until they leave.",
        ],
      },
      node: {
        core: "Intimacy between equals is your least familiar arena and your main path to wholeness. You are used to the final decision resting with you, and a true meeting with another person feels strange. It asks patience from both of you.",
        expressions: [
          "You share a decision you would once have made alone, and find it lighter.",
          "You let someone truly meet you, and stay patient with how strange it feels.",
          "You carry everything alone out of habit and tell a partner afterwards.",
          "You run the relationship as its sole authority, and nobody is ever beside you as an equal.",
        ],
      },
      southnode: {
        core: "Relationship is your familiar ground, and you have real skill in it. Its cost is a reflex of putting the other person first and seeking agreement where none is needed, a sensitivity tuned to whoever holds the power.",
        expressions: [
          "You use your skill at reading people while keeping hold of your own direction.",
          "You find agreement easily where it matters, and say no where it does not.",
          "You put a partner’s needs first by reflex and seek consensus on things that are yours to decide.",
          "You orbit a partner’s problems until your own life has disappeared into theirs.",
        ],
      },
    },
  },
  8: {
    meaning:
      "The eighth house is about sexual bonding and the deeper instinctive attachment that separates a mate from a good friend. It shows the qualities a partner needs for that bond to last, and the sensitive feelings that closeness can bring up.",
    empty:
      "No planets here does not mean a lack of passion or depth, only that your chart describes what you need in close bonding through other placements.",
    planets: {
      sun: {
        core: "You are here to be changed through radical honesty and commitment, with every rough edge exposed and met with compassion. You need intensity in a partner and a humble willingness to face the darkness in both of you.",
        expressions: [
          "You and a partner show each other your worst and meet it with compassion, and you are both changed.",
          "You stay honest when it costs you, and your sense of yourself grows truer.",
          "You keep up appearances for the sake of peace and feel unlike yourself.",
          "A partner evades, denies or stays shallow, and your desire for them ends.",
        ],
      },
      moon: {
        core: "You want a mating bond that feels like home and joins everyday familiarity with desire. You need sensitivity and radical, exclusive commitment in a partner, and someone who will not grow up loses your interest however attractive they are.",
        expressions: [
          "You and a partner are wholly committed, and desire lives comfortably inside domestic life.",
          "You find the part of yourself that wants to make a home or a family with someone, and let it speak.",
          "You feel unrooted in a close relationship and cannot settle.",
          "You stay with an attractive partner who avoids growing up, and your excitement dies.",
        ],
      },
      mercury: {
        core: "You need to speak your feelings and be truly listened to, and talk is part of how you bond at depth. You need an intelligent, curious partner who is willing to speak, listen and learn from you.",
        expressions: [
          "You say what you feel in the dark, are heard, and desire deepens.",
          "You and a partner learn from each other and are unthreatened by it.",
          "You expect not to be heard and go quiet yourself.",
          "Emotional silence or rigid thinking settles in, and your desire ends.",
        ],
      },
      venus: {
        core: "You want grace and dignity in physical love, and courtship has to continue for the whole life of the relationship. Art is a comfort to you both, and you need a graceful partner.",
        expressions: [
          "You and a partner go on courting each other for decades.",
          "You share music, pictures or poetry, and it brings you back to each other.",
          "Courtship lapses, and physical love starts to feel mechanical.",
          "A partner treats sex crudely or as mere biology, and your desire ends at once.",
        ],
      },
      mars: {
        core: "You are reclaiming passion without shame, and keeping it means dealing with anger promptly and honestly and looking at yourself as closely as you look at your partner. You need courage, passion and loyalty in someone truthful who is unafraid of your intensity.",
        expressions: [
          "You deal with anger the day it arises, and passion between you stays hot for years.",
          "You examine your own part as rigorously as your partner’s, and conflict becomes an art you share.",
          "Old rage that has nothing to do with your partner surfaces in close moments.",
          "A partner minces words and stays nice, and your desire for them ends.",
        ],
      },
      jupiter: {
        core: "You are recovering the ability to believe in love and to take the leaps of commitment and sexual surrender. You want spontaneity and joy, and you need a big-spirited, generous, entertaining partner who judges kindly.",
        expressions: [
          "You leap, commit wholeheartedly, and let go with someone generous.",
          "You and a partner laugh in bed and out of it, and your belief in love is renewed.",
          "You hesitate at the edge of commitment and wait for certainty.",
          "You settle for a dutiful arrangement, or stay with someone stingy, controlling or shaming, and your desire ends.",
        ],
      },
      saturn: {
        core: "You are recovering the capacity to trust, and behind your self-containment you carry fear and a sense of doom about love. You need a patient partner of integrity who is simply trustworthy and keeps vows for the long term.",
        expressions: [
          "You trust someone patient who keeps their word, and the bond proves itself year after year.",
          "You bring seriousness and self-possession to intimacy, and a partner feels safe with you.",
          "You expect love to end badly and keep to yourself.",
          "You bond with someone immature or self-indulgent who embodies the fear, and they confirm it.",
        ],
      },
      uranus: {
        core: "You claim freedom and individuality inside commitment, and you have to know that you chose this bond yourself. You need a partner who respects your autonomy, tolerates difference, is not unduly jealous and supports your space.",
        expressions: [
          "You choose a partner entirely on your own terms and stay because you want to.",
          "You and a partner keep separate lives inside a committed bond, without jealousy.",
          "You guard your independence so closely that a partner cannot get near.",
          "A partner turns insecure, controlling or possessive, and your desire for them ends.",
        ],
      },
      neptune: {
        core: "You want sacred sexuality: contact between two inner lives within physical love. Eye contact is your key erogenous zone, and excitement does not last for you without that inner link. You need a sensitive partner who blends tenderness with sex and is open to the spiritual.",
        expressions: [
          "You and a partner hold each other’s gaze, and physical love becomes contact between two inner lives.",
          "You bring tenderness and a sense of the sacred to bed.",
          "The inner contact is missing, and your excitement fades however attractive the person.",
          "A partner treats sex as purely physical, and you split spirit from body and withdraw from one of them.",
        ],
      },
      pluto: {
        core: "You are here to surrender to mutual healing with a partner, in a bond where both of you say anything and are changed by it. Deep hurt shows in your sexuality as anger on the outside and sadness within. You need humble, undefensive self-examination in a partner who is at ease with intensity.",
        expressions: [
          "You and a partner examine yourselves without defence and heal each other.",
          "You say the unsayable in intimacy and find it received.",
          "Anger shows on the surface of your intimate life while sadness sits beneath it.",
          "A partner rationalises, denies or fears the dark, and your desire ends and you close.",
        ],
      },
      node: {
        core: "Psychological and sexual depth is unfamiliar and frightening to you, and it is exactly what you need. Letting someone know you fully is the direction that develops you most, and you deserve compassion as you go.",
        expressions: [
          "You let a partner know something you have never told anyone, and survive it.",
          "You stay in an intimate moment a little longer than is comfortable.",
          "You turn to money, security and practical arrangements whenever a relationship asks for depth.",
          "You build a safe, well-provisioned life with someone and never let them know you.",
        ],
      },
      southnode: {
        core: "Intensity is your familiar ground, and you are wise about crisis and steady in it. You no longer grow there. What you need is normality: stability, ordinary comfort, and working through only what truly needs it.",
        expressions: [
          "You work through what truly needs it and then cook a plain supper and rest.",
          "You bring your steadiness in crisis to a partner who needs it, and then let calm return.",
          "You are drawn to drama and stir up intensity when life goes quiet.",
          "You live in a continuous melodrama of crisis and call it depth.",
        ],
      },
    },
  },
};

/** The idea of the arc of intimacy: houses 4 to 8 as a sequence. */
export const ARC_OF_INTIMACY: string =
  "Houses four to eight describe the stages of building a relationship, from making a home and falling in love, through taking responsibility and committing, to bonding deeply. Each stage rests on the one before, and a stage that is skipped tends to bring the same frustrations back.";
