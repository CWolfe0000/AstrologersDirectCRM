/**
 * The words for timing: transits and progressions.
 *
 * The method follows Steven Forrest, "The Changing Sky". A slow planet sets a theme that lasts
 * months or years, and it can go two ways: as a teacher, with a task, or as a trickster, with a
 * trap. What matters most is which planet meets which point in your chart; the kind of aspect
 * only says how it arrives. Nothing here predicts an event: each period is a question, and the
 * outcome is a choice. Progressions (a day after birth for each year of life) are the chart's
 * own unfolding. The wording is our own.
 */

/** A slow planet in transit: its name for the period, the task ({F} = what it touches) and the trap. */
export const TRANSIT: Record<string, { name: string; task: string; trap: string }> = {
  jupiter: {
    name: "An Opening",
    task: "Jupiter offers a chance to stop settling for less in {F}. It is an audition more than a gift: see the better possibility, and reach for it while it is there.",
    trap: "Overconfidence: assuming it will take care of itself, or being taken in by something too good to be true.",
  },
  saturn: {
    name: "A Reality Check",
    task: "Saturn asks you to see {F} as it really is, and to act on what you see. Ask what you have outgrown here, make a realistic plan, and keep to it without waiting for applause.",
    trap: "Deciding you cannot win, and going rigid or giving up. The wall is high but it is not wide.",
  },
  uranus: {
    name: "A Call To Be Yourself",
    task: "Uranus asks what in {F} is truly yours, and what you took on to keep other people comfortable. An old way of doing this has burned out, and you are asked to reinvent it.",
    trap: "Staying with the familiar because it is practical, until the change arrives in a clumsier form than it needed to.",
  },
  neptune: {
    name: "A Time To Listen",
    task: "Neptune softens {F} and asks you to be still. Something that matters has drifted out of your everyday life. This is a time to reflect more than to act.",
    trap: "Glamour and escape: idealising a person or a wish that has never been tested. Before acting on a wonderful idea, wait three days and look again.",
  },
  pluto: {
    name: "An Old Wound Surfaces",
    task: "Pluto brings up what once hurt you in {F}, so that it can heal. You may feel pulled to replay an old drama. Feeling the pull and choosing a different ending is the work.",
    trap: "Re-enacting it: leaving before you are left, trying to control, or giving up in cynicism.",
  },
};

/** What each point of a chart stands for, as the object of a transit. */
export const FUNCTION: Record<string, string> = {
  sun: "your sense of who you are",
  moon: "what you need to feel at home",
  venus: "how you love and form bonds",
  mars: "your will, courage and desire",
  axis: "how you meet the world and who you choose as a partner",
  ruler: "the planet that stands for your partners",
  "c-sun": "what this relationship is for",
  "c-moon": "the emotional life of this relationship",
  "c-venus": "the affection between you",
  "c-asc": "how the two of you meet the world",
  "c-mc": "where this relationship is heading",
};

/** How it arrives. The aspect does not make a period good or bad. */
export const ARRIVES: Record<number, string> = {
  0: "By conjunction, the two fuse.",
  90: "By square, it comes as friction and takes effort.",
  120: "By trine, it flows, so act on it and do not coast.",
  180: "By opposition, it tends to arrive through another person or outside circumstances.",
};

/** A slow planet moving through the three houses of love. {P} is the planet. */
export const HOUSE_TRANSIT: Record<number, { title: string; body: string; trap: string }> = {
  5: {
    title: "Through Your House Of Romance",
    body: "{P} is moving through your 5th house: self-expression, play and falling in love. New friends or lovers tend to turn up, light-hearted and a little unsure of themselves. Their real job is to help you drop the past and show yourself without self-consciousness.",
    trap: "Drama for its own sake, and excess.",
  },
  7: {
    title: "Through Your House Of Partnership",
    body: "{P} is moving through your 7th house: you have gone as far as you can alone. New partners appear and existing relationships are looked at afresh. The task is to see the other person clearly, not as an answer to your need, and to keep hold of yourself.",
    trap: "Depending on another person so much that you lose yourself.",
  },
  8: {
    title: "Through Your House Of Intimacy",
    body: "{P} is moving through your 8th house: what you have kept out of sight comes up, often as moodiness. Bonds are deepened and tested, and the ones that hold become part of you. Honesty is what helps.",
    trap: "Resisting and denying it until it turns into low spirits.",
  },
};

/** The progressed Moon by house: where your heart is for two or three years. */
export const PROGRESSED_MOON_HOUSE = [
  "A new cycle of about 28 years begins. Follow your instincts and try out a new way of being; do not let an outgrown past hold you. What you start now shapes decades.",
  "Can you follow through? Doubt and the feeling of being an impostor are normal here. Build your resources: money, skills, and people who back you.",
  "Confidence returns with curiosity. Talk, study, travel and make connections.",
  "Withdraw and take stock. Home, family and your roots have your attention. Cut back what is not essential.",
  "Express what you found. Play, create and recover your joy. Playmates and lovers belong to this chapter.",
  "Head down and get on with it. Skills, responsibility and humility: the quiet before partnership.",
  "Often a dramatic chapter. You bring a changed self to your closest relationships, which have to be renewed to fit who you have become. Say who you are now. New people arrive carrying something you need to hear.",
  "What you have avoided in yourself comes up. You want solitude, and you also want deep closeness. Meet that need, and remember that half the answer has to be your own.",
  "Stretch. Break your routines, travel, study. Boredom is the enemy.",
  "Your place in the world is being redefined: a new role, or a public statement about your life, which can include a commitment or the end of one.",
  "Harvest. Take the recognition, widen your circle, and choose among many openings.",
  "Let go. Something that once fed you now binds you. An ending, and a private new beginning.",
];

/** The progressed Moon by sign: the mood, and what you are learning. */
export const PROGRESSED_MOON_SIGN = [
  "You are learning courage. Stand your ground and go after what is yours, and aim your anger with care.",
  "You are learning peace. Slow down, look after your body, and let things come together.",
  "You are learning flexibility. Follow your curiosity and gather impressions without a plan.",
  "Your heart needs attention. Seek quiet and security, and turn the outside noise down.",
  "You are learning to be seen. Celebrate, play and express yourself, with a sense of humour about your ego.",
  "You notice your faults. Pick one and work on it instead of attacking yourself. Skills and preparation.",
  "The friendly Moon. You meet people and compare notes, and relationships and your effect on others have your attention.",
  "The most intense mood of the twelve. A hunger for closeness that is hard to satisfy, and things you had not faced come to the surface. Keep your perspective.",
  "Relief. You want adventure and something new, and you break routines of feeling.",
  "Time to get serious. You want to accomplish something and be respected. Guard against shutting yourself away, and talk about what you feel.",
  "You break the rules. You take your individuality back from other people’s expectations. Small tremors are better than one earthquake.",
  "A dreamy, loosening mood, with weak judgment about what is real. Reflect, and leave the commitments for later.",
];

/** Progressed Venus, your evolving relationships, meeting a point in your birth chart. Two or three years each. */
export const PROGRESSED_VENUS: Record<string, string> = {
  sun: "You are sending out a signal, and you draw in the people you have real business with: lovers, partners, friends and rivals. Meetings can feel fated. Watch for falling for an image, or agreeing so completely that nothing is exchanged.",
  moon: "A deep wish to form, or renew, a lasting bond of the family kind. Commitments are common. You need ordinary closeness with people who know you well.",
  mercury: "You are learning to talk with people and to listen. The way you speak is what builds or blocks closeness now.",
  venus: "You feel attractive and your circle grows. The risk is charm without substance: romances that leave you wondering what they were about. Let people see you plainly.",
  mars: "Desire and tenderness are trying to work together. You want strong, direct feeling. Tensions that have simmered in a relationship can come out: clear the air, and root out the comfortable bargains that kill passion.",
  jupiter: "Why have you been settling for so little? Ask for what you want and take a chance. Be wary of what looks too good to be true.",
  saturn: "Your way of loving is taking on commitment and maturity. You face the sober reality of a promise, or see that one cannot work. Whatever patterns you settle into now, you carry forward.",
  uranus: "You have paid too much in freedom for stability and approval. You need room to be yourself with the people you love. Ask for it, and be ready to bargain.",
  neptune: "A longing for a deeper, almost sacred closeness. You can mistake that hunger for the need for someone new, and you can miss the ordinary human being in a new love.",
  pluto: "Time to look at the hurt, untrusting part of yourself. You are ready to love more honestly, and first you have to feel the old injuries. What you do not look at, you act out.",
  asc: "One of the most dramatic. You meet people who change things, very often in love. You have reached a point only another person can help you past, so openness is everything.",
};
