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
  /** The conjunction, where it reads differently from both. */
  conjName?: string;
  conjYou?: string;
  conjThem?: string;
}

/**
 * Recurring relationship dynamics shown by aspects in your own chart. Keys: "<faster>-<slower>".
 * The choice of planet pairs and their themes follows Sue Tompkins, "Aspects in Astrology";
 * the wording is our own and is limited to what each pair means in relationships.
 */
export const DYNAMICS: Record<string, Dynamic> = {
  "venus-saturn": {
    name: "The slow thaw",
    them: "They expect love to be earned, find it awkward to receive affection, and take a long time to feel safe. They can seem cool, or ask for proof.",
    easyName: "Built to last",
    themEasy: "They are steady in love and commit without drama.",
    conj: "hard",
    hard: "You expect love to be earned and watch for signs that it is being withdrawn. You find it awkward to receive affection, want proof of it, and can fall for people you cannot have or stay loyal long after the warmth has gone. It takes you a long time to feel safe. Your strength is endurance: you make a relationship work over years, and do better once the first glamour has worn off.",
    flowing: "You are steady in love. You commit without drama and you value loyalty, and your relationships tend to last longer than those of the people around you.",
  },
  "venus-uranus": {
    name: "Come close, need space",
    them: "They want closeness and then need room. They expect to be rejected, so they act detached first, and pull away when things get settled.",
    easyName: "Room to breathe",
    themEasy: "They keep things fresh and give a partner freedom without feeling threatened.",
    conj: "hard",
    hard: "You want closeness and you want your freedom, and joining the two is your task. Attraction arrives suddenly and can leave the same way. You expect affection to be switched off, so you act detached first, and you are often drawn to people who are unavailable because the distance is already built in.",
    flowing: "You keep relationships fresh. You are open to unusual people and arrangements, and you give a partner freedom without feeling threatened by it.",
  },
  "venus-neptune": {
    name: "The idealised partner",
    them: "They fall for an ideal and are let down by the real person. Committing is hard for them because nothing matches the dream.",
    easyName: "The romantic",
    themEasy: "They are tender, forgiving and romantic.",
    conj: "hard",
    hard: "You are in love with love. You fall for who someone could be, and no real relationship quite matches the dream, so committing is hard and disappointment arrives when the glamour fades. You are easily carried away, and prone to giving more than you get. Loving people in general comes easily to you; loving one equal, as they are, is the work.",
    flowing: "You are romantic and kind in love, with a real gift for tenderness. You forgive easily and you bring imagination into a relationship.",
  },
  "venus-pluto": {
    name: "All or nothing",
    them: "They dread rejection and want all or nothing. Jealousy, tests of loyalty and trouble letting go are likely.",
    easyName: "Unafraid of depth",
    themEasy: "They are not afraid of a real relationship, and they cope well with a crisis.",
    conj: "hard",
    hard: "You dread rejection and only the deepest bond will do. You may keep people at arm’s length where you can control things, or plunge into consuming relationships, sometimes with someone you cannot have. Jealousy, tests of loyalty and manoeuvring to keep someone’s love are the risks. The lesson is to trust and let go.",
    flowing: "You are not afraid of a real relationship. You cope with crises, insist on the truth between you, and tend to change, and be changed by, the people you love.",
  },
  "venus-mars": {
    name: "Love and war",
    them: "They fall in love fast, and love and anger go together for them. Rivalry and triangles are a risk.",
    easyName: "Easy chemistry",
    themEasy: "Affection and desire work together in them, and they show interest easily.",
    conj: "flowing",
    hard: "You fall in love fast and you are rarely alone. Love and anger arrive together for you, and love can turn into a contest: rivals, triangles, or a history of having to compete for affection. You can be too pushy or too accommodating, and can take desire for love. You need a relationship with real spark, not just company.",
    flowing: "Affection and desire work together in you. You know when to push and when to give way, attraction comes easily, and you need a relationship with real spark, not just company.",
  },
  "venus-jupiter": {
    name: "More is more",
    them: "They cannot get enough affection, overdo it early, and get restless when the excitement settles.",
    easyName: "Generous heart",
    themEasy: "They are warm and generous, and good company.",
    conj: "flowing",
    hard: "You cannot get enough affection, and you give it lavishly. You inflate a new love, expect the excitement to last, and can decide the grass is greener when it does not. Learning where to stop, and that love cannot be bought with generosity, is your task.",
    flowing: "You are warm and generous, and people like being around you. You tend to be lucky in love and to draw partners who are good for you.",
  },
  "moon-saturn": {
    name: "Self-contained",
    them: "They guard their feelings and find it hard to let anyone look after them. They can seem most distant when they most need someone.",
    easyName: "The steady one",
    themEasy: "They are emotionally steady and keep their head in a crisis.",
    conj: "hard",
    hard: "You learned early to look after your own feelings. You express them guardedly and find it hard to let anyone look after you, so people often do not know when you need them. You hold on to what is familiar and can choose partners who resemble the family you grew up in. Risking showing that you need someone is the way through.",
    flowing: "You are emotionally steady and dependable. You keep your head in a crisis, and partners come to rely on you.",
  },
  "moon-uranus": {
    name: "Restless heart",
    them: "They need a lot of emotional space. When hurt threatens they cut off first.",
    easyName: "Easy independence",
    themEasy: "They are emotionally independent and do not crowd a partner.",
    conj: "hard",
    hard: "You need more emotional freedom than most relationships assume, and you hate to feel fenced in. You half expect to be rebuffed, so when hurt threatens you cut off first, sometimes with a drastic move. Too much routine makes you restless.",
    flowing: "You are emotionally independent and easy to be with. You do not crowd a partner, and change does not frighten you.",
  },
  "moon-neptune": {
    name: "The absorber",
    them: "They soak up other people’s moods, find it hard to say plainly what they feel, and long for a kind of care nobody can quite give.",
    easyName: "The intuitive",
    themEasy: "They pick up what a partner feels without being told.",
    conj: "hard",
    hard: "You take on a partner’s feelings as if they were yours, and you are reluctant to say plainly what you feel yourself. You long for a completely selfless kind of care that no real person can supply, and may look to be rescued or to rescue. Your boundaries are thin, and you can stay in something draining out of sympathy.",
    flowing: "You are intuitive and gentle, and you pick up what a partner feels without being told. People feel understood by you.",
  },
  "moon-pluto": {
    name: "Deep waters",
    them: "Their feelings are intense and mostly hidden. They trust slowly, need time alone, and find it hard to let go of a hurt.",
    easyName: "Emotional stamina",
    themEasy: "They have emotional depth and stay through difficult periods.",
    conj: "hard",
    hard: "Your emotional life is intense and mostly hidden. You go deep into a relationship and then need time alone to recover, and you fear being emotionally invaded, so trusting someone with your feelings is slow. You find it hard to let go of hurt or jealousy, and may probe a partner to protect yourself.",
    flowing: "You have emotional strength and insight. You can stay with a partner through difficult periods, and you are hard to shock.",
  },
  "moon-venus": {
    name: "Comfort versus desire",
    them: "They adapt too readily and are easily hurt by small signs of rejection. What comforts them and what attracts them can be different kinds of person.",
    easyName: "Heart in agreement",
    themEasy: "What they want and what they need agree, so they are easy to be close to.",
    conj: "hard",
    hard: "You adapt to people too readily and are easily hurt: small signs of rejection or unfairness go deep. What comforts you and what attracts you can be two different kinds of person, the one who looks after you and the one who excites you. You want very much to care and be cared for.",
    flowing: "What you want and what you need agree. You are affectionate and easy to be close to, and you tend to choose partners who are kind to you.",
  },
  "moon-mars": {
    name: "On the defensive",
    them: "They react fast, as if under threat, and their anger tends to smoulder.",
    easyName: "Says what they feel",
    themEasy: "They say what they need directly and recover quickly after an argument.",
    conj: "hard",
    hard: "You react fast, as if under threat, and you are touchy about discord. Yet anger is often hard for you to express directly, so it smoulders. You are pulled between safety and home on one side and independence and excitement on the other. You are honest about what you feel and dislike emotional ambiguity.",
    flowing: "You act on your feelings without much delay. You are direct about what you need, and you recover quickly after an argument.",
    conjYou: "You react fast and you know when you are angry. You are honest, even blunt, about what you feel, and you dislike emotional ambiguity. You are pulled between safety and home on one side and independence and excitement on the other.",
    conjThem: "They react fast and are blunt about what they feel.",
  },
  "sun-moon": {
    name: "Two minds",
    them: "What they want and what they need pull apart, so they are hard to satisfy.",
    easyName: "Of one mind",
    themEasy: "They know what they are looking for and send clear signals.",
    conj: "flowing",
    hard: "What you want for yourself and what you need to feel safe pull in different directions, so part of you is always unsatisfied with a relationship. You tend to replay the difficulties of your parents’ relationship in your own.",
    flowing: "What you want and what you need line up. You tend to know what you are looking for, and you send clear signals.",
    conjName: "Single-minded",
    conjYou: "What you want and what you need are the same thing, so you are decisive and self-reliant and rarely ask for advice. The cost is that you see things from your own side: it takes you a while to register that a partner needs something different.",
    conjThem: "They are decisive and self-reliant, and slow to register that a partner needs something different.",
  },
  "mars-saturn": {
    name: "Stop and start",
    them: "They run hot and cold: they hold back desire and anger, then push too hard.",
    easyName: "Patient desire",
    themEasy: "They are patient about what they want and follow through.",
    conj: "hard",
    hard: "You run hot and cold, in desire and in anger. You hold back, fear rejection and let resentment build, and then push too hard. You may choose partners who pose no challenge, or feel you have to prove yourself. Saying what you want, and admitting when you are angry, is the way through. With trust this becomes real staying power.",
    flowing: "You are patient and disciplined about what you want. You do not rush, and you follow through.",
  },
  "mars-uranus": {
    name: "Sudden attractions",
    them: "They want excitement, act on impulse, and rebel when they feel controlled.",
    easyName: "The spark",
    themEasy: "They are spontaneous and keep things lively.",
    conj: "hard",
    hard: "You want a great deal of excitement and you act on attraction at once. Staying the course is harder. You are wilful, you flout what is expected, and you can blow up a relationship when you feel controlled.",
    flowing: "You are spontaneous and bring energy to a relationship. You like trying new things and you keep the spark going.",
  },
  "mars-pluto": {
    name: "The power struggle",
    them: "They either force the issue or refuse to compete, and disagreements become contests of will.",
    easyName: "Strong will",
    themEasy: "They have strong desire and will, and put both into the relationship.",
    conj: "hard",
    hard: "You want intensely. You either force the issue or give up and refuse to compete, and anger you have buried can come back at you through other people. Relationships can become contests of will. Showing love, and forgiving, is what eases it.",
    flowing: "You have strong desire and strong will, and you put them into the relationship. You are not easily discouraged.",
  },  "sun-mars": {
    name: "Has to win",
    them: "They compete and push without meaning to, and anger comes quickly.",
    easyName: "Self-starter",
    themEasy: "They are direct and energetic, and a partner knows where they stand.",
    conj: "hard",
    hard: "You have something to prove about your own courage, and you compete without meaning to, including with the person you love. You are quick to anger, can ride over gentler people, and are not a natural peacemaker.",
    flowing: "You go after what you want with confidence and energy. You are direct, and partners tend to know where they stand with you.",
    conjYou: "You identify with being bold and direct, and you do not see how forceful you are. You want things now, and you are not a natural peacemaker.",
    conjThem: "They are bolder and more forceful than they realise.",
  },
  "sun-jupiter": {
    name: "Larger than life",
    them: "They can be over-confident and careless, and get restless with ordinary life.",
    easyName: "Good faith",
    themEasy: "They are confident, generous and good for a partner’s morale.",
    conj: "flowing",
    hard: "Your confidence runs ahead of you. You can take a partner’s goodwill for granted, be careless or a little superior, push your luck, and decide the grass is greener when ordinary life sets in. You need room to grow, and you bounce back fast.",
    flowing: "You are confident and generous, and you expect things to work out. That optimism is easy to be around and tends to lift a partner.",
    conjYou: "You are confident and generous and you think big. It can tip into taking a partner’s goodwill for granted or into restlessness, and which way it goes depends on the rest of your chart. You need room to grow.",
    conjThem: "They are confident, generous and think big, and need room to grow.",
  },
  "sun-saturn": {
    name: "Never quite enough",
    them: "They doubt their own worth and work to prove it, which can come out as control or as holding back.",
    easyName: "The dependable one",
    themEasy: "They are responsible and realistic, and a partner can depend on them.",
    conj: "hard",
    hard: "You doubt whether you are good enough, and you work hard to prove it. Your defences can keep people from getting close enough to value you, and you can become controlling without noticing. You find it hard to let yourself be seen. Confidence, and love, get easier for you with age.",
    flowing: "You are responsible and realistic, and you finish what you start. A partner can depend on you.",
  },
  "sun-uranus": {
    name: "Not like the others",
    them: "They cannot bear being told what to do, and fear a partner will try to change them.",
    easyName: "Their own person",
    themEasy: "They are independent and original, and give a partner freedom too.",
    conj: "hard",
    hard: "You need to be free to be different, and you cannot bear being handled or told what to do. Cooperation is hard for you, and you fear a partner will try to change you. You need honesty and space.",
    flowing: "You are independent and original without having to fight for it, and you give a partner the same freedom.",
  },
  "sun-neptune": {
    name: "The shape-shifter",
    them: "Their sense of self is fluid: they merge with a partner and idealise them, and find it hard to commit.",
    easyName: "The gentle one",
    themEasy: "They are imaginative, compassionate and gentle.",
    conj: "hard",
    hard: "Your sense of who you are is fluid. You merge with a partner, idealise them, or borrow your identity from them, and are disillusioned when they turn out ordinary. You may play rescuer or rescued, and find it hard to commit for fear of closing off something ideal.",
    flowing: "You are imaginative and compassionate, and you sense what other people need. You bring gentleness to a relationship.",
  },
  "sun-pluto": {
    name: "The hidden self",
    them: "They keep themselves hidden, even from the people closest to them, and trust slowly.",
    easyName: "Staying power",
    themEasy: "They have depth and stamina, and are not afraid of what is difficult.",
    conj: "hard",
    hard: "You keep yourself hidden, even from the people closest to you. You are intensely self-aware, a perfectionist, and afraid of being invaded, so you may corner or test a partner, or hand your power to a dominant one. Trust, once given, is total.",
    flowing: "You have depth and stamina, and you can remake yourself when you need to. You are not afraid of what is difficult in a relationship.",
  },
  "moon-jupiter": {
    name: "Big feelings",
    them: "Their feelings run large: generous and protective, and prone to over-reacting.",
    easyName: "Big-hearted",
    themEasy: "They are warm and emotionally generous, and people feel looked after around them.",
    conj: "flowing",
    hard: "Your feelings run large. You over-react, promise more than you can keep, and can be sure you are in the right. You have a horror of being tied down at home, and you look after people well when you feel looked after yourself.",
    flowing: "You are warm and emotionally generous, and you trust that things will be all right. People feel looked after around you.",
  },
  "mars-jupiter": {
    name: "Too much, too fast",
    them: "They throw themselves in, overdo it and take risks.",
    easyName: "Wholehearted",
    themEasy: "They act with enthusiasm and bring energy and fun.",
    conj: "hard",
    hard: "You get carried away. Your appetite for life and for people is large, you are impatient, and you need a lot of room, so settling with one person does not come easily.",
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
  "sun-venus": {
    name: "Loves to be loved",
    them: "They need to be liked, see the best in a partner and avoid confrontation.",
    easyName: "Loves to be loved",
    themEasy: "They need to be liked, see the best in a partner and avoid confrontation.",
    conj: "flowing",
    hard: "Being loved is central to who you are. You see the best in a partner and gloss over problems, compromise readily, and will keep the peace at almost any price. Learning to value yourself without someone’s approval is your task.",
    flowing: "Being loved is central to who you are. You see the best in a partner and gloss over problems, compromise readily, and will keep the peace at almost any price. Learning to value yourself without someone’s approval is your task.",
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
  "c-asc": "the relationship’s Ascendant–Descendant axis, an angle of its chart",
  "c-mc": "the relationship’s Midheaven axis, an angle of its chart",
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

/**
 * What the kind of aspect adds to a difficult natal pair (Tompkins, ch. 3). {S} is the slower
 * planet, the one usually met in other people. Said to the member, and about someone else.
 */
export const KIND_NOTE: Record<string, { you: string; them: string }> = {
  conjunction: { you: "As a conjunction this is so much a part of you that it is hard to see from the inside, though other people see it.", them: "As a conjunction it is a blind spot: others see it more clearly than they do." },
  opposition: { you: "As an opposition, one side of this tends to be handed to a partner: you are likely to meet your {S} in the people you are with before you own it yourself.", them: "As an opposition, they tend to meet their {S} in a partner before they own it themselves." },
  square: { you: "As a square it comes with self-doubt and a push to prove yourself, and it gets easier with age.", them: "As a square it comes with self-doubt and a push to prove themselves." },
  trine: { you: "As a trine it comes so easily that you may never question it.", them: "As a trine it comes so easily that they may never question it." },
  sextile: { you: "As a sextile it is there when you make use of it.", them: "As a sextile it is there when they make use of it." },
};
