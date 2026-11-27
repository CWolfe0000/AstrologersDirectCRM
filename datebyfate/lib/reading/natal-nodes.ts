import type { Reading } from "./context";

/**
 * The natal nodal axis, read for love and relationships, by sign and by house.
 *
 * Method: Steven and Jodie Forrest. The South Node is the old, over-practised pattern, described
 * here as a present default (what the person falls back on in love). The North Node, opposite it,
 * is the direction of growth: unfamiliar, awkward and the most rewarding.
 *
 * Source and honesty: the Forrests' relationship books give natal nodes for houses 4 to 8 only and
 * no natal nodes by sign. The individual sign and house readings below are therefore derived from
 * that method together with the meanings of the signs and houses. They are not taken from a book,
 * and the wording is original. The house entries for 4 to 8 (and their opposite ends, 10 to 2) are
 * kept consistent with the node entries in HOUSE_LOVE in natal-love.ts.
 *
 * Each entry reads both ends of the axis together. The core names the familiar ground first and the
 * direction of growth second. The four expressions run from the most constructive (living the North
 * Node with the South Node's skills) to the hardest (stuck in the South Node default).
 */

/** Natal nodal axis by sign, indexed by the SOUTH node's sign, Aries first (so index 0 = South Node Aries / North Node Libra). */
export const NODES_SIGN_LOVE: Reading[] = [
  // South Node Aries / North Node Libra
  {
    core: "With the South Node in Aries and the North Node in Libra, you fall back on acting alone: you decide fast, go first and settle things by force of will. Love asks you to develop the opposite skill, weighing another person’s wishes as seriously as your own and building by agreement.",
    expressions: [
      "You bring your courage to a joint decision and hear the other person out before you move.",
      "You ask a partner what they want and let the answer change your plan.",
      "You decide for both of you and present the matter as already settled.",
      "You treat every difference as a contest to win, and you end up winning alone.",
    ],
  },
  // South Node Taurus / North Node Scorpio
  {
    core: "With the South Node in Taurus and the North Node in Scorpio, you fall back on comfort and steadiness: you keep things pleasant, keep things as they are and hold on to what is yours. Love asks you to develop emotional honesty, to go beneath the calm surface and let a relationship change you.",
    expressions: [
      "You stay steady while you say the difficult true thing, and the bond deepens for it.",
      "You let a partner see what you want and what you fear, beyond what is comfortable to show.",
      "You keep the peace by keeping to pleasant subjects, and the real conversation never starts.",
      "You hold on to a comfortable arrangement long after the feeling has gone out of it, because changing it costs more than you will pay.",
    ],
  },
  // South Node Gemini / North Node Sagittarius
  {
    core: "With the South Node in Gemini and the North Node in Sagittarius, you fall back on talk, curiosity and open options: you see every side of a question and commit to none. Love asks you to develop conviction, to choose a direction with someone and say what it means to you.",
    expressions: [
      "You use your gift for conversation to say what you believe and where you stand with someone.",
      "You choose one person and one direction, and let your curiosity work inside that choice.",
      "You turn light and clever whenever a partner asks what the relationship means to you.",
      "You keep every option open for so long that nobody gets a clear answer from you, yourself included.",
    ],
  },
  // South Node Cancer / North Node Capricorn
  {
    core: "With the South Node in Cancer and the North Node in Capricorn, you fall back on feeling and shelter: you protect, you nurture, and you retreat into your shell when you are hurt. Love asks you to develop self-reliance, to hold your own ground as an adult and keep your commitments whatever your mood.",
    expressions: [
      "You care for a partner as one capable adult cares for another, with warmth and with limits.",
      "You make a commitment and keep it on the days when your mood argues against it.",
      "You mother a partner, or wait to be looked after, in place of meeting them as an equal.",
      "You withdraw into hurt feelings and wait to be coaxed out, and the relationship runs on your moods.",
    ],
  },
  // South Node Leo / North Node Aquarius
  {
    core: "With the South Node in Leo and the North Node in Aquarius, you fall back on being the centre: you shine, you give generously and you expect to be admired for it. Love asks you to develop equality, to treat a partner as a separate person with a freedom and a life of their own.",
    expressions: [
      "You give a partner your full warmth and leave them free to be nothing like you.",
      "You build a friendship inside the romance, where neither of you has to perform.",
      "You measure a partner’s love by how much attention and applause you are getting.",
      "You make the relationship a stage for yourself, and the other person becomes your audience.",
    ],
  },
  // South Node Virgo / North Node Pisces
  {
    core: "With the South Node in Virgo and the North Node in Pisces, you fall back on analysis and improvement: you notice what is wrong, set about fixing it and make yourself useful. Love asks you to develop acceptance, to trust, forgive and let a person and a moment be as they are.",
    expressions: [
      "You put your eye for detail in the service of tenderness, and notice what a partner needs without correcting them.",
      "You let an imperfect moment stand and enjoy it exactly as it is.",
      "You answer a partner’s feelings with advice and a list of what to fix.",
      "You pick the relationship apart flaw by flaw, your own flaws first, until nothing in it is good enough to rest in.",
    ],
  },
  // South Node Libra / North Node Aries
  {
    core: "With the South Node in Libra and the North Node in Aries, you fall back on harmony: you adapt, you smooth things over and you decide by what the other person wants. Love asks you to develop a will of your own, to say directly what you want and accept the conflict that follows.",
    expressions: [
      "You say plainly what you want and stay kind while you say it.",
      "You make a decision of your own without first checking how it will be received.",
      "You agree in order to keep things pleasant, and resent it quietly afterwards.",
      "You shape yourself to each partner so completely that you no longer know what you want.",
    ],
  },
  // South Node Scorpio / North Node Taurus
  {
    core: "With the South Node in Scorpio and the North Node in Taurus, you fall back on intensity: you probe beneath every surface, expect the hidden worst and keep control of what you reveal. Love asks you to develop calm, to trust what is plainly in front of you and enjoy a steady, simple bond.",
    expressions: [
      "You bring your depth to a calm, steady bond and let it be simple where it is simple.",
      "You take a partner’s word for something and enjoy the evening with them.",
      "You search for the hidden motive behind a kind act and test a partner’s loyalty.",
      "You hold on to an old injury and produce it as proof in each new quarrel, so that nothing between you is ever finished.",
    ],
  },
  // South Node Sagittarius / North Node Gemini
  {
    core: "With the South Node in Sagittarius and the North Node in Gemini, you fall back on certainty and freedom: you know what you believe, you say it at length and you keep the road open. Love asks you to develop curiosity about the other person, to ask, to listen and to stay for the daily conversation.",
    expressions: [
      "You bring your honesty and your faith in the future into a real exchange, and listen as much as you speak.",
      "You ask a partner a question to which you do not already know the answer.",
      "You tell a partner what their problem means before they have finished describing it.",
      "You are so sure you are right that you leave for somewhere new sooner than hear the other side.",
    ],
  },
  // South Node Capricorn / North Node Cancer
  {
    core: "With the South Node in Capricorn and the North Node in Cancer, you fall back on competence and control: you manage, you provide, you do your duty and you need nothing from anyone. Love asks you to develop tenderness, to show what you feel and let yourself be cared for.",
    expressions: [
      "You offer a partner both your reliability and your tenderness, and let them see that you need them.",
      "You let someone look after you when you are tired or ill, without earning it first.",
      "You show love through tasks and provision and keep your feelings out of it.",
      "You run the relationship as a duty to be discharged, and nobody in it gets near what you feel.",
    ],
  },
  // South Node Aquarius / North Node Leo
  {
    core: "With the South Node in Aquarius and the North Node in Leo, you fall back on detachment: you stand back, think it over and stay everyone’s friend and nobody’s in particular. Love asks you to develop heart, to want one person openly and let yourself be seen wanting them.",
    expressions: [
      "You keep your independence of mind and still tell one person, warmly and outright, that they are the one you want.",
      "You let yourself be seen being enthusiastic, affectionate and openly in love.",
      "You discuss your feelings as interesting ideas and hold them at arm’s length.",
      "You stay a friendly observer of your own love life, and a partner never learns whether they matter to you.",
    ],
  },
  // South Node Pisces / North Node Virgo
  {
    core: "With the South Node in Pisces and the North Node in Virgo, you fall back on drifting and merging: you dream, you yield, you absorb another person’s feelings and let things take their course. Love asks you to develop discernment, to see a partner as they are and to love them in definite, practical ways.",
    expressions: [
      "You bring your compassion down to earth in practical daily acts of love that a partner relies on.",
      "You say exactly what you will and will not do, and then you do it.",
      "You love the dream of a person and overlook the plain facts in front of you.",
      "You dissolve into a partner’s life and troubles, sacrifice yourself unasked, and drift until someone else decides how it ends.",
    ],
  },
];

/** Natal nodal axis by house, indexed by the SOUTH node's house, 1 first (index 0 = South Node 1st / North Node 7th). */
export const NODES_HOUSE_LOVE: Reading[] = [
  // South Node 1st / North Node 7th
  {
    core: "With the South Node in the 1st house and the North Node in the 7th, you fall back on yourself: your own course, your own decision, the final word resting with you. Love asks you to develop intimacy between equals, where another person has a real say in your life and a real claim on you. It feels strange, and it is your main path to wholeness.",
    expressions: [
      "You bring a strong, defined self into a partnership and share the steering.",
      "You consult a partner before you act and find the decision lighter for it.",
      "You make your plans alone out of habit and inform a partner afterwards.",
      "You stay so self-contained that a partner has no way in and nothing to do for you.",
    ],
  },
  // South Node 2nd / North Node 8th
  {
    core: "With the South Node in the 2nd house and the North Node in the 8th, you fall back on security: money, possessions, practical arrangements and what you provide for yourself. Love asks you to develop psychological and sexual depth, to share what is yours and let someone know you fully. It is unfamiliar and frightening, and it is exactly what you need.",
    expressions: [
      "You offer the stability you have built as the ground for real closeness, and let a partner know you fully.",
      "You share what is yours, money included, and trust someone with it.",
      "You answer a request for closeness with a practical arrangement or a gift.",
      "You guard your own resources and comfort so carefully that nobody ever shares a life with you.",
    ],
  },
  // South Node 3rd / North Node 9th
  {
    core: "With the South Node in the 3rd house and the North Node in the 9th, you fall back on the near and the everyday: conversation, news, errands and familiar streets. Love asks you to develop a larger view, to leave the familiar with someone and settle what the two of you believe and where you are going.",
    expressions: [
      "You put your quick mind to a large question with a partner: what you both believe and where you are heading.",
      "You leave your familiar surroundings with someone and let the journey change you both.",
      "You fill your time together with news, errands and small talk, and the larger questions go unasked.",
      "You stay so busy with the details of daily life that the relationship never acquires a direction or a meaning.",
    ],
  },
  // South Node 4th / North Node 10th
  {
    core: "With the South Node in the 4th house and the North Node in the 10th, you fall back on home, family and private life, and you know the ways of a household by heart. Love asks you to develop a place of your own in the world, and to stand in a relationship as someone with a calling beyond the household.",
    expressions: [
      "You bring your skill at home life into a partnership that also supports your work and your public place.",
      "You look plainly at the family habits you carry and choose which of them to keep.",
      "You retreat into the household and leave your ambitions for a partner to carry.",
      "You run your home by family rules you have never examined, and a partner is cast in a relative’s part.",
    ],
  },
  // South Node 5th / North Node 11th
  {
    core: "With the South Node in the 5th house and the North Node in the 11th, you fall back on romance, pleasure and play, and you are at home in the early, intoxicating stage of love. Love asks you to develop the long view, to think about where a relationship is going and build a shared future, with friendship and common aims in it.",
    expressions: [
      "You bring your gift for courtship and play into a relationship that has plans and a future.",
      "You make a partner your friend and gather people and shared aims around the two of you.",
      "You grow restless when the first excitement fades and look for a fresh spark.",
      "You end things when planning takes the place of courtship, and begin the same first chapter with someone new.",
    ],
  },
  // South Node 6th / North Node 12th
  {
    core: "With the South Node in the 6th house and the North Node in the 12th, you fall back on duty, routine and instruction: you do what is required, take good advice and keep yourself useful. Love asks you to develop an inner life of your own, to stop deferring, trust your own guidance and put the task list down.",
    expressions: [
      "You bring your reliability into a love that also has stillness in it, and trust your own sense of what is right.",
      "You stop working, sit quietly with a partner and let nothing be accomplished.",
      "You look up what the experts say before you decide anything about your relationship.",
      "You bury yourself in chores and obligations, follow other people’s rules for your relationship, and never ask what you yourself know.",
    ],
  },
  // South Node 7th / North Node 1st
  {
    core: "With the South Node in the 7th house and the North Node in the 1st, you fall back on relationship itself: you read the other person with real skill, put them first by reflex and seek agreement where none is needed. Love asks you to develop a direction that is your own, and to hold to it inside a relationship.",
    expressions: [
      "You keep your skill at reading people and add to it a direction of your own.",
      "You make a choice a partner dislikes, stand by it and stay in the relationship.",
      "You wait to learn what a partner wants before you know what you want.",
      "You organise your whole life around a partner’s needs and problems, and your own life goes unlived.",
    ],
  },
  // South Node 8th / North Node 2nd
  {
    core: "With the South Node in the 8th house and the North Node in the 2nd, you fall back on intensity: you are wise about crisis, steady in it and at home in the depths. You do not grow there. Love asks you to develop normality: stability, ordinary comfort, ground of your own, and working through only what truly needs it.",
    expressions: [
      "You bring your steadiness in a crisis to a partner who needs it, and then let ordinary calm return.",
      "You build something solid of your own, money and confidence included, and enjoy plain comforts with someone.",
      "You go looking for what is wrong between you when an evening is simply pleasant.",
      "You keep a relationship in upheaval, lean on a partner’s resources and strength, and never stand on your own ground.",
    ],
  },
  // South Node 9th / North Node 3rd
  {
    core: "With the South Node in the 9th house and the North Node in the 3rd, you fall back on the big picture: your beliefs, your principles and the next horizon. Love asks you to develop attention to what is near, to listen, ask questions and learn the actual person in the daily exchange.",
    expressions: [
      "You bring your sense of meaning into ordinary conversation and learn the actual person in front of you.",
      "You stay for the small daily exchanges, the messages and the errands, and find the relationship lives there.",
      "You explain your philosophy of love to a partner and miss what they have just said.",
      "You hold a relationship up against your beliefs or your next horizon, find it too small, and move on without having heard the other person.",
    ],
  },
  // South Node 10th / North Node 4th
  {
    core: "With the South Node in the 10th house and the North Node in the 4th, you fall back on your public role: work, duty, position and being the one in charge. Love asks you to develop a real home and a private life, and to put them ahead of that role. It feels awkward, and it is right.",
    expressions: [
      "You bring your competence home and put your private life ahead of your public role.",
      "You learn the ordinary skills of living with someone and let yourself be off duty there.",
      "You give work the best hours of the day and bring what is left of you to a partner.",
      "You let position and reputation fill your whole life, and nobody gets close to the person behind the role.",
    ],
  },
  // South Node 11th / North Node 5th
  {
    core: "With the South Node in the 11th house and the North Node in the 5th, you fall back on strategy and the group: plans, goals, the future and the company of friends. Love asks you to develop play, courtship and spontaneous self-expression, to drop the strategy and enjoy one person now.",
    expressions: [
      "You bring your gift for friendship and the long view into a romance that you enjoy today.",
      "You court someone openly and playfully, with no plan for where it leads.",
      "You keep a romance inside the safety of a group of friends and avoid being alone with one person.",
      "You postpone love for a future that suits your strategy, and the pleasure of it never arrives.",
    ],
  },
  // South Node 12th / North Node 6th
  {
    core: "With the South Node in the 12th house and the North Node in the 6th, you fall back on withdrawal: solitude, your own inner world and standing apart from daily life. Love asks you to develop service and practical care, being useful to the people you love in ordinary daily ways.",
    expressions: [
      "You bring your inner depth into the humble daily things you do for someone you love.",
      "You turn up at the agreed time, do the practical thing that was needed, and find it grounds you.",
      "You retreat into your own inner world while someone close needs practical help.",
      "You disappear from a relationship without leaving it, and a partner lives alone beside you.",
    ],
  },
];
