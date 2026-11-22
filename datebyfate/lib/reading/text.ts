import type { AspectClass, BodyId, PointId } from "@/lib/astro/types";
import { POINT_NAMES } from "@/lib/astro/zodiac";

/**
 * The words. Every reading on Datebyfate is assembled from these entries by
 * fixed rules (lib/reading/*.ts), so the same chart always reads the same way.
 * Arrays of twelve are in zodiac order, Aries first.
 */

/** Venus by sign: how you love. */
export const VENUS = [
  "You fall fast and you say so. Pursuit, novelty and a little friction keep you interested; a relationship that gets too settled can feel like it has ended before it has.",
  "You love slowly and for a long time. Touch, steadiness and shared comforts are how you show it. Once you have chosen someone you rarely un-choose them, which makes leaving hard even when you should.",
  "You fall for a mind first. Conversation, humour and variety are your version of romance, and you need room to stay curious. Heavy emotional demands make you go quiet or go elsewhere.",
  "You love by taking care of people. You want closeness that feels like home, and you remember everything. When you feel unsafe you retreat instead of asking for what you need.",
  "You love generously and visibly, and you want the same back. Being admired and chosen out loud matters to you. Indifference hurts you more than conflict does.",
  "You show love through what you do: noticing, fixing, turning up. You are careful about who you let in, and you can talk yourself out of people by listing their flaws.",
  "You are at your best in a pair. You want harmony, charm and fairness, and you are good at making someone feel considered. Your risk is keeping the peace by leaving out what you actually want.",
  "You want all of someone or nothing. Loyalty, depth and honesty about the hard things are what you count as love. You test people before you trust them, sometimes without telling them there is a test.",
  "You love people who make your world bigger. Freedom, honesty and shared adventure matter more to you than reassurance. Feeling fenced in is the fastest way to lose you.",
  "You take love seriously and you take your time. You show it by committing and building, and you respect people who do what they say. You can seem cooler than you feel.",
  "You love as a friend first. You want an equal who has their own life, and you give a lot of room. Partners can read that room as distance when you mean it as respect.",
  "You love without many edges. You are romantic and forgiving, and you see what someone could be. That is a gift, and it is also how you end up loving potential instead of the person in front of you.",
];

/** Moon by sign: what you need to feel safe. */
export const MOON = [
  "You need directness. You feel things at once and want to deal with them at once; a partner who goes silent or lets things simmer leaves you restless.",
  "You need calm and consistency. Routines, physical affection and plans that hold are what settle you. Sudden change unsettles you more than you let on.",
  "You need to talk it through. Feelings become real for you once they have words, so a partner who listens and answers settles you faster than one who only holds you.",
  "You need to feel wanted and safe at home. You pick up on moods quickly and care deeply. When hurt you withdraw and hope to be followed.",
  "You need warmth and attention. You want to feel special to someone, and you give that back fully. Being overlooked lands as rejection.",
  "You need things to make sense. Being useful calms you, and practical care from a partner means more than big statements. Under stress you criticise, yourself first.",
  "You need peace between you. Tension in the room is hard for you to ignore, so you smooth things over quickly, sometimes before the real issue is said.",
  "You need emotional truth. You would take a hard conversation over a pleasant surface, and you feel betrayal deeply. Trust is slow to give and slow to repair.",
  "You need room and optimism. You recover by moving, planning or laughing, and heavy moods that go on too long make you want out.",
  "You need to be able to rely on someone. You handle feelings by staying composed and getting on with things, and you find it hard to ask for comfort.",
  "You need space to process on your own terms. You think about feelings before you feel them out loud, which a partner can mistake for not caring.",
  "You need gentleness. You absorb the mood of the person you are with, so who you are close to changes how you feel about everything. Time alone resets you.",
];

/** Mars by sign: what you go after and how. */
export const MARS = [
  "You go after what you want directly and quickly. You like the chase, you get angry fast and you are over it fast.",
  "You pursue steadily and you do not give up easily. Desire is physical and patient for you. You are slow to anger and slow to let it go.",
  "You flirt with words. Wit and quick exchange are what switch you on, and your interest moves on when the conversation runs dry.",
  "You pursue indirectly and protectively. You need to feel safe before you want someone, and you sulk instead of fighting openly.",
  "You pursue with confidence and some theatre. You want to be desired back just as loudly, and wounded pride is what makes you fight.",
  "You show desire through attention to detail and through effort. You are selective, and irritation comes out as criticism.",
  "You pursue by charming. You would sooner persuade than push, and you avoid a fight until the unfairness is too much to ignore.",
  "You want intensely and privately. You commit your whole will to what you desire, you do not forget a slight, and you fight to win.",
  "You pursue with enthusiasm and honesty. Attraction for you is tied to adventure and shared belief, and you are blunt when you argue.",
  "You pursue with a plan. You are drawn to competence and self-control, and you hold your anger until it has a use.",
  "You are drawn to the unusual. You want a mind you cannot predict, you dislike being told what to do, and you detach when pushed.",
  "You pursue by drifting closer. Desire for you is tied to imagination and mood, and you step around conflict more often than you meet it.",
];

/** Descendant by sign: the kind of person you are drawn to. */
export const DESCENDANT = [
  "You are drawn to bold, decisive people who go first. They bring the directness you tend to trade away to keep things fair. The same quality shows up later as impatience or selfishness.",
  "You are drawn to steady, grounded people who are comfortable in their own skin. They calm your intensity. Over time that steadiness can read as stubbornness.",
  "You are drawn to quick, talkative, curious people who keep things light. They stop you taking everything so seriously. The cost can be inconsistency.",
  "You are drawn to warm, protective people who make you feel looked after. They soften your self-reliance. It can turn into moodiness or dependence.",
  "You are drawn to confident, expressive people with presence. They bring the warmth and centre-stage ease you hold back. It can become a need to be the centre of everything.",
  "You are drawn to capable, practical people who get things right. They ground your imagination. Later you may feel analysed or corrected.",
  "You are drawn to graceful, agreeable people who put you at ease. They round off your edges. The risk is a partner who will not say what they want.",
  "You are drawn to intense, private people with depth. They take you below the comfortable surface. It can turn into control or secrecy.",
  "You are drawn to free-spirited, optimistic people who think big. They pull you out of the details. Pinning them down can be the difficulty.",
  "You are drawn to mature, accomplished people who seem to have it together. They offer the structure you want. They can also be unavailable or busy with work.",
  "You are drawn to independent, unconventional people who do not need you. They give you room to breathe. The detachment can leave you wanting more warmth.",
  "You are drawn to gentle, dreamy, sensitive people. They soften your exacting side. You can end up rescuing them or waiting for them to arrive fully.",
];

/** Planets in the 7th house: what arrives with your partners. */
export const IN_SEVENTH: Partial<Record<BodyId, string>> = {
  sun: "Partnership is central to who you are. You come into focus next to someone, and you can hand a partner too much say over how you see yourself.",
  moon: "You look for emotional safety in a partner and choose people who feel like family. Your mood follows the state of the relationship closely.",
  mercury: "You need a partner you can talk to about everything. A relationship without real conversation does not last for you.",
  venus: "Relationships come to you easily and you are good at them. The risk is staying comfortable instead of honest.",
  mars: "You attract assertive, energetic partners, and relationships are where your conflicts happen. Passion and arguments tend to arrive together.",
  jupiter: "Partners tend to open doors for you: bigger plans, more confidence, a wider life. You can over-promise or expect a partner to be everything.",
  saturn: "You take partnership very seriously, often committing late or to someone older or more settled. Relationships feel like responsibility before they feel like ease, and they get better with time.",
  uranus: "You attract unusual, independent partners and relationships that start or end suddenly. You need more freedom inside a partnership than most arrangements allow.",
  neptune: "You see partners through a soft lens. You are drawn to artists, healers and people who need saving, and seeing a partner clearly takes deliberate effort.",
  pluto: "Relationships change you completely. You attract intense, strong-willed partners, and questions of power and trust come up early.",
  node: "Committed partnership is one of the places you grow most. Learning to rely on another person is part of your path, even when going alone feels easier.",
};

/** House of the 7th-house ruler: where partnership tends to come from or lead. */
export const RULER_HOUSE = [
  "Relationships are tied closely to your own identity: partners come to you, and who you are with shapes how you present yourself.",
  "Relationships are tied to money, security and what you value. Partners affect your finances, for good or ill.",
  "You tend to meet partners close to home: through siblings, neighbours, study or everyday conversation.",
  "Relationships are tied to home and family. You look for someone to build a private life with, and family approval weighs on your choice.",
  "Relationships begin as romance and play. You meet partners through creative work, fun or going out, and you want the dating stage to last.",
  "You tend to meet partners through work or daily routine, and a relationship becomes real for you when you share ordinary days.",
  "Partnership stands on its own in your life. You are comfortable committing and tend to define periods of your life by who you were with.",
  "Relationships take you into shared money, intimacy and trust quickly. Your partnerships tend to be intense and to change you.",
  "You are drawn to partners from another background, country or belief, or you meet them through travel and study.",
  "Relationships are tied to your work and public standing. You may meet partners through your career, and your partner affects your reputation.",
  "Friendship is your way in. Partners come out of your friend group or shared causes, and you want a partner who is also a friend.",
  "Relationships have a private or hidden side: long distances, secrets, timing that does not line up, or a partner you care for quietly.",
];

export interface Dynamic {
  /** Name of the difficult form, and of the easy form. */
  name: string;
  easyName: string;
  /** The difficult form, and the easy form, said about someone else. */
  them: string;
  themEasy: string;
  /** How a conjunction reads. */
  conj: "hard" | "flowing";
  hard: string;
  flowing: string;
}

/**
 * Recurring relationship dynamics shown by aspects in your own chart. Keys: "<faster>-<slower>".
 * The choice of planet pairs and their themes follows Sue Tompkins, "Aspects in Astrology";
 * the wording is our own and is limited to what each pair means in relationships.
 */
export const DYNAMICS: Record<string, Dynamic> = {
  "venus-saturn": {
    name: "The slow thaw",
    them: "They expect love to be earned and hold back until they are sure. They can seem cool, or slow to commit.",
    easyName: "Built to last",
    themEasy: "They are steady in love and commit without drama.",
    conj: "hard",
    hard: "You expect love to be earned, and part of you waits for it to be withdrawn. You hold back until you are sure, choose partners who are hard to reach, or stay loyal long after the warmth has gone. The other side of this is that what you build tends to last.",
    flowing: "You are steady in love. You commit without drama and you value loyalty, and your relationships tend to last longer than those of the people around you.",
  },
  "venus-uranus": {
    name: "Come close, need space",
    them: "They want closeness and then need room. Expect them to pull away when things get settled.",
    easyName: "Room to breathe",
    themEasy: "They keep things fresh and give a partner freedom without feeling threatened.",
    conj: "hard",
    hard: "Attraction arrives suddenly for you and can leave the same way. When someone gets close you want room; when they give you room you want them back. You are often drawn to people who are unavailable or far away because the distance is already built in.",
    flowing: "You keep relationships fresh. You are open to unusual people and arrangements, and you give a partner freedom without feeling threatened by it.",
  },
  "venus-neptune": {
    name: "The idealised partner",
    them: "They fall for an ideal and are let down by the real person. They can give too much and resent it quietly.",
    easyName: "The romantic",
    themEasy: "They are tender, forgiving and romantic.",
    conj: "hard",
    hard: "You fall for who someone could be. Early on you fill the gaps with hope, and the disappointment comes when the real person shows up. You are also prone to giving more than you get and calling it love.",
    flowing: "You are romantic and kind in love, with a real gift for tenderness. You forgive easily and you bring imagination into a relationship.",
  },
  "venus-pluto": {
    name: "All or nothing",
    them: "They attach intensely and find it hard to let go. Jealousy and tests of loyalty are likely.",
    easyName: "Deep loyalty",
    themEasy: "They love deeply and are not put off by a partner’s difficult sides.",
    conj: "hard",
    hard: "You do not do casual. Your relationships go deep fast and can turn into jealousy, power struggles or an inability to let go. You are drawn to people who change you, and endings are rarely clean.",
    flowing: "You love deeply and loyally, and you are not afraid of a partner's difficult sides. Your relationships tend to change you for the better.",
  },
  "venus-mars": {
    name: "Chemistry first",
    them: "They are drawn to friction and can take arguments for passion.",
    easyName: "Easy chemistry",
    themEasy: "Affection and desire work together in them, and they show interest easily.",
    conj: "flowing",
    hard: "What you want and what is good for you pull in different directions. You are attracted to friction, so relationships with strong chemistry and frequent arguments feel more real to you than calm ones.",
    flowing: "Affection and desire work together in you. You are comfortable showing interest, and attraction comes easily and is usually returned.",
  },
  "venus-jupiter": {
    name: "More is more",
    them: "They overdo it in love: big gestures early, then restlessness when the excitement settles.",
    easyName: "Generous heart",
    themEasy: "They are warm and generous, and good company.",
    conj: "flowing",
    hard: "You are generous in love and inclined to overdo it: too much too soon, big promises, or expecting a relationship to stay as exciting as its first month.",
    flowing: "You are warm and generous, and people like being around you. You tend to be lucky in love and to draw partners who are good for you.",
  },
  "moon-saturn": {
    name: "Self-contained",
    them: "They keep their feelings to themselves and find it hard to ask for comfort. They can seem most distant when they most need someone.",
    easyName: "The steady one",
    themEasy: "They are emotionally steady and keep their head in a crisis.",
    conj: "hard",
    hard: "You learned early to look after your own feelings. You find it hard to ask for comfort, and you can pick partners who are emotionally sparing because that feels familiar. People often do not know when you need them.",
    flowing: "You are emotionally steady and dependable. You keep your head in a crisis, and partners come to rely on you.",
  },
  "moon-uranus": {
    name: "Restless heart",
    them: "They need a lot of emotional space and get restless with routine.",
    easyName: "Easy independence",
    themEasy: "They are emotionally independent and do not crowd a partner.",
    conj: "hard",
    hard: "You need more emotional freedom than most relationships assume. Too much routine or closeness makes you restless, and you may leave, or provoke a change, when things get too settled.",
    flowing: "You are emotionally independent and easy to be with. You do not crowd a partner, and change does not frighten you.",
  },
  "moon-neptune": {
    name: "The absorber",
    them: "They soak up other people’s moods and lose track of their own needs.",
    easyName: "The intuitive",
    themEasy: "They pick up what a partner feels without being told.",
    conj: "hard",
    hard: "You take on a partner's feelings as if they were yours. It makes you very caring and it makes your own needs hard to locate. You can stay in something draining because you feel sorry for the other person.",
    flowing: "You are intuitive and gentle, and you pick up what a partner feels without being told. People feel understood by you.",
  },
  "moon-pluto": {
    name: "Deep waters",
    them: "They feel things intensely and fear being left, which can come out as control.",
    easyName: "Emotional stamina",
    themEasy: "They have emotional depth and stay through difficult periods.",
    conj: "hard",
    hard: "You feel everything intensely and you guard against being abandoned. You may try to control a relationship to feel safe in it, or pick partners who do that to you. Trust has to be proved.",
    flowing: "You have emotional depth and stamina. You can stay with a partner through difficult periods, and you are hard to shock.",
  },
  "moon-venus": {
    name: "Comfort versus desire",
    them: "What attracts them and what comforts them are different, so they send mixed signals about what they want.",
    easyName: "Heart in agreement",
    themEasy: "What they want and what they need agree, so they are easy to be close to.",
    conj: "flowing",
    hard: "What attracts you and what makes you feel safe are different things. You can end up with exciting partners who do not look after you, or kind ones you do not want.",
    flowing: "What you want and what you need agree. You are affectionate and easy to be close to, and you tend to choose partners who are kind to you.",
  },
  "moon-mars": {
    name: "Quick to flare",
    them: "They react fast and hot when they are hurt.",
    easyName: "Says what they feel",
    themEasy: "They say what they need directly and recover quickly after an argument.",
    conj: "hard",
    hard: "Your feelings come out as heat. You react fast, argue when you are hurt, and can read a calm partner as an indifferent one.",
    flowing: "You act on your feelings without much delay. You are direct about what you need, and you recover quickly after an argument.",
  },
  "sun-moon": {
    name: "Two minds",
    them: "What they want and what they need pull apart, so they are hard to satisfy.",
    easyName: "Of one mind",
    themEasy: "They know what they are looking for and send clear signals.",
    conj: "flowing",
    hard: "What you want for yourself and what you need to feel safe pull in different directions, so part of you is always unsatisfied with a relationship. Partners may get mixed signals about what you are asking for.",
    flowing: "What you want and what you need line up. You tend to know what you are looking for, and you send clear signals.",
  },
  "mars-saturn": {
    name: "Stop and start",
    them: "They hold back desire and anger until it comes out as resentment.",
    easyName: "Patient desire",
    themEasy: "They are patient about what they want and follow through.",
    conj: "hard",
    hard: "You hold your desire back. You hesitate to make the first move, fear rejection, and can let resentment build instead of saying what you want. With trust this becomes real staying power.",
    flowing: "You are patient and disciplined about what you want. You do not rush, and you follow through.",
  },
  "mars-uranus": {
    name: "Sudden attractions",
    them: "They act on impulse and rebel when they feel controlled.",
    easyName: "The spark",
    themEasy: "They are spontaneous and keep things lively.",
    conj: "hard",
    hard: "Attraction hits you without warning and you act on it. You want excitement and independence, and you can blow up a relationship when you feel controlled.",
    flowing: "You are spontaneous and bring energy to a relationship. You like trying new things and you keep the spark going.",
  },
  "mars-pluto": {
    name: "The power struggle",
    them: "They do not back down, and disagreements become contests of will.",
    easyName: "Strong will",
    themEasy: "They have strong desire and will, and put both into the relationship.",
    conj: "hard",
    hard: "You want intensely and you do not back down. Relationships can become contests of will, and you are attracted to people who are as forceful as you are.",
    flowing: "You have strong desire and strong will, and you put them into the relationship. You are not easily discouraged.",
  },  "sun-mars": {
    name: "Has to win",
    them: "They compete and push without meaning to, and anger comes quickly.",
    easyName: "Self-starter",
    themEasy: "They are direct and energetic, and a partner knows where they stand.",
    conj: "hard",
    hard: "You assert yourself hard and compete without meaning to, including with the person you love. You are quick to anger and need a partner who can stand their ground without turning every difference into a fight.",
    flowing: "You go after what you want with confidence and energy. You are direct, and partners tend to know where they stand with you.",
  },
  "sun-jupiter": {
    name: "Larger than life",
    them: "They promise big, and can take goodwill for granted or get restless with ordinary life.",
    easyName: "Good faith",
    themEasy: "They are confident, generous and good for a partner’s morale.",
    conj: "flowing",
    hard: "You think big and promise big. Confidence can tip into taking a partner’s goodwill for granted, or into restlessness when ordinary life sets in.",
    flowing: "You are confident and generous, and you expect things to work out. That optimism is easy to be around and tends to lift a partner.",
  },
  "sun-saturn": {
    name: "Never quite enough",
    them: "They doubt their own worth and work to prove it, which can come out as control or as holding back.",
    easyName: "The dependable one",
    themEasy: "They are responsible and realistic, and a partner can depend on them.",
    conj: "hard",
    hard: "You doubt whether you are good enough, and you work hard to prove it. In love that can look like control, self-criticism, or holding back until you feel you have earned your place. You take commitment seriously and come into your own with time.",
    flowing: "You are responsible and realistic, and you finish what you start. A partner can depend on you.",
  },
  "sun-uranus": {
    name: "Not like the others",
    them: "They need to be free to be different, and may break the rules to prove they still can.",
    easyName: "Their own person",
    themEasy: "They are independent and original, and give a partner freedom too.",
    conj: "hard",
    hard: "You need to be free to be different. You resist being told who to be, and you may break a relationship’s rules, or the relationship, to prove you still can.",
    flowing: "You are independent and original without having to fight for it, and you give a partner the same freedom.",
  },
  "sun-neptune": {
    name: "The shape-shifter",
    them: "Their sense of self is fluid: they can become what a partner wants, or drift when things get hard.",
    easyName: "The gentle one",
    themEasy: "They are imaginative, compassionate and gentle.",
    conj: "hard",
    hard: "Your sense of who you are is fluid. You can become what a partner wants, idealise them, or drift away when reality gets hard. You are sensitive and compassionate, and you need to keep hold of your own outline.",
    flowing: "You are imaginative and compassionate, and you sense what other people need. You bring gentleness to a relationship.",
  },
  "sun-pluto": {
    name: "All the way down",
    them: "They live intensely, do not give up control easily, and trust slowly.",
    easyName: "Staying power",
    themEasy: "They have depth and stamina, and are not afraid of what is difficult.",
    conj: "hard",
    hard: "You live intensely and do not give up control easily. You may test a partner, hide what matters most, or reinvent yourself completely after a loss. Trust, once given, is total.",
    flowing: "You have depth and stamina, and you can remake yourself when you need to. You are not afraid of what is difficult in a relationship.",
  },
  "moon-jupiter": {
    name: "Big feelings",
    them: "Their feelings run large: generous and protective, and prone to over-reacting.",
    easyName: "Big-hearted",
    themEasy: "They are warm and emotionally generous, and people feel looked after around them.",
    conj: "flowing",
    hard: "Your feelings run large. You are generous and protective, and you can over-react, over-give, or expect more emotional return than a partner has to offer.",
    flowing: "You are warm and emotionally generous, and you trust that things will be all right. People feel looked after around you.",
  },
  "mars-jupiter": {
    name: "Too much, too fast",
    them: "They throw themselves in, overdo it and take risks.",
    easyName: "Wholehearted",
    themEasy: "They act with enthusiasm and bring energy and fun.",
    conj: "flowing",
    hard: "You throw yourself in. Your appetite for life and for people is large, and you can overdo it, take risks, or move on to the next thing before this one is finished.",
    flowing: "You act with enthusiasm and confidence, and things you start tend to go well. You bring energy and fun to a relationship.",
  },
  "mars-neptune": {
    name: "Chasing a dream",
    them: "Their desire is tied to fantasy, and they find it hard to say plainly what they want.",
    easyName: "The romantic pursuer",
    themEasy: "They are a gentle, romantic and inventive lover.",
    conj: "hard",
    hard: "Your desire is tied to fantasy. You can pursue an ideal instead of a person, lose your drive when things turn ordinary, or find it hard to say plainly what you want.",
    flowing: "Imagination and desire work together in you. You are a gentle, romantic and inventive lover.",
  },
};

/** Fallback headline when no dynamic stands out: by Venus sign. */
export const VENUS_HEADLINES = [
  "The spark-chaser", "The slow builder", "The curious heart", "The homemaker", "The big-hearted romantic", "The careful chooser",
  "The natural partner", "The all-in lover", "The free spirit", "The long-game lover", "The friend first", "The dreamer",
];

/** Sign qualities for the relationship (composite) chart: [what it is like, what it needs]. */
export const SIGN_QUALITY: [string, string][] = [
  ["direct, energetic and competitive", "something to do or win together"],
  ["steady, sensual and slow to change", "comfort, routine and time"],
  ["talkative, playful and restless", "conversation and variety"],
  ["protective, private and family-minded", "a home base and emotional safety"],
  ["warm, proud and expressive", "fun, romance and being seen as a couple"],
  ["practical, attentive and a little anxious", "shared routines and usefulness to each other"],
  ["considerate, sociable and balanced", "fairness and time together"],
  ["intense, private and all-in", "complete honesty and trust"],
  ["adventurous, frank and optimistic", "freedom, travel and shared beliefs"],
  ["serious, ambitious and built to last", "shared goals and commitment"],
  ["friendly, unconventional and independent", "space and a shared circle of friends"],
  ["tender, intuitive and loosely defined", "quiet, imagination and compassion"],
];

/* ---------- Contacts between two charts ---------- */

/** Slowest last: the slower point acts on the faster one. */
const SPEED: PointId[] = ["asc", "dsc", "mc", "moon", "mercury", "venus", "sun", "mars", "node", "jupiter", "saturn", "uranus", "neptune", "pluto"];

const ACTS: Partial<Record<PointId, string>> = {
  moon: "responds emotionally to",
  mercury: "gets talking with",
  venus: "is drawn to",
  sun: "lights up",
  mars: "stirs up",
  node: "feels tied to",
  jupiter: "encourages and enlarges",
  saturn: "steadies, tests or holds back",
  uranus: "excites and unsettles",
  neptune: "romanticises and blurs",
  pluto: "intensifies and grips",
};

const AREA: Record<PointId, string> = {
  sun: "sense of self",
  moon: "emotional needs",
  mercury: "way of thinking and talking",
  venus: "way of loving",
  mars: "drive and desire",
  jupiter: "hopes and beliefs",
  saturn: "fears and boundaries",
  uranus: "need for freedom",
  neptune: "ideals",
  pluto: "deepest drives",
  node: "sense of direction",
  asc: "way of showing up",
  dsc: "picture of a partner",
  mc: "direction in life",
};

const HEAVY = new Set<PointId>(["mars", "saturn", "uranus", "neptune", "pluto"]);

const CLASS_TAIL: Record<AspectClass, string> = {
  conjunction: "This one is felt strongly and from the start.",
  hard: "It works through friction: attraction mixed with tension.",
  flowing: "It works easily and takes little effort.",
};

/** Hand-written notes for the contacts that matter most. Keys: two points in SPEED order, joined by "-". */
const CONTACT_NOTES: Record<string, { conj: "hard" | "flowing"; hard: string; flowing: string }> = {
  "moon-sun": {
    conj: "flowing",
    hard: "One person's way of being rubs against what the other needs to feel safe. You keep trying to adjust to each other.",
    flowing: "One person's nature is what the other needs to feel at home. This is one of the classic signs of feeling right together.",
  },
  "moon-moon": {
    conj: "flowing",
    hard: "You need different things when upset, so comforting each other takes learning.",
    flowing: "You feel safe in similar ways and read each other's moods without explanation.",
  },
  "moon-venus": {
    conj: "flowing",
    hard: "There is affection, with different ideas about how it should be shown.",
    flowing: "Affection comes easily here: tender, comfortable and kind.",
  },
  "venus-mars": {
    conj: "flowing",
    hard: "Strong physical chemistry with an edge: you provoke each other as much as you attract.",
    flowing: "Strong, easy physical chemistry. One pursues in the way the other likes to be pursued.",
  },
  "venus-sun": {
    conj: "flowing",
    hard: "Real liking, with different tastes and values to negotiate.",
    flowing: "Simple liking and admiration. You enjoy each other's company.",
  },
  "sun-mars": {
    conj: "hard",
    hard: "You energise and irritate each other. Competition and arguments come easily.",
    flowing: "You energise each other and get things done together.",
  },
  "moon-mars": {
    conj: "hard",
    hard: "Mars's bluntness hurts the Moon person's feelings, and reactions run hot on both sides.",
    flowing: "Emotional and physical attraction feed each other.",
  },
  "moon-saturn": {
    conj: "hard",
    hard: "The Moon person feels criticised or shut out; the Saturn person feels responsible and weighed down. It binds people together and can make them lonely together.",
    flowing: "The Saturn person gives the Moon person stability, and the bond holds up over time.",
  },
  "venus-saturn": {
    conj: "hard",
    hard: "Commitment is the theme, with affection that is rationed or delayed. One person waits for the other to warm up or to be ready.",
    flowing: "Loyal and durable. Affection may be undemonstrative, and it is dependable.",
  },
  "sun-saturn": {
    conj: "hard",
    hard: "The Saturn person takes the Sun person seriously and can also judge or limit them. It feels like duty as much as ease.",
    flowing: "Mutual respect and staying power.",
  },
  "mars-saturn": {
    conj: "hard",
    hard: "One pushes and the other blocks. Timing is off, and frustration builds on both sides.",
    flowing: "Drive and discipline work together; you can build things as a pair.",
  },
  "moon-uranus": {
    conj: "hard",
    hard: "Exciting and unstable. The Moon person never quite knows where they stand.",
    flowing: "The Uranus person brings freshness and room to breathe.",
  },
  "venus-uranus": {
    conj: "hard",
    hard: "Instant attraction that struggles with consistency: on and off, close and distant.",
    flowing: "A lively, unconventional attraction that stays interesting.",
  },
  "moon-neptune": {
    conj: "hard",
    hard: "Great sympathy, with confusion about who feels what. One person can be idealised or leaned on too much.",
    flowing: "Tender and intuitive; you understand each other without words.",
  },
  "venus-neptune": {
    conj: "hard",
    hard: "Highly romantic, and prone to illusion. One sees the other as they wish them to be.",
    flowing: "Romantic and gentle, with real tenderness.",
  },
  "moon-pluto": {
    conj: "hard",
    hard: "Emotionally consuming. The Pluto person has a strong hold on the Moon person's feelings, and possessiveness is a risk.",
    flowing: "A deep emotional bond that is hard to break.",
  },
  "venus-pluto": {
    conj: "hard",
    hard: "Magnetic and obsessive. Jealousy and control are the risks, and it is hard to walk away from.",
    flowing: "Deep attraction and strong loyalty.",
  },
  "mars-pluto": {
    conj: "hard",
    hard: "Powerful desire and a contest of wills.",
    flowing: "Strong desire and shared determination.",
  },
  "venus-node": {
    conj: "flowing",
    hard: "The affection is real, and it pulls against where one of you is heading.",
    flowing: "A feeling of being meant to meet. Affection comes with a sense of direction.",
  },
  "moon-node": {
    conj: "flowing",
    hard: "Deep familiarity that can hold one of you back.",
    flowing: "A sense of familiarity from the first meeting.",
  },
  "sun-node": {
    conj: "flowing",
    hard: "An important meeting that challenges where one of you is going.",
    flowing: "A significant meeting: one person helps the other move forward.",
  },
};

export const pairKey = (a: PointId, b: PointId) => (SPEED.indexOf(a) <= SPEED.indexOf(b) ? `${a}-${b}` : `${b}-${a}`);

/**
 * One contact between your chart and another person's, in words.
 * `yours` and `theirs` are the two points; `cls` is the kind of aspect.
 */
export function contactText(
  yours: PointId,
  theirs: PointId,
  cls: AspectClass,
  theirName = "Their",
  /** The exact aspect: its definition, and a note when its signs are in unusual elements, are added to the text. */
  exact?: { word: string; definition: string; elementNote: string },
): { title: string; body: string; tone: "hard" | "flowing"; curated: boolean } {
  const possessive = theirName === "Their" ? "Their" : `${theirName}’s`;
  const yourActs = SPEED.indexOf(yours) > SPEED.indexOf(theirs);
  const [actor, receiver] = yourActs ? [yours, theirs] : [theirs, yours];
  const actorOwner = yourActs ? "Your" : possessive;
  const receiverOwner = yourActs ? (theirName === "Their" ? "their" : possessive) : "your";
  const kind = exact ? exact.word : cls === "conjunction" ? "on" : cls === "hard" ? "in tension with" : "in harmony with";
  const title = `${possessive} ${POINT_NAMES[theirs]} ${kind} your ${POINT_NAMES[yours]}`;
  const note = CONTACT_NOTES[pairKey(yours, theirs)];
  const general = `${actorOwner} ${POINT_NAMES[actor]} ${ACTS[actor] ?? "meets"} ${receiverOwner} ${AREA[receiver]}.`;
  // A conjunction takes its tone from the hand-written note, or from the planets involved.
  const tone: "hard" | "flowing" = cls !== "conjunction" ? cls : note ? note.conj : HEAVY.has(actor) ? "hard" : "flowing";
  const parts = [general, note ? note[tone] : "", exact ? exact.definition : note ? "" : CLASS_TAIL[cls], exact?.elementNote ?? ""];
  return { title, body: parts.filter(Boolean).join(" "), tone, curated: !!note };
}

/* ---------- Timing ---------- */

export const TRANSIT_THEME: Record<string, { name: string; easy: string; hard: string }> = {
  jupiter: {
    name: "An opening",
    easy: "Jupiter brings more: more invitations, more confidence, more people. A good period for meeting someone, or for a relationship to grow.",
    hard: "Jupiter brings more, sometimes too much: big feelings, big promises and a tendency to overreach. Opportunities are real; pace yourself.",
  },
  saturn: {
    name: "A reality check",
    easy: "Saturn asks what is real and what will last. Relationships get defined: committed to, or ended because they cannot bear weight.",
    hard: "Saturn tests. Distance, obligations or doubt put pressure on love, and what is not working becomes hard to ignore. What survives this is solid.",
  },
  uranus: {
    name: "A shake-up",
    easy: "Uranus breaks routine. Expect sudden attractions, new kinds of people and a strong need for freedom.",
    hard: "Uranus disrupts. Relationships that have become confining may break open, and attractions can arrive and leave without warning. Avoid permanent decisions made in a week.",
  },
  neptune: {
    name: "A soft-focus period",
    easy: "Neptune heightens romance and longing. It is easy to fall in love with an idea, so check what you see against what is there.",
    hard: "Neptune blurs. You may idealise someone, be unclear about where you stand, or grieve something that is fading. Judgment about people is at its weakest.",
  },
  pluto: {
    name: "A deep change",
    easy: "Pluto transforms slowly and for good. What you want from love changes at the root, and relationships either deepen or end.",
    hard: "Pluto strips away what is finished. Expect intensity, power struggles, or an attachment that is very hard to release. You come out wanting something different.",
  },
};

export const TARGET_AREA: Record<string, string> = {
  venus: "your Venus, how you love and what attracts you",
  moon: "your Moon, your emotional needs",
  mars: "your Mars, your desire and drive",
  sun: "your Sun, your sense of self",
  axis: "your Ascendant–Descendant axis, the line of partnership in your chart",
  ruler: "the ruler of your 7th house, the planet that stands for your partners",
  "c-sun": "the relationship’s Sun, its core identity",
  "c-moon": "the relationship’s Moon, its emotional life",
  "c-venus": "the relationship’s Venus, its affection",
};

/* ---------- Describing other people ---------- */

/** People with a planet in each sign, in a few words. */
export const SIGN_PEOPLE = [
  "bold, impatient and direct", "steady, sensual and stubborn", "quick, talkative and changeable", "caring, moody and protective",
  "warm, proud and dramatic", "careful, helpful and critical", "charming, agreeable and indecisive", "intense, private and loyal",
  "frank, restless and optimistic", "serious, ambitious and reserved", "independent, unconventional and detached", "gentle, dreamy and evasive",
];

export const ELEMENT_PEOPLE: Record<string, string> = {
  fire: "warm, impulsive and expressive",
  earth: "practical, steady and physical",
  air: "sociable, talkative and led by ideas",
  water: "emotional, private and intuitive",
};

/** What a planet shows about a person. */
export const BODY_SHOWS: Partial<Record<BodyId, string>> = {
  sun: "basic character",
  moon: "way of handling feelings",
  venus: "way of showing love",
  mars: "way of pursuing and arguing",
  saturn: "seriousness and limits",
};

/** The part of your life each house stands for. */
export const HOUSE_AREA = [
  "identity and first impressions", "money and security", "everyday talk and thinking", "home and private life",
  "romance, fun and creativity", "work and daily routine", "committed partnership", "intimacy, trust and shared resources",
  "travel, study and beliefs", "career and reputation", "friendships and hopes", "the inner life and what is kept hidden",
];

/* ---------- Triggers ---------- */

/** How one person's planet sets off a difficult aspect in the other's chart. {P} is "Your" or "Sam’s". */
export const SETS_OFF: Partial<Record<PointId, string>> = {
  sun: "{P} ordinary way of being is enough to set it off.",
  moon: "{P} moods and needs set it off.",
  mercury: "{P} words set it off: what is said, and how.",
  venus: "{P} affection, tastes and wants set it off.",
  mars: "{P} anger, desire or pushing sets it off.",
  jupiter: "{P} enthusiasm and promises make it bigger.",
  saturn: "{P} criticism, distance or demands press on it.",
  uranus: "{P} unpredictability jolts it.",
  neptune: "{P} vagueness or elusiveness feeds it.",
  pluto: "{P} intensity or need for control forces it to the surface.",
  node: "{P} direction in life pulls it into the centre of things.",
  asc: "{P} manner and presence set it off.",
};

/** What each planet contributes when it supports an aspect in the other person's chart. {P} is "Your" or "Sam’s". */
export const SUPPORTS_WITH: Partial<Record<PointId, string>> = {
  sun: "{P} ordinary way of being",
  moon: "{P} care and attention",
  mercury: "{P} way of talking things through",
  venus: "{P} affection",
  mars: "{P} energy and directness",
  jupiter: "{P} optimism and generosity",
  saturn: "{P} steadiness and patience",
  uranus: "{P} openness and spontaneity",
  neptune: "{P} gentleness and acceptance",
  pluto: "{P} depth and commitment",
  node: "{P} direction in life",
  asc: "{P} manner and presence",
};
