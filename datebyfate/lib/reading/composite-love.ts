/**
 * Composite chart readings for a couple: Sun, Moon, Ascendant, Venus, Mars, Saturn,
 * the other planets by house, and the lunar nodes.
 *
 * Every entry in every table is a `Reading` (declared in ./context):
 * - `core` says what the placement is and what the two people need because of
 *   it, at the full strength of the source. It holds whatever aspects the
 *   planet makes.
 * - `expressions` lists three or four distinct forms the same placement takes
 *   in real couples, most constructive first, hardest last. They are forms the
 *   placement takes, not predictions. Which end a given couple lives at is
 *   weighed from the aspects in their composite chart (see `weigh` in ./context).
 *
 * No softening. The owner's rule is "don't soften interpretations. Provide
 * several expressions of them." So the stakes are stated as the source states
 * them (a wound and its healing for Pluto, the old story and the direction of
 * growth for the nodes, "grow spiritually or lose everything", "likely fatal"),
 * and the hard form is written plainly, without "can / may / might / tends to".
 * Strength comes from saying what happens, never from labels about people.
 *
 * Themes follow the Forrests' "Skymates, Volume Two", chs. 5 to 16; the wording is our own.
 *
 * Arrays by sign are in zodiac order, Aries first. Arrays by house are house 1 first.
 * The node tables are indexed by the sign and house of the SOUTH Node.
 */

import type { Reading } from "./context";

export type { Reading };

/** Composite Sun by sign: what keeps this couple alive, and the forms it takes. */
export const C_SUN_SIGN: Reading[] = [
  // Aries
  {
    core: "What keeps the two of you alive is adventure, intensity and risks taken together. The real task is emotional courage: one of you saying that there is something you need to talk about, and the other staying to hear it.",
    expressions: [
      "You take on something that frightens you both, a move, a venture, a hard journey, and come out of it more in love.",
      "One of you says the uncomfortable thing within the day, there is a short hot row, and the air is clear by evening.",
      "You get your adrenaline from the outside world and keep the peace at home, and the relationship goes flat without either of you knowing why.",
      "Neither of you says what needs saying, and the cowardice comes out as bickering, pettiness and a constant stress with no name.",
    ],
  },
  // Taurus
  {
    core: "You thrive on stability, peace and physical comfort: touch, long meals, music, animals, time outdoors. Most of what passes between you needs no words, and small dramas are to be dropped quickly.",
    expressions: [
      "You spend an unhurried evening cooking, eating and lying close, and say almost nothing because nothing needs saying.",
      "A quarrel starts, one of you laughs or reaches out a hand, and you let it go because it was never worth the peace.",
      "You keep the calm at any price, and the struggles you need to have go under the carpet, where they stay.",
    ],
  },
  // Gemini
  {
    core: "You need a fast, varied supply of new experiences, ideas and conversation. You keep each other curious, and the relationship lives on questions left open.",
    expressions: [
      "You are still up talking at one in the morning about something neither of you knew a thing about last week.",
      "You fill the diary with new places and people, and the best part is comparing notes on the way home.",
      "You become sure you know everything about each other, stop asking, and the relationship withers from certainty and boredom.",
    ],
  },
  // Cancer
  {
    core: "Your vitality depends on loving without defences and keeping your promises, until the two of you are home to each other. Looking after other people together feeds you as well.",
    expressions: [
      "You make a promise and keep it, and each kept promise lets the other lower one more guard.",
      "Your kitchen becomes the place where friends and family come to be fed and looked after, and it warms you both.",
      "One of you keeps a way out open, the other feels it, and the fire and the desire leach away.",
    ],
  },
  // Leo
  {
    core: "You come alive when you are seen. Celebration, play, dressing up, making things together and generous applause for each other are what feed this relationship.",
    expressions: [
      "You make an occasion of things, dress for each other, and say out loud in company how proud you are of the other.",
      "You make something together, a performance, a party, a piece of work, and enjoy being watched while you do it.",
      "You live on practicality and thrift month after month, nobody applauds anybody, and the feeling between you goes dead.",
    ],
  },
  // Virgo
  {
    core: "You need to feel that you are growing together and being of use; you are the ones your circle turns to for help. You also need to simply enjoy what already is.",
    expressions: [
      "You get better at something together each year and are quietly pleased to see the difference.",
      "You are the couple friends ring when something needs fixing or someone needs help, and being useful binds you.",
      "You examine yourselves and each other without rest, every remark is a helpful correction, and you are both exhausted.",
    ],
  },
  // Libra
  {
    core: "You are fed by calm, grace, beauty, courtesy and fairness, and by the way your differences balance each other. Your vow is to love, honour and negotiate.",
    expressions: [
      "You sit down with a real difference, each of you says plainly what you want, and you reach terms you both believe in.",
      "You keep your manners with each other in private, and the courtesy itself keeps the peace beautiful.",
      "One of you is coarse or careless with the other, and it breaks faith between you out of all proportion to the act.",
      "You agree to compromises neither of you believes in to avoid a scene, and the storm that finally comes is far worse for the wait.",
    ],
  },
  // Scorpio
  {
    core: "You stay alive by digging deep into each other’s inner lives, as searching as any therapy. That takes willingness, humour and absolute trust, and the relationship needs all three.",
    expressions: [
      "You tell each other what you have never told anyone, and are met with steadiness and, soon after, a joke.",
      "You go through a hard season of telling the truth, and come out knowing each other to the bone.",
      "The digging turns into psychological warfare: moods, sniping, boundaries overrun and a heaviness that drains you both.",
    ],
  },
  // Sagittarius
  {
    core: "You are on a shared quest for meaning. You need change, travel, learning and room to stretch, and the relationship is alive only while it is going somewhere new.",
    expressions: [
      "You pack up and go somewhere that changes how you both think, and come back with a new plan for your life.",
      "You study, argue about what it all means, and keep stretching each other’s view of the world.",
      "You choose a settled life over your own nature, and it comes back as nagging chaos, fixed opinions and tiredness.",
    ],
  },
  // Capricorn
  {
    core: "Your great work is long-term commitment and conduct you are proud of, however things turn out. In time you become elders, the couple others take as an example.",
    expressions: [
      "You make the vow without reservation and keep it through a hard stretch, and younger couples start asking how you do it.",
      "You handle a serious difficulty honourably, so that whatever comes of it, neither of you has anything to be ashamed of.",
      "You keep going back and forth about the promise itself, and the wavering drains the life out of you as a couple.",
    ],
  },
  // Aquarius
  {
    core: "You have to invent your own form of relationship, outside convention. The things that look odd about you are right for you, and trusting them is what keeps the two of you vital.",
    expressions: [
      "You arrange your life in a way your families do not understand, and you are visibly happier for it.",
      "You question a rule everyone takes for granted, decide it is not yours, and drop it without apology.",
      "You follow the standard script step by step, and live with a haunting sense that something is wrong.",
    ],
  },
  // Pisces
  {
    core: "You need quiet time together that feeds the soul: music, stillness, a sense of magic. You need just as much to be able to laugh at yourselves.",
    expressions: [
      "You sit together in low light with music on and no agenda, and get up feeling restored.",
      "Something goes absurdly wrong and you both end up helpless with laughter at yourselves.",
      "You drift into listlessness and resignation, and escape replaces the life you meant to have together.",
    ],
  },
];

/** Composite Sun by house. */
export const C_SUN_HOUSE: Reading[] = [
  // 1st
  {
    core: "You are a couple with visible impact, and other people follow your lead. Inwardly you are not sure you are meant to be together, so being together has to be a conscious, adult choice.",
    expressions: [
      "You decide deliberately that you are together because you choose to be, and the question stops troubling you.",
      "Friends copy how you live, where you go and how you treat each other, and you take that seriously.",
      "You go on wondering in private whether you are supposed to be together, while in public you lead.",
      "You model a catastrophe in full view, and the people who follow you copy that too.",
    ],
  },
  // 2nd
  {
    core: "You are building confidence in yourselves as a couple. You need to give yourselves concrete signs of a future: shared plans, shared purchases, things bought and booked in both names.",
    expressions: [
      "You book next year’s trip and buy the thing you will both own, and each act makes the future more believable.",
      "You notice you have been waiting for proof, and decide to act as a couple with a future before the proof arrives.",
      "You hedge, hold back and go on making sure, year after year, and nothing is ever staked.",
    ],
  },
  // 3rd
  {
    core: "You run on curiosity, conversation, travel and learning, in a fast, unpredictable life where you improvise. How you speak to each other is pivotal.",
    expressions: [
      "Plans change twice in a week and you improvise together, talking the whole way and enjoying it.",
      "You take a class, read the same book, drive somewhere new, and always have something to tell each other.",
      "You settle into predictability and silence, boredom takes hold, and life keeps overturning expectations you never talked through.",
    ],
  },
  // 4th
  {
    core: "Your energy comes from home, roots, family, land and quiet time in a burrow that is entirely yours, with a sense that it will last. Home comes first.",
    expressions: [
      "You shut the door on the world for a weekend and come out with your strength back.",
      "You put down roots, a garden, a kitchen table, a family of your choosing, and feel permanent.",
      "Work and outside demands take the hours home needs, the base is neglected, and you both run down while family troubles fill the space.",
    ],
  },
  // 5th
  {
    core: "You have to keep the in-love feeling alive: compliments, flowers, anniversaries, play, things you create together. Friends come and go through your life in a steady stream.",
    expressions: [
      "You still court each other after years, with notes, small gifts and anniversaries properly kept.",
      "You make things together and keep an open house, and new friends pass through and brighten you.",
      "Pleasure hardens into habit, and addictions and compulsions around enjoyment take hold of you both.",
    ],
  },
  // 6th
  {
    core: "You are fed by working side by side and being of real use. You need older couples as mentors and, later, to mentor others in turn.",
    expressions: [
      "You take on real work together, for a cause or for people who need it, and it bonds you more than leisure does.",
      "You seek out a couple who have done this longer and learn from them, and years later a younger couple learns from you.",
      "You dodge meaningful service, and it returns as plain, dispiriting drudgery that fills your days.",
    ],
  },
  // 7th
  {
    core: "The attraction between you is strong and immediate, and your work is advanced skill in partnership: equal weight for each person’s needs, compromise, and learning to handle conflict. You also need friends to let off steam with.",
    expressions: [
      "You disagree, each of you is heard, and you settle it in a way that costs you both about the same.",
      "Each of you goes off to a friend, complains freely, and comes home lighter.",
      "You identify with each other so completely that the first real disagreement feels like betrayal.",
      "Small annoyances are never mentioned and pile up until they stand between you.",
    ],
  },
  // 8th
  {
    core: "You evolve together or you tear each other apart. Everything comes to the surface with you, and what sustains the passion is being naked to each other in soul as well as body.",
    expressions: [
      "You show each other the worst of what you carry, are still wanted, and desire deepens.",
      "A buried hurt surfaces in one of you, you work through it together, and both of you are changed.",
      "Unhealed wounds run the relationship, and you tear at each other until you are both emotionally exhausted.",
    ],
  },
  // 9th
  {
    core: "You stay alive by stretching your horizons: travel, foreign cultures, study, a philosophy of life worked out together. The relationship needs to keep widening.",
    expressions: [
      "You live for a while in a culture not your own, and it rearranges what you both believe.",
      "You study and argue your way towards a view of life that is yours and keeps changing.",
      "You shut yourselves inside one system of belief, and certainty goes stale around you.",
    ],
  },
  // 10th
  {
    core: "You have a public role as a couple and something to give your community, perhaps through shared work. You set the style, and others copy your relationship.",
    expressions: [
      "You work together on something that serves the place you live, and are known for it.",
      "People model their own relationships on yours, and you choose with care what they see.",
      "You pay no attention to the mark you leave, and others follow your example without your knowing what example it is.",
    ],
  },
  // 11th
  {
    core: "Your energy comes from shared goals and a clear picture of the future, planned deliberately. Belonging to a group of like-minded people feeds you too.",
    expressions: [
      "You sit down each year, set out where you want to be in five, and work back from there.",
      "You join people who want what you want, and the shared aim carries you both.",
      "With no direction you settle into a rudderless comfort, a kind of permanent dating that goes nowhere.",
    ],
  },
  // 12th
  {
    core: "Spirituality and conscious lovemaking are your monastery: quiet, candle-lit time and a practice you share. With this placement you grow spiritually or you lose everything.",
    expressions: [
      "You keep a practice together, prayer, meditation or silence, and treat lovemaking as sacred.",
      "You guard quiet evenings alone together against every invitation, and the bond deepens in them.",
      "Busyness takes over and you forget what the relationship is for, and loss arrives to remind you.",
      "You refuse the inner life altogether, and the relationship and what you built around it are lost.",
    ],
  },
];

/** Composite Moon by sign: what the couple's heart needs, the home that suits it. */
export const C_MOON_SIGN: Reading[] = [
  // Aries
  {
    core: "Your shared heart is a warrior’s. You need challenges, and an adversary chosen together outside the relationship to push against.",
    expressions: [
      "You pick a hard goal or a cause to fight for and go at it shoulder to shoulder, and feel closest in the thick of it.",
      "After a row you make up fastest by doing something strenuous together.",
      "With nothing to push against you push against each other, and pick fights for the sake of the heat.",
      "You let yourselves go lazy, and the heart goes out of the relationship.",
    ],
  },
  // Taurus
  {
    core: "Your heart needs earthly pleasures and attention to the animal in you both: nature, quiet, good food, bodily comfort. The private creature-play between you is what restores you.",
    expressions: [
      "You have a private language of pet names and animal noises that no one else ever hears, and it mends most things.",
      "A walk in the woods and a good meal put you right after any upset.",
      "You think and schedule your way past hunger, tiredness and the need to be held, and both go without.",
    ],
  },
  // Gemini
  {
    core: "The relationship is one long conversation, fed by novelty, and your shared mood is light, curious and a little mischievous. When the talk stops, something is wrong.",
    expressions: [
      "You text each other things you noticed all day and pick up the thread at dinner.",
      "You make up after a quarrel by getting interested in something new together.",
      "Boredom arrives dressed as responsibility, you are too busy being sensible to talk, and the conversation stops.",
    ],
  },
  // Cancer
  {
    core: "There is an instant familiarity between you. Your heart needs nesting, tenderness and a safe base, and it gives a solid footing for commitment.",
    expressions: [
      "You say plainly that you need to be held tonight, and you are.",
      "You build a nest, cook for each other, and feel from early on that you have known each other for years.",
      "You clam up when you need touch, attention or safety, and each waits in silence for the other to guess.",
    ],
  },
  // Leo
  {
    core: "Your shared mood is regal and generous. You need to spoil each other, applaud each other, celebrate and be seen.",
    expressions: [
      "You praise each other lavishly and often, and both of you stand taller for it.",
      "You mark every success with a proper celebration and like being seen out together.",
      "Appreciation is withheld, each waits for the other to offer it first, and spontaneity dies.",
    ],
  },
  // Virgo
  {
    core: "Your heart thrives on improvement; for you, what is not growing is broken. You welcome honest criticism from each other and good counsel from outside.",
    expressions: [
      "You tell each other what is not working, take it well, and fix it within the week.",
      "You go to someone wiser for advice when you are stuck, and use it.",
      "Discontent turns into nit-picking over chores and money, with a harried sense that catastrophe is close.",
    ],
  },
  // Libra
  {
    core: "There is an air of rightness about you, two different people who complete each other. Art, music, dance and at least one beautiful room soothe you.",
    expressions: [
      "You let your opposite temperaments do different jobs, and admire in each other what you lack.",
      "You restore yourselves with music, a gallery, an evening of dancing, or an hour in the one lovely room.",
      "You prize agreement over knowing each other, blur into one person, and neither of you is really met.",
    ],
  },
  // Scorpio
  {
    core: "Intensity and honesty come naturally to you. You need humour, outside distractions and friends who give you perspective, because you go deep fast.",
    expressions: [
      "You say the true thing to each other every time, and then go out and laugh with friends.",
      "You feel a mood closing in and deliberately go and do something light until it lifts.",
      "You go deeper, faster than you are able to handle, and spiral into brooding heaviness.",
    ],
  },
  // Sagittarius
  {
    core: "Your heart is a wanderer’s. You need the open road, travel, learning and one long conversation about what life means.",
    expressions: [
      "You are happiest in a car or a train with a destination you have never seen.",
      "You keep up a running argument about philosophy that has lasted years and bores neither of you.",
      "Life becomes the same week repeated, and the feeling between you goes numb with boredom.",
    ],
  },
  // Capricorn
  {
    core: "Your shared heart is sober and realistic. It builds stone by stone, keeps its vows, and moves steadily towards commitment or a clean ending. It has to learn to relax, to ask for reassurance and to refuse extra duties.",
    expressions: [
      "You build your life a piece at a time and trust it because you watched every piece go in.",
      "One of you admits to needing reassurance, asks for it, and gets it without fuss.",
      "You are too grown-up for your own good: you take on every duty offered, never ask each other for comfort, and forget how to rest.",
    ],
  },
  // Aquarius
  {
    core: "Your heart is a rebel’s. You need more time apart, separate friends or separate holidays than most couples, and a home that looks like nobody else’s.",
    expressions: [
      "You take separate trips and come back with more to give each other.",
      "Your home follows no one’s rules but yours, and you feel free in it.",
      "You live by conventional assumptions, and grow cold, sardonic and aloof, each shut up in your own head.",
    ],
  },
  // Pisces
  {
    core: "Your heart is a mystic’s. You need quiet solitude together, music, dim light, and privacy defended firmly.",
    expressions: [
      "You turn the phones off, light a candle, and let an evening pass in near silence.",
      "You say no to invitations without guilt because your quiet time comes first.",
      "Nobody tends the relationship, and it drifts until you are living side by side without direction.",
    ],
  },
];

/** Composite Moon by house. */
export const C_MOON_HOUSE: Reading[] = [
  // 1st
  {
    core: "Your emotional life as a couple sits on the surface where everyone sees it, soulful and changeable, and you draw out other people’s needs. Your own needs have to keep their place.",
    expressions: [
      "People feel at ease with you and open up, and you welcome it while keeping evenings for yourselves.",
      "Your moods as a couple are read by everyone in the room, and you learn to say what is going on instead of hiding it.",
      "Other people’s needs intrude until yours are crowded out, and you are looking after everyone but each other.",
    ],
  },
  // 2nd
  {
    core: "Your faith in the relationship fluctuates from week to week. You prove yourselves to yourselves through a series of emotional risks: showing feeling, risking embarrassment, showing imagination, making a nest, and for some a total commitment such as children.",
    expressions: [
      "One of you says something tender and exposed, the other answers in kind, and the ground is firmer afterwards.",
      "You make a nest together, and each thing you add is a small vote of confidence.",
      "Doubt about the very basics returns again and again, and you take no risk that would settle it.",
    ],
  },
  // 3rd
  {
    core: "You are magnets for busy chaos, and you live on the move. Its purpose is to give you plenty to talk about and to teach you to speak from the heart.",
    expressions: [
      "A week of mishaps and errands becomes a story you tell each other, and in the telling you say what you felt.",
      "You talk best on the move, in the car or on a walk, and that is where the real things come out.",
      "Life goes dull, you have nothing to say to each other, and the warmth goes with the words.",
    ],
  },
  // 4th
  {
    core: "Your happiness depends on a great deal of time simply at home, in a cocoon with shared roots and the people you choose as family. You have to understand the family each of you came from.",
    expressions: [
      "You stay in, potter, cook, and count it the best kind of day.",
      "You learn how each other’s family worked, and stop being surprised by what the other does under stress.",
      "Family matters loom over everything, and arrive as burden far more than joy.",
    ],
  },
  // 5th
  {
    core: "The aim is to keep falling in love: a playful creative outlet you share, new friends, and for some, children who teach you play.",
    expressions: [
      "You have a shared game, a band, a garden, a dance class, and it keeps you flirting.",
      "You let children, your own or other people’s, pull you down onto the floor to play.",
      "You settle into sensible, grown-up routine, and it kills the feeling of being in love.",
    ],
  },
  // 6th
  {
    core: "Work and responsibilities multiply around you, and working together draws you closer. You are called to serve, often in the care of someone who needs it, and later to mentor younger couples.",
    expressions: [
      "You nurse a relative or run a household through a hard time as a team, and feel closer for it.",
      "A younger couple comes to you for advice, and you find you have some to give.",
      "Neither of you says no to anything asked of you, and routine swallows you whole.",
    ],
  },
  // 7th
  {
    core: "Your closeness is warm and unguarded and runs on touch and on literally sleeping side by side. As a couple you need kind, nurturing friends who reflect you back to yourselves.",
    expressions: [
      "You fall asleep wrapped around each other, and it settles what words did not.",
      "You have friends who are fond of the two of you as a pair and tell you what they see.",
      "You close the door on everyone else, and with no one to mirror you the relationship turns in on itself.",
    ],
  },
  // 8th
  {
    core: "The weather between you is stormy. Jealousy, anger and possessiveness surface fast, and things are resolved quickly: you go deeper, or it is over. Forgiveness, patience and humour are the remedy.",
    expressions: [
      "A storm blows up, everything is said, you forgive each other by nightfall and are closer than before.",
      "You learn to laugh in the middle of a jealous scene, and it loses its grip.",
      "One crisis follows another with no time to recover, and you are worn out.",
    ],
  },
  // 9th
  {
    core: "You are pilgrims together. You need far more change, travel and big ideas than most couples, and for some that means a life abroad.",
    expressions: [
      "You move country, or keep moving, and feel most yourselves as strangers somewhere new.",
      "You plan the next journey before the last one is over, and the planning itself lifts your mood.",
      "You live a repetitive life in one place, and the soul drains out of the bond.",
    ],
  },
  // 10th
  {
    core: "The mood at work comes home with you, so the right work, and backing each other towards it even at a cut in pay, is crucial. You share a nurturing mission in your community.",
    expressions: [
      "One of you leaves a job that was making you both miserable, the other backs it, and home is happier on less money.",
      "You are known locally as the couple who look after people, and it suits you.",
      "Bad days at the wrong job come through the door every evening and poison home life.",
    ],
  },
  // 11th
  {
    core: "You feel best building something big together, often a home or a family, with allies who serve the same long-term aim.",
    expressions: [
      "You have a ten-year project, and the people around you are helping build it.",
      "You measure a good year by how far the thing you are building has come.",
      "With no goals you are overextended in shallow socialising that drains you and gives nothing back.",
    ],
  },
  // 12th
  {
    core: "Your happiness depends on a great deal of time alone together: in quiet, in meditation, or absorbed in something beautiful. The troubles traditionally tied to this house are optional if you grow spiritually together.",
    expressions: [
      "You sit in silence together most days and count it the centre of your life.",
      "You lose an afternoon to music or a landscape and come back to each other renewed.",
      "You say yes to everyone, and the constant company drains you both until there is nothing left for each other.",
      "You neglect the inner life entirely, and troubles gather that a shared practice would have spared you.",
    ],
  },
];

/** Composite Ascendant by sign: how the couple comes across and approaches the world. */
export const C_RISING_SIGN: Reading[] = [
  // Aries
  {
    core: "You come across as confident and plucky. You earn that ease only by being blooded: facing challenges and fighting battles side by side as comrades. Your road to ease in public is harder than most.",
    expressions: [
      "You have come through something hard together, and it shows in the way you walk into a room.",
      "You take on a contest or a cause as a team, and strangers read you as a unit.",
      "You have never faced anything together, and in company you look awkward and mismatched, unsure where to stand.",
    ],
  },
  // Taurus
  {
    core: "You give off a soothing naturalness. You need silence, nature, shared food, familiar people and places, and some financial security.",
    expressions: [
      "People relax around you, and you spend your free time with a few old friends and a good table.",
      "You keep enough money put by that neither of you lies awake, and it shows as calm.",
      "Status games pull you out of your haven, and you spend your evenings impressing people you do not like.",
    ],
  },
  // Gemini
  {
    core: "You come across as animated and witty. You have to keep life interesting, which is different from fast: classes, new ways of seeing, conversation treated as an art.",
    expressions: [
      "You are the couple who have always just read, seen or learned something and want to tell everyone about it.",
      "You sign up for things together and come home arguing happily about them.",
      "You are busy every hour and learning nothing, filling the gaps with empty entertainment, and boredom sits under it all.",
    ],
  },
  // Cancer
  {
    core: "You radiate a mothering warmth, and your home soothes people. You have to set limits and protect the nest.",
    expressions: [
      "People come to your house tired and leave rested, and you decide who comes and when.",
      "You tell a relative kindly that this week is not possible, and keep the house to yourselves.",
      "Friends, family and children in need take everything you have, and the nest is drained.",
    ],
  },
  // Leo
  {
    core: "You have flair and a royal dignity as a couple. You need to look and feel impressive so that you dare creative risks and leadership, even literally going on stage.",
    expressions: [
      "You dress up, walk in together, and the room turns; then you use the attention to launch something.",
      "You perform, host or lead side by side, and each is bolder because the other is there.",
      "You shrink from being looked at, the creative risks are never taken, and in public you seem smaller than you are.",
    ],
  },
  // Virgo
  {
    core: "You come across as competent, a team whose skills interlock. Your sense of purpose pivots on finding the right shared work or service.",
    expressions: [
      "You find the work that needs both of your skills, and people come to you as a team.",
      "One of you plans and the other carries it out, and between you things get done properly.",
      "You never find that work, and life fills with constant thankless duties.",
    ],
  },
  // Libra
  {
    core: "You are gracious bridge-builders. You learn about relating through other people and other couples, so you have to choose your allies with care.",
    expressions: [
      "You bring people together at your table, and learn from the couples you admire.",
      "You pick a few friends deliberately for what they show you about love.",
      "You socialise with anyone and everyone, and take your lessons about love from whoever happens to be in the room.",
    ],
  },
  // Scorpio
  {
    core: "There is a disarming intensity about you, and a dark humour, that makes people confess to you. You need honest, taboo-breaking outsiders to keep your own perspective.",
    expressions: [
      "Strangers tell you their secrets within the hour, and you hold them with a wry joke and no shock.",
      "You have one or two friends who say the unsayable to you about yourselves, and you listen.",
      "No outsider is let close enough to tell you the truth, and you lose all perspective on yourselves.",
    ],
  },
  // Sagittarius
  {
    core: "You wear the look of free spirits, with a pact between you to take chances and gather wide experience. The deep lesson is faith, and faith requires risk.",
    expressions: [
      "You jump at something uncertain together and land, and trust life more for it.",
      "You collect experience widely, places, people, ideas, and are known for saying yes.",
      "You play safe every time, and the faith you came together to learn is never put to any test.",
    ],
  },
  // Capricorn
  {
    core: "People see you as elders, a couple who intend to grow old together. You grow through great works and missions in your community.",
    expressions: [
      "You take on a large, long task for your community and are steadied and enlarged by it.",
      "You speak easily of what you will be doing together at eighty, and others believe you.",
      "You avoid the mountains that would have forged you, and stay smaller and less sure than you were built to be.",
    ],
  },
  // Aquarius
  {
    core: "You do not fit in. You have to grow a thick skin and structure the relationship your own way, even when that disappoints your families.",
    expressions: [
      "You arrange things your way, the family objects, and you carry on in good humour.",
      "You are the odd couple in every room and have stopped minding.",
      "You bend the relationship into the shape your families expect, and feel like impostors in your own life.",
    ],
  },
  // Pisces
  {
    core: "There is a mystical, intuitive chemistry about you. You have to live outwardly as seekers: prayer or meditation together, teachers, sacred places.",
    expressions: [
      "You go on retreat or pilgrimage together, and it is visible in you when you come back.",
      "You finish each other’s thoughts, and you seek out teachers who deepen that.",
      "You seek nothing, and sit passively watching life happen to you.",
    ],
  },
];

/** Composite Venus by sign: how affection is kept alive. */
export const C_VENUS_SIGN: Reading[] = [
  // Aries
  {
    core: "Affection between you runs on spark, sass and shared adventure, with each backing the other’s courage. Conflicts are to be settled fast and kept in proportion.",
    expressions: [
      "You dare each other into something bold and are fonder of each other afterwards.",
      "You have it out in ten minutes, in proportion to the offence, and are teasing each other again by lunch.",
      "You have no shared challenge to meet, so you make an opponent of each other and attack.",
    ],
  },
  // Taurus
  {
    core: "Your affection lives in simplicity, stability, touch and cosy ease, and it is a strong signature for a lasting bond. You let small things go.",
    expressions: [
      "You show love with a hand on the back, a cup of tea brought unasked, and the same walk every Sunday.",
      "You shrug off small irritations without resentment, and they stay small.",
      "You avoid even the conflicts you need, and smother in security and predictability.",
    ],
  },
  // Gemini
  {
    core: "You stay fond of each other through mental rapport, endless communication, a varied life and encouragement of each other’s interests.",
    expressions: [
      "You take a real interest in whatever the other is currently fascinated by, and ask good questions.",
      "You keep doing new things together so that there is always something fresh to talk over.",
      "You decide you already know what the other thinks, stop talking, and affection dies as fast as it would from boredom.",
    ],
  },
  // Cancer
  {
    core: "Your affection is profoundly tender and nurturing. It needs gentleness, slowness and a protective shell around you, inside which secrets stay. Your power to hurt each other is heightened.",
    expressions: [
      "You tell each other things in confidence and they never leave the room.",
      "You move slowly and gently with each other, and each of you feels safe enough to be soft.",
      "After a few blows you raise the drawbridge on each other, at the very moment it needed to come down.",
    ],
  },
  // Leo
  {
    core: "You have to believe extravagantly that the two of you are special, and show it: celebrate, dress up, compliment, court. Being seen as an enviable couple helps.",
    expressions: [
      "You go on courting each other with compliments and occasions long after you have won each other.",
      "You enjoy being the couple others envy, and it feeds your belief in yourselves.",
      "You lose faith that you are right together, and that ends it.",
    ],
  },
  // Virgo
  {
    core: "You show love through responsibility, clear agreements and constant improvement. Small grievances have to be handled as they come.",
    expressions: [
      "You do what you said you would do, and that reliability reads to each other as love.",
      "You raise a small grievance the same day, sort it, and it is finished.",
      "Criticism takes over, and each of you blames the other for an emptiness that is your own.",
    ],
  },
  // Libra
  {
    core: "Affection is kept alive by fair negotiation and by turning differences that will never be reconciled into a complement you value. Shared taste in art and beauty feeds it.",
    expressions: [
      "You stop trying to change the thing in each other that will not change, and start valuing it.",
      "You negotiate until it is fair to both, and enjoy concerts, galleries and a well-laid table together.",
      "You make nice, and the differences fester until you lose faith in each other.",
    ],
  },
  // Scorpio
  {
    core: "The magic between you depends on naked psychological honesty, a great deal of time alone together, strict confidentiality, and sex as the central ritual of your bond.",
    expressions: [
      "You keep whole days for each other alone, and nothing said in them is ever repeated.",
      "Lovemaking is where you renew the bond, and you give it time and seriousness.",
      "Jealousy and possessiveness take hold, and you react to each other in ways you would not recognise in yourselves elsewhere.",
    ],
  },
  // Sagittarius
  {
    core: "You need shared adventure and travel, and an early, explicit agreement on the rules: exclusivity, flirtation, close ties with other people.",
    expressions: [
      "You talk through exactly what is and is not allowed before it comes up, and both keep to it gladly.",
      "You plan journeys together and are at your fondest on the road.",
      "Each of you assumes the other shares your idea of freedom, nobody checks, and the discovery does damage.",
      "You live a stultifyingly ordinary life, and affection suffocates in it.",
    ],
  },
  // Capricorn
  {
    core: "For you romance rests on character: integrity, promises kept in large things and small, and an apology when you fall short. You have to loosen up and make time for play.",
    expressions: [
      "You do what you promised down to the smallest thing, and admire each other for it.",
      "One of you fails, says sorry without excuses, and respect is restored.",
      "Gravity takes over, there is no play at all, and affection is buried under seriousness.",
    ],
  },
  // Aquarius
  {
    core: "You have to question the assumptions about love you inherited, on living together, age, children, distance, and reinvent intimacy for yourselves.",
    expressions: [
      "You live apart, or together in a way no one you know does, because it is what works for you.",
      "You examine each expectation as it arises and keep only the ones you both choose.",
      "You obey rules you have never examined, and the erotic joy drains out of being together.",
    ],
  },
  // Pisces
  {
    core: "Your affection needs a consciously spiritual dimension and private time that you protect.",
    expressions: [
      "You share a practice or a sense of the sacred, and fondness is renewed in it.",
      "You keep certain hours for the two of you and let the phone ring.",
      "You give your quiet time away to every outside demand, and there is nowhere left for fondness to be renewed.",
    ],
  },
];

/** Composite Venus by house. */
export const C_VENUS_HOUSE: Reading[] = [
  // 1st
  {
    core: "You look right together and people are drawn to you. The task is to choose to love and to go on behaving like lovers deliberately.",
    expressions: [
      "You keep doing the things lovers do, on purpose, long after it would be easy to stop.",
      "You are welcome everywhere, and you turn down half the invitations to keep time for each other.",
      "You overextend yourselves socially and identify so fully with the happy-couple image that the murkier matters creep up unseen.",
    ],
  },
  // 2nd
  {
    core: "Your doubts about what the relationship is worth are exaggerated. You need to acquire what lets you believe in it: good counsel, couples you admire, tokens such as rings. Your money quarrels are really about trust.",
    expressions: [
      "You exchange rings or sign for something together, and the doubt quietens.",
      "You recognise in the middle of an argument about money that it is about trust, and talk about that instead.",
      "You never invest, and are still only dating after ten years without having taken the next step.",
    ],
  },
  // 3rd
  {
    core: "You speak well together. Courtesy and careful language are your hedge against the erosion of intimacy.",
    expressions: [
      "You say please and thank you to each other after decades, and mean it.",
      "You choose your words with care when it matters, and are understood the first time.",
      "Diplomacy fails between you, and you fight private wars with words.",
    ],
  },
  // 4th
  {
    core: "There is a deep, lasting warmth beneath everything, and you are home-lovers from the start. A beautiful, peaceful home sets the tone of your romance.",
    expressions: [
      "You make the house lovely together, and coming home feels like being embraced.",
      "Under any quarrel you both feel the steady warmth that was there from the first.",
      "You live in ugliness or chaos, and it sours the feeling between you.",
    ],
  },
  // 5th
  {
    core: "You shine together, and you need to keep it feeling like a love affair. Shared creativity, pleasure and hospitality feed it; friends come and go, and children are welcome.",
    expressions: [
      "You still go out on dates with each other, and still dress for them.",
      "You keep an open, generous house, make things together, and are at your best when entertaining.",
      "Courtship and pleasure fall to the bottom of the list, and you become companions who once had a love affair.",
    ],
  },
  // 6th
  {
    core: "You belong to a lineage of lovers. You need to seek out couples further along than you and learn from them humbly, and later pass it on.",
    expressions: [
      "You ask an older couple how they did it, listen, and try what they tell you.",
      "In time younger couples come to you, and you pass on what you were given.",
      "Pride convinces you that you have nothing to learn about love, and you repeat every mistake unaided.",
    ],
  },
  // 7th
  {
    core: "You like each other, easily and naturally, which is a classic signature of a long marriage. You need warm, supportive friends and other couples, and honest dialogue from early on.",
    expressions: [
      "You are friends first and enjoy each other’s company for its own sake.",
      "You are surrounded by couples who wish you well, and that circle holds you.",
      "You keep everything pleasant, and when the darker side of one of you appears the other is disillusioned.",
    ],
  },
  // 8th
  {
    core: "For you romance is what sustains sexuality. You bond quickly and deeply, and you have to keep seducing each other.",
    expressions: [
      "You go on seducing each other with attention, care and anticipation, and desire stays alive.",
      "You bonded fast and completely, and you honour that by treating intimacy as an occasion.",
      "You grow crass and dismissive, take each other for granted, and desire goes cold.",
    ],
  },
  // 9th
  {
    core: "Your love is kept alive by newness: travel, courses, seeking together. You have to respect each other’s beliefs.",
    expressions: [
      "You fall for each other again every time you are somewhere neither of you has been.",
      "You hold different beliefs and find each other’s interesting.",
      "Sameness turns into boredom with each other, and you start trying to convert each other.",
    ],
  },
  // 10th
  {
    core: "You publicly embody your community’s ideal of love and restore other people’s faith in commitment. You also work well together in the arts, counselling or design.",
    expressions: [
      "People say that seeing the two of you makes them believe in love again, and it is true to how you live.",
      "You work together on something beautiful or healing, and your affection is part of the work.",
      "You tend the public picture and neglect the private affection, until the image is all that is left.",
    ],
  },
  // 11th
  {
    core: "You need to think strategically, far ahead, about what feeds your love, right down to a shared picture of old age.",
    expressions: [
      "You describe to each other the house you will be old in, and steer by it.",
      "You plan the year so that the things that keep you close are booked first.",
      "You let life just happen to you and spread yourselves thin socially, and love is left to chance.",
    ],
  },
  // 12th
  {
    core: "Your romantic and sexual feeling depends on renewing a shared spiritual life, with a great deal of private retreat.",
    expressions: [
      "You withdraw from the world together at regular intervals, and come back in love.",
      "You share a practice, and desire follows from the closeness it gives.",
      "You escape together into television, baby talk, drink or drugs, and are absent from each other while side by side.",
    ],
  },
];

/** Composite Mars by sign: desire, and how tension is handled. */
export const C_MARS_SIGN: Reading[] = [
  // Aries
  {
    core: "Your desire is forthright and ardent. What you are here to do is dare to claim each other and learn that anger is safe. Small annoyances are to be vented quickly.",
    expressions: [
      "You say you want each other in so many words, and act on it.",
      "You lose your tempers, nobody leaves, and you learn that anger does no lasting harm.",
      "Anger goes unprocessed and desire weakens, and any hint of disloyalty sets off an explosion.",
    ],
  },
  // Taurus
  {
    core: "Your desire is earthy, accepting and generous. Its purpose is a return to the simple wisdom of the body.",
    expressions: [
      "You enjoy each other’s bodies as they are, slowly and without commentary.",
      "You settle tension with touch before talk, and it works.",
      "You talk and think sex to death, carry shame about it, or chase images from the media, and real sensuality is lost.",
    ],
  },
  // Gemini
  {
    core: "For you the mind is the first erogenous zone: words, play, variety and no judgement.",
    expressions: [
      "You flirt with each other in words all day long, and that is half the pleasure.",
      "You try something new, laugh together when it fails, and pass no judgement on either of you.",
      "You fall into ruts, one lecturing while the other listens, and tension comes out as cutting debate, sniping or stony silence.",
    ],
  },
  // Cancer
  {
    core: "Your desire is tender and nurturing. Its purpose is kindness and safety, given equally in both directions.",
    expressions: [
      "You look after each other in turn, and desire grows out of feeling safe.",
      "One of you is hurt and says so directly, and is comforted.",
      "Anger comes out sideways as sulking, clinging and complaints about something else, and one of you ends up being babied by the other.",
    ],
  },
  // Leo
  {
    core: "Your desire is proud, uninhibited and full of compliments. Its purpose is to encourage each other’s erotic self-expression.",
    expressions: [
      "You tell each other exactly how desirable you find the other, often and aloud.",
      "You coax each other into being bolder, and applaud the result.",
      "One of you feels suppressed, and it brings outsized rage or hurt, followed by iciness and pettiness.",
    ],
  },
  // Virgo
  {
    core: "The aim in your physical life is to be whole, not perfect, free of shame and of pressure to perform. The remedy for tension is praise, no unasked advice, and speaking of the behaviour and never the person.",
    expressions: [
      "You are at ease in bed with imperfect bodies and imperfect nights, and say what you liked.",
      "When something bothers you, you name the act and leave each other’s character alone.",
      "Criticism spreads into everything, with small digs that tell each of you that you are never good enough.",
    ],
  },
  // Libra
  {
    core: "You bring grace and beauty to lovemaking. You have to negotiate your different styles with elegance.",
    expressions: [
      "You set the scene with care, and lovemaking has beauty in it.",
      "You talk through what each of you likes with tact, and both get it.",
      "Tension turns into icy formality and going through the motions, or one of you imposes your preferences on the other.",
    ],
  },
  // Scorpio
  {
    core: "Your desire is intense, revealing and cathartic, and its purpose is a searingly honest bond. A breather taken by one of you is not a betrayal.",
    expressions: [
      "Sex strips you both bare, and you come out of it closer and lighter.",
      "One of you needs a night of distance, says so, and the other lets it be.",
      "You fear being too exposed, each knows exactly where to twist the knife, and you fight obsessively over nothing.",
    ],
  },
  // Sagittarius
  {
    core: "Your desire is robust and exploratory. Its purpose is to act honourably inside limits you have both freely agreed.",
    expressions: [
      "You explore widely inside the limits you set together, and keep them as a matter of honour.",
      "You take your lovemaking outdoors, abroad, anywhere new, and it thrives on the change.",
      "Boredom leaks into bed, one of you censors the other prudishly, and rage breaks out in self-righteous, moralising fights.",
    ],
  },
  // Capricorn
  {
    core: "Sustaining desire is part of your great work: integrity, promises kept, shared projects, trust that is earned. It does best inside a firm commitment.",
    expressions: [
      "Desire grows with every promise kept, and is stronger in year ten than in year one.",
      "You build something together by day, and the partnership carries over into the night.",
      "You read each other’s minds instead of asking, and retreat behind correct behaviour that keeps the form and loses the spirit.",
    ],
  },
  // Aquarius
  {
    core: "Your physical life has to be entirely of your own design, without regard for what couples are supposed to do.",
    expressions: [
      "You work out what suits the two of you and no one else, and that is what you do.",
      "You drop a convention about sex that never fitted you, and feel relief.",
      "You imitate what is normal and feel you are going through the motions, or oppose each other out of pure reflex.",
    ],
  },
  // Pisces
  {
    core: "Your desire is sensitive and flowing, and it reaches for something beyond the two of you. Crudeness kills it.",
    expressions: [
      "You make love gently and without hurry, and at times it feels close to prayer.",
      "You pay attention to mood, tone and timing, because a coarse word ends the evening.",
      "You depend on alcohol to get close, or use sex to avoid a conflict or a fact you do not want to face.",
    ],
  },
];

/** Composite Mars by house. */
export const C_MARS_HOUSE: Reading[] = [
  // 1st
  {
    core: "War is part of how you love. Anger is not forbidden, but you have to agree rules of engagement, and you are at your best fighting side by side against challenges from outside.",
    expressions: [
      "You argue hard by rules you both respect, and neither of you is afraid of it.",
      "You face an outside threat shoulder to shoulder, and nothing gets between you.",
      "There are armed borders between you, each side watching the other for the next move.",
    ],
  },
  // 2nd
  {
    core: "Money is where you clash, and real financial knocks come. The issue underneath is a shared, fear-based view of survival. You have to go hunting together, with goals.",
    expressions: [
      "You set a target for what you will earn or build and go after it as a team.",
      "A financial blow lands and you meet it together, and are less afraid afterwards.",
      "You fight over fair shares and over there never being enough.",
    ],
  },
  // 3rd
  {
    core: "You have to learn to fight fair, in words, tone and gesture, to keep every channel open and to keep life interesting.",
    expressions: [
      "You argue in clean words and a level voice, and both of you are still listening at the end.",
      "You debate for the fun of it, and it sharpens you both.",
      "You are both too good at sarcasm and use it, and an overfull diary and plain boredom are mistaken for being tired of each other.",
    ],
  },
  // 4th
  {
    core: "Your heat runs deep and lasts a lifetime, and it needs a safe home. Trouble arrives at home, and the chief trigger is the family each of you came from: old anger at a parent, aimed at the partner.",
    expressions: [
      "You make home the one place where both of you are safe, and desire lasts for decades.",
      "One of you catches yourself shouting at the other what you never said to a parent, and says so.",
      "Anger at a parent is turned on each other unrecognised, sexual response shuts down, and rage follows.",
    ],
  },
  // 5th
  {
    core: "Your fire is released through spontaneity, sport, dancing and things you make together. You have to make peace with the noisy child in each of you.",
    expressions: [
      "You dance in the kitchen, race each other, wrestle, and end up in bed.",
      "You let each other be loud and silly without embarrassment.",
      "Playfulness is suppressed and turns into friction, and you fight about and around the children.",
    ],
  },
  // 6th
  {
    core: "Pressure of work bears on you, enough to harm your health and the bond. You have to say no, and to find older, blunt mentors who show you how conflict is handled.",
    expressions: [
      "You turn work down to protect your health and your evenings, and the relationship is better for it.",
      "An older, plain-spoken couple shows you how to have a row properly, and you copy them.",
      "Overwork devours the relationship, and your health goes with it.",
    ],
  },
  // 7th
  {
    core: "This describes how you stand with other people. Some people are provoked by the two of you as a couple, and you have to stand up to them together. You need frank, loyal friends, chosen slowly.",
    expressions: [
      "Someone takes against you as a couple, and you face them side by side without flinching.",
      "You make friends slowly and keep the ones who tell you the truth and stay.",
      "You meet hostility separately, each of you undefended, and conflict with other people takes over your life together.",
    ],
  },
  // 8th
  {
    core: "You have signed up to face your fears. Being lovers stirs the old wounds in each of you, and the bond needs an early commitment to honesty and loyalty.",
    expressions: [
      "You promise honesty and loyalty at the start, and it holds when the frightening material comes up.",
      "Desire brings an old fear to the surface in one of you, and the other stays.",
      "You blaze at the beginning and flame out fast, with the wounds it opened left untended.",
    ],
  },
  // 9th
  {
    core: "Your passion is fed by real adventure and tested courage. Yours is a warrior’s ethic of saying what you see.",
    expressions: [
      "You do something that tests your nerve together, and want each other more afterwards.",
      "You tell each other what you see, even when it is unwelcome, and respect each other for it.",
      "Fear of each other’s anger silences you, and the heat goes out with the truth.",
    ],
  },
  // 10th
  {
    core: "You fight a public battle to protect something that matters, and you are an effective team under pressure. You draw rivals and detractors you never sought.",
    expressions: [
      "You stand up in public for something you both believe in, and win ground.",
      "Under pressure you divide the work without a word and hold the line.",
      "You defend a position that was never truly yours, and the fight hardens into hatred.",
    ],
  },
  // 11th
  {
    core: "The Mars force between you grows with time, and it becomes either desire or rage. Handle anger as it arises and your chemistry improves with age.",
    expressions: [
      "You deal with each irritation as it comes, and you are more drawn to each other at fifty than at thirty.",
      "You put the growing energy into goals you share, and it drives them.",
      "Tension accumulates year on year, and the relationship blows up.",
    ],
  },
  // 12th
  {
    core: "You have to seek out edgy experiences voluntarily, and take the risk of being honest with each other.",
    expressions: [
      "You choose something that scares you a little, do it together, and come back clear-headed.",
      "You tell each other the thing you were hiding, and the hidden anger loses its force.",
      "You play safe in everything, and the extremes you avoided come and find you.",
    ],
  },
];

/** Composite Saturn by house: where the couple has to do the work. */
export const C_SATURN_HOUSE: Reading[] = [
  // 1st
  {
    core: "You carry the bearing of elders, and picturing yourselves old together centres you. Others quickly treat you as long established and come to you for advice.",
    expressions: [
      "You talk about being old together as a settled fact, and it steadies everything.",
      "Friends bring you their troubles within months of your meeting, and you give sound advice.",
      "You refuse the seriousness that belongs to you, play at being casual, and are left unsure of yourselves and unconvincing to others.",
    ],
  },
  // 2nd
  {
    core: "This is not poverty. Your work is to build solid security slowly while keeping money in its place. Deeper down you start with little confidence in yourselves as a couple, and this is a slow-cooking relationship that rewards persistence.",
    expressions: [
      "You save steadily, spend on what matters, and watch your confidence as a couple grow with the years.",
      "You stay through the stretch when it would be easy to walk away, and find the relationship worth far more than you thought.",
      "You pinch every penny of the present for an abstract future, and have no life now.",
      "You undervalue what you have between you, and squander the relationship.",
    ],
  },
  // 3rd
  {
    core: "Your success depends on deep, patient, detailed conversation, with time set aside for it.",
    expressions: [
      "You keep a fixed hour each week for talking things through properly, and nothing is left hanging.",
      "You write to each other when speech fails, and take the time to get it exact.",
      "Silence lets the unspoken pile up until you are sitting on a volcano, or you simply run out of fuel.",
    ],
  },
  // 4th
  {
    core: "Making a home together is your great work, and it demands sacrifice: saving, relocating, blending families, deciding whose life moves. The question is how badly you want this relationship.",
    expressions: [
      "One of you moves city, or both of you save for years, and the home you make is worth it.",
      "You blend two families patiently, giving up comforts on both sides.",
      "Neither of you will pay the price, and the home, and with it the relationship, is never built.",
    ],
  },
  // 5th
  {
    core: "You have to practise celebration as a discipline: put play, pleasure and sex in the diary, and take on long creative projects together.",
    expressions: [
      "You book the night out and the weekend away and keep them like any other appointment.",
      "You work for years on something creative together, and it gives you joy with roots.",
      "You become stiff, dutiful, exhausted and predictable, lovers lost in being parents.",
    ],
  },
  // 6th
  {
    core: "A consciously negotiated, fair division of labour and promises kept are critical for you, because a demanding situation, an ill relative or a lost income, will test you.",
    expressions: [
      "You agree who does what, write it down if need be, and both deliver.",
      "A hard year arrives, and the arrangements you made carry you through it.",
      "Each of you feels you do three quarters of the work, resentment sets in, and both start to shirk.",
    ],
  },
  // 7th
  {
    core: "This concerns chiefly the company you keep, and it is not the mark of a cold marriage. You need the guidance of a noticeably older, solidly committed couple, and you have to build in yourselves the qualities you see in them.",
    expressions: [
      "You know an older couple you admire, spend time with them, and grow more like them.",
      "You name what you respect in them, patience, loyalty, humour, and work at it deliberately.",
      "You have no such elders to look to, and work out commitment alone, by trial and error.",
    ],
  },
  // 8th
  {
    core: "Trust between you is forged slowly, through difficulties endured and promises kept. You are healing each other’s fear of commitment, and that needs a commitment made until death.",
    expressions: [
      "You commit for life in so many words, and each hard time you come through adds to the trust.",
      "Each of you keeps your word in small matters for years, and the other’s fear of commitment eases.",
      "One promise is broken, and it outweighs a hundred that were kept.",
    ],
  },
  // 9th
  {
    core: "You have to work out explicitly, starting early, why you are together, what your ethics are and what commitment means: the limits of forgiveness, secrets, honesty against kindness, your families. Failing to agree on the basics is likely fatal.",
    expressions: [
      "You sit down early and settle what you each mean by loyalty, honesty and forgiveness, and revisit it as you change.",
      "You arrive at beliefs you have tested yourselves, and they hold when you are tested.",
      "You repeat beliefs borrowed from others, never agree on the basics, and the relationship ends over it.",
    ],
  },
  // 10th
  {
    core: "This is not necessarily about career. Your job description is to show your community how committed love is done, and you become public symbols of its success or its failure. It is a burden, and you are free to decline it.",
    expressions: [
      "You accept that people are watching and live your commitment in a way worth copying.",
      "You decide together that you do not want the role, and say no to it cleanly.",
      "You carry the role resentfully and badly, and become the public example of how love fails.",
    ],
  },
  // 11th
  {
    core: "You need a community of long-haul lovers who are rooting for you.",
    expressions: [
      "Your closest friends are couples decades in, and they cheer you on.",
      "You go looking for such people deliberately and make room for them.",
      "You keep drab, humourless company, and the break-ups around you spread to you.",
    ],
  },
  // 12th
  {
    core: "You mature as a couple by defending radical privacy and shared solitude, in which a wordless understanding grows.",
    expressions: [
      "You go away alone together several times a year, and understand each other without speaking.",
      "You disappoint people to protect your time, and do not apologise.",
      "You yield to social pressure and never get away, and the understanding between you never forms.",
    ],
  },
];

/** Composite Mercury, Jupiter, Uranus, Neptune and Pluto by house. */
export const C_OTHER_HOUSE: Record<"mercury" | "jupiter" | "uranus" | "neptune" | "pluto", Reading[]> = {
  mercury: [
    // 1st
    {
      core: "You are a visibly talkative, curious couple, and you owe each other a promise that life will never be boring.",
      expressions: [
        "You talk your way through every outing, and people enjoy listening in.",
        "You make the promise aloud and keep it with new subjects, places and questions.",
        "You let life go dull, and with nothing fresh to say you grow restless and irritable with each other.",
      ],
    },
    // 2nd
    {
      core: "Your confidence as a couple rests on a shared mental life: when you stop talking, you start doubting. You have to stay informed about your finances.",
      expressions: [
        "You talk daily about what you are reading and thinking, and feel sure of each other.",
        "You go through the accounts together each month and both know where you stand.",
        "The talk stops, and doubt about the relationship moves into the silence.",
      ],
    },
    // 3rd
    {
      core: "Talk comes easily to you. The task is real conversation in place of chatter, and learning to switch off.",
      expressions: [
        "You turn off the screens and have one proper conversation a day.",
        "You chatter happily about everything and then stop and ask how the other really is.",
        "You fill every hour with noise and small talk, and never say anything that matters.",
      ],
    },
    // 4th
    {
      core: "Your home is built around shared interests, and the story of how you began is a meeting of minds.",
      expressions: [
        "Your house is full of books, instruments or projects that you both use.",
        "You retell how you first got talking and could not stop, and it still holds you.",
        "The shared interests lapse, the house goes quiet, and you live as two people with nothing to tell each other.",
      ],
    },
    // 5th
    {
      core: "Romance and fun are renewed for you through learning, games, reading and ideas enjoyed together.",
      expressions: [
        "You read aloud to each other, play games, do the crossword, and flirt while you do it.",
        "You learn something new together and it feels like a date.",
        "You stop learning and playing with ideas, and romance goes stale with your minds.",
      ],
    },
    // 6th
    {
      core: "You share practical and communication skills that you teach to others. Daily duties have to be discussed and never assumed.",
      expressions: [
        "You go through the week’s tasks aloud and nobody is left guessing.",
        "You teach other people a skill you have honed together.",
        "Each assumes the other is handling it, nothing is said, and daily life becomes a string of dropped tasks and blame.",
      ],
    },
    // 7th
    {
      core: "You need information about relating from outside yourselves, and it reaches you through youthful, open-minded friends who model a way of talking to each other.",
      expressions: [
        "You watch how a pair of friends talk through a problem, and borrow their method.",
        "You keep company with curious, open people of any age, and they keep your own conversation fresh.",
        "You take in no new ideas about relating, and go round the same exchange in the same words for years.",
      ],
    },
    // 8th
    {
      core: "The lines have to stay open on the subjects that are taboo, frightening and self-revealing.",
      expressions: [
        "You talk about sex, death, money and fear in plain words, and nothing is off the table.",
        "One of you raises the thing that is hardest to say, haltingly, and the other makes it easy.",
        "Certain subjects become unmentionable, and what you do not discuss governs you both.",
      ],
    },
    // 9th
    {
      core: "A shared life of the mind is close to a religion for you. You should enjoy debating how each of you sees the world, or you will wonder why you are together.",
      expressions: [
        "You argue about ideas over dinner with relish and no need to win.",
        "You travel and study together to feed the debate between you.",
        "The debate dies, and you look at each other and wonder what you are doing together.",
      ],
    },
    // 10th
    {
      core: "You are known publicly as talkers, teachers or carriers of news.",
      expressions: [
        "You teach, write or speak together, and people seek you out for what you know.",
        "You are the ones who know what is going on and pass it on accurately and kindly.",
        "You are known as the local gossips, and people watch what they say around you.",
      ],
    },
    // 11th
    {
      core: "Your long-range goals centre on learning and keeping life interesting. They need planning, and so does the upkeep of your health and finances.",
      expressions: [
        "You plan the courses, journeys and projects of the next ten years, and look after body and budget so you get to do them.",
        "You keep friends who teach you things and trade ideas with them.",
        "You plan nothing, let health and money slide, and reach later life with little left to be curious about or with.",
      ],
    },
    // 12th
    {
      core: "Your spiritual growth comes through study and discussion.",
      expressions: [
        "You read the same teachings and talk them through until they are your own.",
        "You use words to reach the edge of what words cover, and then sit quietly together.",
        "You explain each other’s feelings away and bludgeon each other with reason.",
      ],
    },
  ],
  jupiter: [
    // 1st
    {
      core: "You are a magnetic, generous couple, and others assume you are happy. The challenge is to live up to your own legend.",
      expressions: [
        "You are generous hosts and givers, and your private life matches the public warmth.",
        "You notice the gap between what people assume and what is true, and close it by acting.",
        "You coast on your reputation, and are a happy couple only in other people’s eyes.",
      ],
    },
    // 2nd
    {
      core: "You are an effective money-making team, provided you trust the relationship and invest in it. Self-doubt creates poverty of every kind.",
      expressions: [
        "You back yourselves, put money and effort into a joint venture, and it pays.",
        "You spend on the relationship itself, and count it your best investment.",
        "You doubt yourselves, hold back in the name of realism, and grow poorer in money, confidence and joy.",
      ],
    },
    // 3rd
    {
      core: "You are inspiring, entertaining talkers.",
      expressions: [
        "You hearten each other with words, and each leaves the conversation feeling larger.",
        "You hold a table together, trading stories, and people remember the evening.",
        "Clever words become a wall, and you perform at each other instead of speaking.",
      ],
    },
    // 4th
    {
      core: "You have good fortune with home and property, and your joy deepens when you nurture others and have them to stay.",
      expressions: [
        "You find a home that is bigger or better than you expected, and fill it with guests.",
        "You take people in and look after them, and are happier for it.",
        "You settle for a cramped, cautious home life in the name of being sensible, keep the door shut, and your faith in yourselves shrinks to fit.",
      ],
    },
    // 5th
    {
      core: "Fun is a serious need for you. You have to deliberately keep up the bond of pleasure you had in the early days.",
      expressions: [
        "You still do the things you did in your first year, and add new ones.",
        "You budget time and money for pleasure without guilt.",
        "Pleasure runs to excess, and you overspend and overindulge together without either calling a halt.",
        "You decide you are too busy and too sensible for fun, and the bond that pleasure made comes apart.",
      ],
    },
    // 6th
    {
      core: "Make your duties as enjoyable as you are able, dividing them by who likes what and not by strict fairness, or the bond feels like a labour camp.",
      expressions: [
        "Each of you takes the jobs you like, and you do the rest together with the music on.",
        "You turn a chore into an outing and enjoy it more than you expected.",
        "You divide everything by strict fairness and grim duty, and the relationship feels like a labour camp.",
      ],
    },
    // 7th
    {
      core: "You need warm, generous friends who say out loud that they believe in the two of you.",
      expressions: [
        "Your friends toast you, tell you that you are good together, and you take it in.",
        "You are generous to your friends in return, and the circle widens.",
        "You keep company with people who are cool or doubtful about you as a pair, and your own faith thins.",
      ],
    },
    // 8th
    {
      core: "You have a rich gift for sexual and emotional bonding, and it has to be given lavish time and a high priority.",
      expressions: [
        "You clear whole days for each other, and the bond grows deeper every year.",
        "You trust each other with everything, money, secrets, bodies, and are repaid.",
        "You fit intimacy into whatever time is left over, and the gift goes to waste.",
      ],
    },
    // 9th
    {
      core: "Travel, endless learning and for some a shared faith keep you confident that you are together for a purpose.",
      expressions: [
        "You travel far and often, and return each time surer of why you are together.",
        "You belong to a community of belief or study, and it gives your bond a larger meaning.",
        "You grow too comfortable to stir from home, and the sense that you are together for a reason fades.",
      ],
    },
    // 10th
    {
      core: "Together you rise in standing, and your mission is to lead and encourage others. Choose a mountain whose summit you admire.",
      expressions: [
        "You pick an aim you both respect, climb, and bring others up with you.",
        "People take heart from you, and you use your position to encourage them.",
        "You climb whatever is in front of you, arrive at a summit you do not admire, and success is hollow.",
      ],
    },
    // 11th
    {
      core: "You are good strategists with a bright long-term future, if you clarify your goals and keep company with people who share them.",
      expressions: [
        "You name what you want in twenty years and gather allies who want it too.",
        "Things get better for you with every decade, because you planned for it.",
        "You never say what you want, drift among people with other aims, and the future you were offered does not arrive.",
      ],
    },
    // 12th
    {
      core: "You are closer to the divine together than apart. Gifts come to you, and wake-up calls, some of them looking like misfortune.",
      expressions: [
        "You pray or sit together, and feel accompanied by something larger than both of you.",
        "A setback stops you in your tracks, and you read it as a call to wake up and change course.",
        "You ignore the inner life and take each wake-up call as plain bad luck, so that the calls grow louder.",
      ],
    },
  ],
  uranus: [
    // 1st
    {
      core: "You have to act differently, not just look different, questioning every unwritten rule about how a couple behaves. When you get it right, you look wrong to others.",
      expressions: [
        "You live by your own rules openly, and stop explaining them.",
        "You catch yourselves obeying a rule nobody ever stated, and break it on purpose.",
        "You look unconventional and live conventionally, and feel you are going through the motions.",
      ],
    },
    // 2nd
    {
      core: "You have to define your own values and your own idea of wealth, against the pressure to consume. Sudden losses and impulse buys show you what you really value.",
      expressions: [
        "You decide what wealth means to you, and spend and save by that alone.",
        "You lose something suddenly and find you do not miss it, and learn what does matter.",
        "You buy what everyone buys, feel nothing for it, and money comes and goes in jolts.",
      ],
    },
    // 3rd
    {
      core: "You have an uncensored, unconventional way of talking that is your own invention, and a tendency to blurt.",
      expressions: [
        "You have a private language and say things to each other that no one else would dare.",
        "One of you blurts out a truth at the wrong moment, and it turns out to be what needed saying.",
        "You censor yourselves into ordinary talk, and the blurting comes anyway, as shocks that wound.",
      ],
    },
    // 4th
    {
      core: "The picture of home and household you inherited does not fit you. You have to choose your own living arrangement deliberately and defend it.",
      expressions: [
        "You live in an arrangement of your own making, and defend it calmly to family.",
        "You try several ways of living before you find the one that fits.",
        "You set up the household your parents had, and feel like lodgers in it, restless and ready to bolt.",
      ],
    },
    // 5th
    {
      core: "You have to discover what is actually fun for the two of you, as against what your crowd prescribes.",
      expressions: [
        "You find your own odd pleasures and pursue them without embarrassment.",
        "You leave the party early to do the thing you really enjoy.",
        "You go along with what your friends call a good time, and are bored in the middle of your own leisure.",
      ],
    },
    // 6th
    {
      core: "You rebel together against chores until things fall apart. You need inventive solutions to who does what.",
      expressions: [
        "You invent an unorthodox system for the housework that suits you both and keeps things running.",
        "You pay, swap or automate your way out of the tasks neither of you will do.",
        "You both refuse the routine, and the household falls apart around you.",
      ],
    },
    // 7th
    {
      core: "You need independent, even controversial friends who show you how to be yourselves inside a relationship.",
      expressions: [
        "You have friends whose relationships break the mould, and they give you permission to break yours.",
        "You keep a friend others disapprove of, because that friend is honest and free.",
        "You keep only conventional company, and have no model for being yourselves together.",
      ],
    },
    // 8th
    {
      core: "You have to chart your own course through sexuality and jealousy. Half of society’s rules are wrong for you, and it is yours to work out which half.",
      expressions: [
        "You test each rule about sex and fidelity against your own experience, and keep the half that is true for you.",
        "You talk about jealousy openly and reach terms no one else would have written.",
        "You swallow the rules whole or throw them all out, and either way you are living by the wrong half.",
      ],
    },
    // 9th
    {
      core: "You need distance from the culture you were born into, and a morality you have examined and actually believe.",
      expressions: [
        "You live abroad or among outsiders, and see your upbringing clearly from there.",
        "You question each inherited principle and keep the ones that survive.",
        "You profess the morality you were handed, do not believe it, and feel false.",
      ],
    },
    // 10th
    {
      core: "A conventional way of life feels empty to you. You become agents of change in your community.",
      expressions: [
        "You change something in the place where you live, and are known for it.",
        "You earn your living in an unusual way, and it suits you both.",
        "You take the conventional path, succeed at it, and find it empty.",
      ],
    },
    // 11th
    {
      core: "The longer you are together, the further you travel from where you began, in beliefs, in friends, in direction.",
      expressions: [
        "You look back after ten years and hardly recognise your old life, and are glad.",
        "You outgrow one circle of friends and find another that fits who you are becoming.",
        "You cling to the plans and the crowd you started with, and the relationship stalls while both of you privately change.",
      ],
    },
    // 12th
    {
      core: "Your spiritual life has to become your own, which typically means leaving the religion you were born into, in the broadest sense.",
      expressions: [
        "You leave the faith or the unbelief you were raised in and find a path that is yours.",
        "You practise in a way no tradition would recognise, and it works.",
        "You keep the observances you were raised with out of habit, and your inner life together is a form with nothing in it.",
      ],
    },
  ],
  neptune: [
    // 1st
    {
      core: "You are a chameleon-like, closely attuned couple. You have to pursue spiritual experience deliberately and not drift.",
      expressions: [
        "You set out on purpose to find spiritual experience, and people sense a stillness about you.",
        "You read each other’s moods without a word and adapt to any company.",
        "You take the colour of whoever you are with, drift, and nobody, including you, knows who you are as a couple.",
      ],
    },
    // 2nd
    {
      core: "Money choices get vague and unwise between you. What builds your confidence is taking your shared spirituality and imagination seriously and investing in them.",
      expressions: [
        "You put money and time into your creative and spiritual life, and feel richer.",
        "You get clear, simple help with money because you know it is not your strong suit.",
        "You are vague about money, make unwise choices, and tell yourselves that going without is a virtue.",
      ],
    },
    // 3rd
    {
      core: "Finding each other through words is hard for you. Your intuitive, non-verbal understanding is a strength to build on.",
      expressions: [
        "You understand each other with a look, and trust that understanding.",
        "You use music, touch and images to say what sentences will not.",
        "Words slide past each other, misunderstandings multiply, and each assumes the other knows what was never said.",
      ],
    },
    // 4th
    {
      core: "Your home has to be a sanctuary with a shared practice at its centre.",
      expressions: [
        "You keep a quiet corner for practice, and the whole house takes its tone from it.",
        "You make the home soft, private and beautiful, a place to recover.",
        "You go without a home you actually need, and call it not minding.",
      ],
    },
    // 5th
    {
      core: "Your lovemaking needs a dimension of soul or desire fades.",
      expressions: [
        "You treat lovemaking as communion, and desire lasts through the years.",
        "You make art or music together, and it carries the same charge.",
        "Lovemaking loses its meaning for you, and desire fades.",
        "You fall into an addiction or a compulsion that the two of you share.",
      ],
    },
    // 6th
    {
      core: "An older couple passes on to you how to keep soul alive in everyday routine, and you pass it on in turn. You are drawn to selfless service.",
      expressions: [
        "You learn from an older couple how to make ordinary days sacred, and do it.",
        "You give your time to people who need it and ask nothing back.",
        "Routine goes soulless, and you martyr yourselves to work and to others until you are empty.",
      ],
    },
    // 7th
    {
      core: "You attract two kinds of people: those in trouble who take more than you have to give, some of whom you have to let go, and visionaries, artists and healers who are vital to you.",
      expressions: [
        "You have friends who are artists, healers or seekers, and they feed you.",
        "You help someone in difficulty for a season, and then let them go.",
        "You are surrounded by people you are rescuing, cut none of them loose, and have nothing left for each other.",
      ],
    },
    // 8th
    {
      core: "Your sexual life has to open deeper doors or it fades.",
      expressions: [
        "Sex takes you somewhere beyond yourselves, and you treat it with reverence.",
        "You notice distance between you and face it sober.",
        "You override the distance between you with alcohol or drugs, and it widens underneath.",
      ],
    },
    // 9th
    {
      core: "You have to reconcile faith and reason by sampling many traditions and making pilgrimages.",
      expressions: [
        "You visit sacred places and study many paths, and hold faith and reason together.",
        "You hold your beliefs loosely enough that an experience still surprises you.",
        "You adopt a dogma that numbs you both, and stop looking for anything further.",
      ],
    },
    // 10th
    {
      core: "As a couple you publicly symbolise compassion, imagination or spiritual awareness, or else you serve as the bad example.",
      expressions: [
        "You are known for kindness or for art, and people are moved by you.",
        "You do work together that serves people who are suffering.",
        "You drift in public view, as the couple who lost themselves to addiction or to being victims, and others point to you as a warning.",
      ],
    },
    // 11th
    {
      core: "The sense that you are soulmates grows slowly, and it needs a circle of friends who are spiritually literate.",
      expressions: [
        "Each decade you are surer that you belong together.",
        "You keep friends who take the inner life seriously, and they recognise what you are to each other.",
        "You have no such friends and no shared aim, and the sense of belonging together never ripens.",
      ],
    },
    // 12th
    {
      core: "You are strongly attuned, more evolved together than apart. You need quiet, temple-like time together.",
      expressions: [
        "You sit in silence together and know each other’s minds.",
        "You dream of each other, sense each other at a distance, and take it as normal.",
        "Without that quiet you tune each other out, and live together unheard.",
      ],
    },
  ],
  pluto: [
    // 1st
    {
      core: "There is a dramatic, sexually charged intensity about you, at times overbearing or tragic in feel. That is the wound showing. Its healing is learning to do as you please, wisely, and recovering innocence.",
      expressions: [
        "You do what you want, with good sense, and there is something fresh and unguarded about you.",
        "Your intensity fills a room, and you learn to carry it lightly.",
        "You carry an air of tragedy everywhere, overpower the people around you, and feel fated instead of free.",
      ],
    },
    // 2nd
    {
      core: "You share a wound around survival, from poverty or more rarely from wealth. It leaves a foreboding that undercuts your faith in the relationship. Its healing is trusting that the relationship will survive.",
      expressions: [
        "You come to trust that you will last, and the dread lifts.",
        "You face a real threat to your security and find that you get through it together.",
        "A sense that it will all be taken away governs you, and you never commit your faith to the relationship.",
      ],
    },
    // 3rd
    {
      core: "The wound is being punished for what you said or saw. Its healing is gentleness in speech and slowly trusting each other with frightening truths.",
      expressions: [
        "You speak gently, and bit by bit tell each other the truths that frighten you.",
        "One of you says what you see and is thanked for it instead of punished.",
        "You say nothing of what you notice, for fear of what it will cost, and the unsaid truths sit between you.",
      ],
    },
    // 4th
    {
      core: "You are family to each other at a depth that feels older than your meeting, and family is where the wound lies. Its healing is deep, private psychological work and reclaiming faith in the idea of family.",
      expressions: [
        "You do the inner work privately, and come to believe in family again on your own terms.",
        "You recognise each other as kin and build a household that is safe.",
        "The old family injury is replayed in your own home, and you lose faith that family is ever safe.",
      ],
    },
    // 5th
    {
      core: "Your chemistry is explosive, and it is rooted in pleasure once repressed. Its healing is a right relationship with joy, and staying together only because you want to.",
      expressions: [
        "You enjoy each other freely and stay because you choose to, day by day.",
        "You allow yourselves a pleasure you were taught was forbidden, and the charge between you settles into joy.",
        "Pleasure is seized compulsively or denied outright, and you stay out of compulsion or obligation where wanting should be.",
      ],
    },
    // 6th
    {
      core: "You are outstanding in a crisis. The wound is crushing duty that you never chose. Its healing is service that is meaningful and freely taken on.",
      expressions: [
        "You find work that matters to you both and take it on by choice.",
        "An emergency comes and you are calm, quick and exactly what is needed.",
        "You are ground down by obligations you never chose and do not believe in.",
      ],
    },
    // 7th
    {
      core: "You are bound to intense, psychologically honest people who restore your trust in others after deception.",
      expressions: [
        "You have friends who tell the truth about themselves and you, and your trust in people is rebuilt.",
        "You are drawn to people with depth and a history, and choose among them carefully.",
        "You are dragged into other people’s trouble, and are deceived again.",
      ],
    },
    // 8th
    {
      core: "You share an old nightmare, and death is in it. Its healing is honest, bonded intimacy and accepting together that life is fragile.",
      expressions: [
        "You accept together that nothing is guaranteed, and love more openly because of it.",
        "You talk about death and fear without flinching, and intimacy deepens.",
        "Dread of loss rules you, and you grip each other or keep your distance so as not to feel it.",
      ],
    },
    // 9th
    {
      core: "You hunger for the honest truth, and the wound comes from collective belief and public morality. You are drawn back to the place of the wound.",
      expressions: [
        "You test every belief yourselves and settle only for what is true.",
        "You return to the church, country or creed that hurt you, look at it squarely, and are free of it.",
        "You submit again to a crowd’s certainty, or spend yourselves in bitterness against it.",
      ],
    },
    // 10th
    {
      core: "You have something uncomfortable to bring to your community’s attention, against a deep fear of being seen.",
      expressions: [
        "You find the nerve to stand up and say it, and it changes something.",
        "You take a visible role by degrees, each step easier than the last.",
        "You refuse to be seen, and are made victims again.",
      ],
    },
    // 11th
    {
      core: "The wound comes from group pressure: you were a crowd’s target, or were swept up in one. Healing comes later in your life together, after you have built trust and a supportive network.",
      expressions: [
        "After years you have a circle you trust, and it holds you.",
        "You enter groups slowly, watching, and stay only where you are respected.",
        "You keep clear of every group and stay isolated, or are swept along by a crowd once more.",
      ],
    },
    // 12th
    {
      core: "You share a wound of great loss. Its healing is a spiritual understanding of loss, reached in your own time.",
      expressions: [
        "You come to an understanding of loss that lets you love without bracing.",
        "You grieve together, openly, for what each of you has lost.",
        "Grief goes unspoken and unhealed, and a sorrow with no name hangs over your life together.",
      ],
    },
  ],
};

/** Composite lunar nodes by the sign of the SOUTH Node (the North Node is in the opposite sign): the old story and the pattern the couple brings, then the direction of growth. */
export const C_NODES_SIGN: Reading[] = [
  // South Node in Aries, North Node in Libra
  {
    core: "You come to each other out of an old story of war: danger, adrenaline, competition. The pattern you bring is colluding to keep life dramatic and exhausting, competing, and making caricatures of each other. The direction of growth is to calm down, make peace, listen, and know each other as complex people. Love is bigger than passion.",
    expressions: [
      "You listen to the end of the sentence, and discover someone more complicated than your opponent.",
      "You call a truce in the middle of a fight and find that the quiet is not boring.",
      "You compete over everything, from who is more tired to who is right.",
      "You keep life in permanent emergency, and each of you fights a cartoon of the other.",
    ],
  },
  // South Node in Taurus, North Node in Scorpio
  {
    core: "You come from an old story of simple living close to nature, in search of stability. The pattern you bring is standing still and a righteousness you have never examined. The direction of growth is to accept complexity and moral ambiguity, to own your needs for power, sex and control, and to stop pinning them on each other.",
    expressions: [
      "One of you admits to wanting power or control, and the other says the same.",
      "You look at a question with no clean answer and resist settling it early.",
      "You accuse each other of the very hunger you will not own.",
      "Nothing changes for years, and you are both sure you are right.",
    ],
  },
  // South Node in Gemini, North Node in Sagittarius
  {
    core: "Your old story is quick wits and improvisation, and there is something of youth in it. The pattern you bring is chronic overextension, tactics with no strategy, and blaming outside pressure. The direction of growth is to decide what truly matters, with a retreat each year to review your direction.",
    expressions: [
      "You go away once a year, ask what all the activity is for, and change course by the answer.",
      "You turn something down because it does not serve what matters most to you.",
      "You handle each week brilliantly and have no idea where the years are going.",
      "You are overstretched all the time and blame work, family and circumstance for it.",
    ],
  },
  // South Node in Cancer, North Node in Capricorn
  {
    core: "In the old story you were family, bound by parenthood. The pattern you bring is being too comfortable, and avoiding meeting as two naked adults by turning your attention to others, children above all. The direction of growth is to see each other as full adults, defend each other’s solitude, and take what you know out to the wider community.",
    expressions: [
      "You meet each other as two grown adults with the children out of the room, and find you are a little shy.",
      "Each of you guards the other’s time alone, and you take on a role beyond the household.",
      "You talk only about the children and the house, and months pass without a conversation between two adults.",
      "You parent each other, and everyone else, and never meet.",
    ],
  },
  // South Node in Leo, North Node in Aquarius
  {
    core: "Your old story is prominence, a kind of royalty. The pattern you bring is the burden of being the perfect couple, success measured by other people’s expectations, and empty theatre. The direction of growth is to do as you please and stop caring what anyone thinks.",
    expressions: [
      "You do something that disappoints your audience, and feel free.",
      "You ask what you would want if no one were watching, and act on it.",
      "You put on a fine show at every gathering and go home with nothing to say.",
      "You live the life others expect of a perfect couple, and it is theatre with no one inside.",
    ],
  },
  // South Node in Virgo, North Node in Pisces
  {
    core: "Your old story is impossible standards, and it has left you with inadequacy, shame and guilt. The direction of growth is to stop identifying with the struggle to improve, to play, and to rest in meditation that has no goal.",
    expressions: [
      "You sit together doing nothing, aiming at nothing, and feel acceptable as you are.",
      "You let something be good enough and go out to play.",
      "You work at the relationship as a project that is never finished.",
      "Each of you feels a failure by the other’s standard and your own, and guilt and shame colour everything.",
    ],
  },
  // South Node in Libra, North Node in Aries
  {
    core: "Your old story is civilised partnership. The pattern you bring is politeness and aesthetic escape in place of real contact, so that in some ways you barely know each other. The direction of growth is passion, anger when it is needed, and shared adventure. Love does not require agreement, and being able to let each other go is what lets you stay.",
    expressions: [
      "You have a real row, say what you want, and find the relationship stronger.",
      "You do something risky together and see each other without the manners.",
      "You agree pleasantly about everything and choose a new sofa instead of having the conversation.",
      "You are courteous strangers who have never met each other in anger or in need.",
    ],
  },
  // South Node in Scorpio, North Node in Taurus
  {
    core: "Your old story is shared extremity and suffering. The pattern you bring is attachment to heaviness. The direction of growth is concrete comfort: a hug or a nap in place of analysis, time in nature, plain acceptance. Life is easier with a mate.",
    expressions: [
      "One of you is upset, the other offers a hug and a cup of tea, and that is the whole remedy.",
      "You spend a day outdoors with nothing to work through, and let life be easy.",
      "You analyse every feeling for hours when what you both need is sleep.",
      "You distrust anything light, go looking for the wound in every good day, and stay loyal to suffering.",
    ],
  },
  // South Node in Sagittarius, North Node in Gemini
  {
    core: "Your old story is quest, religion and compelling belief. The pattern you bring is addiction to certainty and a shared agreement to deny whatever is inconvenient to it. The direction of growth is wonder, surprise, long conversation and vigorous, respectful disagreement.",
    expressions: [
      "You disagree heartily for an evening and enjoy not settling it.",
      "A fact upsets what you believe, and you are curious about it.",
      "You answer every question with the same doctrine, and finish each other’s certainties.",
      "You agree between you not to see what does not fit, and the truth you are avoiding grows.",
    ],
  },
  // South Node in Capricorn, North Node in Cancer
  {
    core: "Your old story is hard necessity, duty done without tears. The pattern you bring is numbness to pain and need while responsibilities multiply. The direction of growth is to cry the old tears together, to allow need, and to build a home that is emotionally safe.",
    expressions: [
      "One of you weeps at last, the other does too, and something long frozen gives way.",
      "You say that you need each other and make the house a place where that is safe to say.",
      "You take on one more responsibility instead of resting or feeling.",
      "You function perfectly and feel nothing, and neither of you has asked the other for comfort in years.",
    ],
  },
  // South Node in Aquarius, North Node in Leo
  {
    core: "Your old story is that of outsiders, heretics. The pattern you bring is being right and unheard. The direction of growth is to roar and be heard: to become persuasive, appealing builders of bridges, and to move from being right to being effective.",
    expressions: [
      "You present what you believe warmly and well, and people are won over.",
      "You take the trouble to be liked, and find it costs you no integrity.",
      "You make your point in a way that guarantees no one will accept it.",
      "You stand apart, correct and ignored, and take a cold pride in it.",
    ],
  },
  // South Node in Pisces, North Node in Virgo
  {
    core: "Your old story is loss of self, in a cloister or in drink and drift. The pattern you bring is drifting, surrendering what you need, and a spirituality that is subtly self-absorbed. The direction of growth is to get down to earth, make little things matter, and be of practical use.",
    expressions: [
      "You do one small useful thing well each day, for each other and for someone else.",
      "You keep a routine, pay the bills on time, and find it steadies your spirit.",
      "You give up what you need without a word and call it acceptance.",
      "You drift through the years, absorbed in your own inner states, and nothing gets built or done.",
    ],
  },
];

/** Composite lunar nodes by the house of the SOUTH Node (the North Node is in the opposite house): the circumstances of the old story and its pattern, then where growth lies. */
export const C_NODES_HOUSE: Reading[] = [
  // South Node in the 1st, North Node in the 7th
  {
    core: "Your old story is freedom and decisive action, in which you chose separate roads again and again. The pattern you bring is self-sufficiency to the point of oblivious isolation. The direction of growth is to listen, depend and surrender, in trust and commitment. Each of you holds half the map.",
    expressions: [
      "You ask each other’s advice before deciding, and the decision is better for it.",
      "One of you admits to needing the other, and is not diminished.",
      "Each of you makes plans alone and informs the other afterwards.",
      "At the first real difficulty you take separate roads, as you have before.",
    ],
  },
  // South Node in the 2nd, North Node in the 8th
  {
    core: "Your old story is scarcity or extremes of money, or a marriage made before either of you was grown. The pattern you bring is a relationship that doubts itself or feels like a trap. The direction of growth is deep bonding and mature, self-aware sexual surrender.",
    expressions: [
      "You give yourselves to each other completely, knowing what you are doing.",
      "You risk real intimacy before the bank balance feels safe.",
      "You count what you have and what you owe, and measure the relationship the same way.",
      "You feel trapped with each other and doubt the whole thing, while holding back the one surrender that would change it.",
    ],
  },
  // South Node in the 3rd, North Node in the 9th
  {
    core: "Your old story is speed and rapid adaptation, like siblings making do. The pattern you bring is being swept along by events, with glib talk that never reaches the soul. The direction of growth is to step back to values and meaning, and to travel as a spiritual discipline.",
    expressions: [
      "You go far away with the purpose of finding out what you believe.",
      "You stop mid-conversation and ask what the point of all this is, and stay for the answer.",
      "You banter quickly and cleverly and never say the thing underneath.",
      "Events carry you from one week to the next, and you have no idea what your life together is for.",
    ],
  },
  // South Node in the 4th, North Node in the 10th
  {
    core: "Your old story was defined and limited by family. The pattern you bring is identities swallowed by what the family requires. The direction of growth is to come out into the world and offer your gifts: you take the post far away in preference to staying near the parents.",
    expressions: [
      "You take the opportunity that means leaving home ground, and become known for what you do.",
      "You disappoint the family on one matter and survive it.",
      "You arrange every decision around what the family needs.",
      "You never leave, and what the two of you had to give the world is never given.",
    ],
  },
  // South Node in the 5th, North Node in the 11th
  {
    core: "Your old story turns on children who eclipsed their parents, on the arts, on pleasure-seeking, or on breaking rules to be together. The pattern you bring is repeating those compulsions. The direction of growth is strategic thinking, long-term goals, and being smarter about what brings lasting joy.",
    expressions: [
      "You plan ten years ahead and choose the pleasures that will still be good then.",
      "You put a goal ahead of an impulse and are glad of it.",
      "You live for the weekend, the next thrill or the children’s next triumph.",
      "You repeat the same indulgence or the same drama until it has cost you the future.",
    ],
  },
  // South Node in the 6th, North Node in the 12th
  {
    core: "Your old story is lifetimes of duty and self-sacrifice. The pattern you bring is needs eclipsed by responsibility, and helping people who are better left unhelped. The direction of growth is to withdraw, take solitude together that feeds the soul, and let yourselves receive.",
    expressions: [
      "You go away together with no one to look after, and let yourselves be given to.",
      "You decline to rescue someone who needs to manage alone.",
      "You fill every free hour with someone else’s needs.",
      "You serve until you are empty, and neither of you remembers what you yourselves need.",
    ],
  },
  // South Node in the 7th, North Node in the 1st
  {
    core: "Your old story is marriage itself: you come to each other as though already long married. The pattern you bring is losing yourselves in each other, the sweet couple with no separate selves. The direction of growth is enlightened selfishness, autonomy, and taking the fear out of being separate.",
    expressions: [
      "Each of you does something alone, for yourself, and comes home more interesting.",
      "One of you says I where you used to say we, and the other is glad.",
      "You answer for each other, dress alike, and have no opinion the other does not share.",
      "Neither of you knows any longer what you want apart from the other, and separateness terrifies you.",
    ],
  },
  // South Node in the 8th, North Node in the 2nd
  {
    core: "Your old story is a bond forged in fire and nightmare. The pattern you bring is closeness that depends on crisis. The direction of growth is real, felt safety: financial security, a secure home, quiet, nature, and confidence regained.",
    expressions: [
      "You build a secure home and a cushion of savings, and your bodies finally relax.",
      "You spend a quiet season in which nothing happens, and learn to bear it.",
      "You feel close only in an emergency, and are restless when things are calm.",
      "You live braced for catastrophe, and create crises to feel the bond.",
    ],
  },
  // South Node in the 9th, North Node in the 3rd
  {
    core: "Your old story is marked by religion or crusade. The pattern you bring is being blinded by zeal. The direction of growth is to believe only what you see and experience for yourselves: curiosity, teachers who contradict each other, nothing taboo in conversation.",
    expressions: [
      "You listen to two teachers who disagree and trust your own eyes between them.",
      "You ask a question your old creed forbade, and follow it.",
      "You have the answer before the other has finished the question.",
      "You give yourselves to a cause so completely that you no longer see what is in front of you.",
    ],
  },
  // South Node in the 10th, North Node in the 4th
  {
    core: "Your old story is prominence and role-playing, a marriage made for position and not for love. The pattern you bring is carrying other people’s conviction that you belong together. The direction of growth is to make sure the feeling is real and the choice your own, and to turn to home and private emotional life.",
    expressions: [
      "You ask each other in private whether you truly want this, and answer honestly.",
      "You give up a public commitment to be at home, and feel more than you have in years.",
      "You are the couple everyone says is perfect, and you go along with it.",
      "You play your parts flawlessly in public and are strangers at home.",
    ],
  },
  // South Node in the 11th, North Node in the 5th
  {
    core: "Your old story is being swept along by collective currents, away from your own values. The pattern you bring is group-think, and it repeats in any new crowd, including an alternative one. The direction of growth is to recover your own desires, play, and make things together.",
    expressions: [
      "You make something together purely because you want to.",
      "You say what you want before finding out what your friends think.",
      "You leave one crowd and take on the opinions of the next.",
      "You no longer know what either of you desires, only what your circle approves.",
    ],
  },
  // South Node in the 12th, North Node in the 6th
  {
    core: "Your old story is loss, grief, confinement or illness. The pattern you bring is retreat into the inner life and failure to claim ordinary happiness, with dependence on drink or drugs as its risk. The direction of growth is to come back into the body, through exercise, meals and touch, and into routine, competence and service.",
    expressions: [
      "You cook, walk, work and touch each day, and ordinary happiness arrives.",
      "You learn a practical skill together and use it for someone’s benefit.",
      "You withdraw into your own worlds and let the practical side of life slide.",
      "You retreat from life altogether and lean on drink or drugs to stay away.",
    ],
  },
];

/** The three ways a composite chart can relate to the two people's own charts. */
export const C_PATTERNS: { apart: string; lopsided: string; shared: string } = {
  apart:
    "The chart of your relationship looks like neither of you. What feeds the two of you as a couple is unlike what feeds either of you alone, so each of you has to adjust a good deal, and it helps to say so openly.",
  lopsided:
    "The chart of your relationship resembles {A} much more than {B}. Things tend to go the way that suits {A} without any effort, so it is up to {A} to share the say deliberately and up to {B} to speak up plainly about what is needed.",
  shared:
    "Each of you can find parts of yourself in the chart of your relationship, which is the easiest arrangement of the three. The caution is that the parts of each of you it does not reflect can be outvoted, so make a point of asking after them.",
};
