import type { Classical } from "./hours";

/**
 * What each planetary hour is used for on each planetary day: all forty-nine pairings in Jason
 * Miller's "Advanced Planetary Magic", where the planet of the hour is the main force and the
 * planet of the day colours it. The purposes are his; the wording is ours, and none of his calls
 * or seals is reproduced. Nothing is left out: the pairings he gives for attraction, persuasion
 * and cursing are here as he gives them, under the product's disclaimer.
 */

export type UseKind = "love" | "influence" | "wrath" | "money" | "inner" | "protection";
export const KIND_LABEL: Record<UseKind, string> = { love: "Love", influence: "Influence", wrath: "Wrath", money: "Money", inner: "Inner Work", protection: "Strength" };

type Use = [UseKind, string];

/** USES[day][hour] */
export const USES: Record<Classical, Record<Classical, Use>> = {
  moon: {
    moon: ["inner", "Keeping to your path in dreams and inner work, without getting lost in illusion."],
    mercury: ["inner", "Bringing hidden urges and your shadow side to the surface safely."],
    venus: ["love", "Love and lust: drawing a new lover, or rekindling desire in a long relationship."],
    sun: ["inner", "Finding your balance again when you feel out of step with the world."],
    mars: ["protection", "Gathering your wits and fighting back against a rival, an enemy or an abuser."],
    jupiter: ["influence", "Glamour on the outside and grace within. Best at the full moon."],
    saturn: ["inner", "Getting in step with time, if you are always late or just missing things."],
  },
  mercury: {
    moon: ["influence", "Persuasion: making people believe and trust what you say, whether or not it is the whole truth."],
    mercury: ["inner", "Sharpening your mind and your speech."],
    venus: ["love", "Reconciling head and heart, and putting desire to good use."],
    sun: ["inner", "A blessing on the mind and on understanding."],
    mars: ["protection", "Cleverness against obstacles and opponents."],
    jupiter: ["money", "Making money from money: investing and planning ahead."],
    saturn: ["inner", "Learning to be quiet, to listen and to keep to the task."],
  },
  venus: {
    moon: ["love", "Deepening the spiritual side of sex."],
    mercury: ["influence", "Glamour: charm in how you speak and present yourself."],
    venus: ["love", "Devotion to love, beauty and passion, and asking for their gifts."],
    sun: ["influence", "Warmth and charisma that people follow. For anyone who leads."],
    mars: ["love", "Spark: the play of leading and yielding between lovers."],
    jupiter: ["love", "Love and prosperity together: wealth as an attraction, and as a way to look after the people you love."],
    saturn: ["love", "Making love stronger, deeper and more lasting."],
  },
  sun: {
    moon: ["inner", "Speeding your hopes and requests on their way."],
    mercury: ["inner", "Helping the mind to grasp higher states."],
    venus: ["love", "A celebration of love and life: a blessing with no target. Use it and see what happens."],
    sun: ["inner", "Calling on the light of the Sun."],
    mars: ["inner", "Burning away a habit or pattern that holds you back."],
    jupiter: ["money", "A blessing of standing, success and wealth."],
    saturn: ["inner", "Preparing to let go of the self: deep spiritual work."],
  },
  mars: {
    moon: ["protection", "Channelling passion and sharpening instinct before a confrontation."],
    mercury: ["protection", "Putting your mind to work in a conflict."],
    venus: ["wrath", "Turning charm and attraction into weapons."],
    sun: ["protection", "Force and fire in a just cause."],
    mars: ["wrath", "The war cry: raising your courage and unsettling an opponent."],
    jupiter: ["protection", "Protecting what is yours: your home, your work and the people you love."],
    saturn: ["wrath", "Binding and striking in a fight, and doing battle with your own weaknesses."],
  },
  jupiter: {
    moon: ["inner", "Getting your emotions and instincts behind what you are doing."],
    mercury: ["money", "Communication and information in support of your ambitions."],
    venus: ["money", "Money to support your art and passions, and art that earns."],
    sun: ["money", "Finding the idea, and the energy to see it through."],
    mars: ["money", "Getting yourself moving, and taking reasonable risks that pay off."],
    jupiter: ["money", "Calling on everything Jupiter stands for: growth, success and good fortune."],
    saturn: ["money", "The discipline that makes a big idea real."],
  },
  saturn: {
    moon: ["wrath", "A curse of confusion and binding, so that an enemy is undone by their own actions. Not to be used lightly."],
    mercury: ["wrath", "A curse to confound someone’s communications and restrict their movements."],
    venus: ["wrath", "A curse to turn a person’s loved ones against them."],
    sun: ["inner", "Accepting that things end, and building the walls you need."],
    mars: ["wrath", "A curse to leave an enemy helpless and then strike."],
    jupiter: ["money", "Finding the opportunity inside a setback."],
    saturn: ["inner", "Going beyond the self, and facing mortality."],
  },
};

/** What each planet is worked with for in love, in the same book. */
export const IN_LOVE: Record<Classical, string> = {
  moon: "Stirring attraction and desire, and reaching someone through their dreams.",
  mercury: "Wit, confidence and humour, which attract more than looks do.",
  venus: "Every side of love: attraction, romance, friendship, beauty and influence over the heart.",
  sun: "Radiance: making yourself more visible and more magnetic to the person you want.",
  mars: "Confidence and nerve, and getting past your own fear of rejection.",
  jupiter: "Command of yourself, generosity and means, all of which attract.",
  saturn: "Ending a bad relationship, and bearing pain and loss. Binding someone to you belongs here too, by tradition.",
};

export const DISCLAIMER =
  "Planetary magic is a traditional spiritual practice, described here for personal use and entertainment. Datebyfate makes no claim that any working will have an effect, and you are responsible for how you use what is on this page. It is not a substitute for medical, legal, financial or psychological advice.";
