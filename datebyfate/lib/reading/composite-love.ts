/**
 * Composite chart readings for a couple: Sun, Moon, Ascendant, Venus, Mars, Saturn,
 * the other planets by house, and the lunar nodes.
 *
 * The readings for the composite Sun, Moon, rising sign, Venus, Mars and Saturn
 * have two forms. `core` says what the placement is and what the two people
 * need because of it, and holds whatever aspects the planet makes. `strain` is
 * what tends to go wrong when that need is neglected. A placement alone does
 * not justify asserting a difficulty, so the app shows `strain` as written only
 * when that composite planet is under hard aspect in the composite chart.
 * `strain` is therefore conditional, describes a tendency and not a history,
 * and starts "Under strain," or "When this is under pressure,".
 *
 * The other planets by house and the nodes keep one string each. They are
 * written as tendencies too, with no difficulty stated as fact.
 *
 * Themes follow the Forrests' "Skymates, Volume Two", chs. 5 to 16; the wording is our own.
 *
 * Arrays by sign are in zodiac order, Aries first. Arrays by house are house 1 first.
 */

export interface Reading {
  /** What the placement is and what the couple needs, whatever its aspects. */
  core: string;
  /** What tends to go wrong when the need is neglected; shown as written only when the planet is under hard aspect. Starts "Under strain," or "When this is under pressure,". */
  strain: string;
}

/** Composite Sun by sign: what keeps this couple alive, and the form it takes under strain. */
export const C_SUN_SIGN: Reading[] = [
  // Aries
  {
    core: "What keeps the two of you alive is adventure, intensity and risks taken together. Above all you need emotional courage, the kind it takes to say that something needs talking about.",
    strain: "Under strain, that courage can falter, and what goes unsaid may come out as bickering, pettiness and a low stress neither of you can quite name.",
  },
  // Taurus
  {
    core: "You thrive on stability, peace and physical comfort, such as touch, long meals, music, animals and time outdoors. Much of what passes between you needs no words, and you do well to let small dramas go quickly.",
    strain: "When this is under pressure, keeping the calm can come first, and struggles you need to have may get quietly put away.",
  },
  // Gemini
  {
    core: "You need a quick, varied supply of new experiences, ideas and conversation. Each of you keeps the other curious, and the relationship is fed by questions left open.",
    strain: "Under strain, certainty and boredom can settle in, and the liveliness between you may fade as you stop being surprised by each other.",
  },
  // Cancer
  {
    core: "Your vitality depends on loving without defences and keeping your promises, until the two of you feel like home to each other. Looking after other people together feeds you as well.",
    strain: "When this is under pressure, either of you may hedge on commitment, and warmth and desire can slowly leak away.",
  },
  // Leo
  {
    core: "You come alive when you are seen. Celebrating, playing, dressing up, making things together and applauding each other generously are what feed this relationship.",
    strain: "Under strain, a long stretch of nothing but practicality and thrift can deaden the feeling between you.",
  },
  // Virgo
  {
    core: "You need to feel that you are growing together and being useful to the people around you. You also need to simply enjoy what you already have.",
    strain: "When this is under pressure, growth can turn into constant self-examination and helpful comments that wear you both out.",
  },
  // Libra
  {
    core: "You are fed by calm, beauty, courtesy and fairness, and by the way your differences balance each other. Honest negotiation is part of what keeps you well.",
    strain: "Under strain, rudeness can shake your faith in each other, and compromises neither of you believes in may only make a later row bigger.",
  },
  // Scorpio
  {
    core: "You stay alive by going deep into each other’s inner lives. That takes willingness, humour and a great deal of trust, and the relationship needs all three.",
    strain: "When this is under pressure, depth can turn into moodiness, sniping and a heaviness that drains you both, with each other’s boundaries overrun.",
  },
  // Sagittarius
  {
    core: "You are on a shared search for meaning. You need change, travel, learning and room to stretch, and the relationship is at its best when it is going somewhere new.",
    strain: "Under strain, you may choose a settled life over that nature, and it can show as nagging disorder, fixed opinions and tiredness.",
  },
  // Capricorn
  {
    core: "What sustains you is long-term commitment and conduct you can both be proud of. Other people tend to look to a couple like you as an example.",
    strain: "When this is under pressure, wavering over the promise you have made can drain your energy as a couple.",
  },
  // Aquarius
  {
    core: "You need to invent your own form of relationship, outside the usual conventions. Trusting that your oddities suit you is what keeps the two of you vital.",
    strain: "Under strain, you may follow the standard script and be left with a nagging sense that something is not right.",
  },
  // Pisces
  {
    core: "You need quiet time together that feeds the spirit, with music, stillness and a sense of wonder. Being able to laugh at yourselves matters just as much.",
    strain: "When this is under pressure, you can drift into listlessness, resignation and escapism.",
  },
];

/** Composite Sun by house. */
export const C_SUN_HOUSE: Reading[] = [
  // 1st
  {
    core: "You are a couple other people notice and tend to follow. What serves you is making being together a conscious, adult choice, since the example you set carries weight.",
    strain: "Under strain, you may privately wonder whether you are meant to be together, and others can end up copying whatever you model, good or bad.",
  },
  // 2nd
  {
    core: "You are building confidence in yourselves as a couple. It helps to give yourselves concrete signs of a future, such as shared plans and shared purchases.",
    strain: "When this is under pressure, caution can take over, with hedging, holding back and a long wait to be sure.",
  },
  // 3rd
  {
    core: "You run on curiosity, conversation, short trips and learning, in a fast, unpredictable life where you improvise. How you speak to each other matters a great deal.",
    strain: "Under strain, predictability and silence can flatten you, and life may keep contradicting what you expected of it.",
  },
  // 4th
  {
    core: "Your energy comes from home, roots, family and quiet time in a place that is entirely yours, with a sense that it will last. Giving your home life priority is what keeps you well.",
    strain: "When this is under pressure, a neglected home base can run you both down, and family matters may loom large.",
  },
  // 5th
  {
    core: "You need to keep the feeling of being in love alive, with compliments, flowers, anniversaries, play and things you create together. Friends tend to come and go through your life.",
    strain: "Under strain, pleasure can tip into habits and compulsions that are hard to put down.",
  },
  // 6th
  {
    core: "You are fed by working side by side and by being of real use. It suits you to learn from older couples and, in time, to guide others in turn.",
    strain: "When this is under pressure, and meaningful work together is avoided, it can come back as plain, dispiriting drudgery.",
  },
  // 7th
  {
    core: "The pull between you is strong, and what keeps you well is skill at partnership, which means equal weight for each person’s needs, compromise and learning to handle conflict. Friends you can each let off steam with are part of that.",
    strain: "Under strain, you may merge so closely that a first disagreement feels like betrayal, and small annoyances can pile up.",
  },
  // 8th
  {
    core: "With you, a great deal comes to the surface. What sustains the passion is being honest and unguarded with each other, and growing together because of it.",
    strain: "When this is under pressure, old hurts that have not been tended can start to run the relationship, and you may both end up emotionally exhausted.",
  },
  // 9th
  {
    core: "You stay alive by widening your horizons through travel, other cultures, study and a philosophy of life you work out together. The relationship needs room to keep stretching.",
    strain: "Under strain, you can shut yourselves inside one set of beliefs until certainty goes stale.",
  },
  // 10th
  {
    core: "You have a public role as a couple, perhaps through shared work or something you give your community. Others tend to take their cue from how you live.",
    strain: "When this is under pressure, you may lose sight of the example you set and not notice the mark you leave.",
  },
  // 11th
  {
    core: "Your energy comes from shared goals, a clear picture of the future and deliberate planning. Belonging to a group of like-minded people feeds you too.",
    strain: "Under strain, and without a direction, you can settle into a comfortable limbo that does not quite go anywhere.",
  },
  // 12th
  {
    core: "You need a shared inner life, with quiet evenings, a spiritual practice of some kind, and lovemaking treated as something sacred. This is the depth the relationship draws on.",
    strain: "When this is under pressure, ordinary busyness can take over, and the relationship may feel as though it is slipping away.",
  },
];

/** Composite Moon by sign: what the couple's heart needs, the home that suits it. */
export const C_MOON_SIGN: Reading[] = [
  // Aries
  {
    core: "Your shared heart is a fighter’s. You need challenges, and something outside the relationship that the two of you can push against together.",
    strain: "Under strain, with nothing to take on, you can push against each other, and letting things slide into laziness is the larger risk.",
  },
  // Taurus
  {
    core: "Your heart needs simple physical pleasures, such as nature, quiet, good food and bodily comfort. The private animal playfulness between you is part of what restores you.",
    strain: "When this is under pressure, overthinking and busyness can crowd out those plain creature needs, and you both feel the lack.",
  },
  // Gemini
  {
    core: "The relationship is at its best as one long conversation, kept fresh by new things to see and talk about. There is something light and curious in your shared mood.",
    strain: "Under strain, boredom can arrive dressed as responsibility, and the talking may thin out.",
  },
  // Cancer
  {
    core: "There is an ease of familiarity between you. Your heart needs nesting, tenderness and a safe base to build commitment on.",
    strain: "When this is under pressure, you may go quiet and close up when it would help to say that you need touch, attention or reassurance.",
  },
  // Leo
  {
    core: "Your shared mood is generous and a little grand. You need to spoil each other, applaud each other, celebrate and be seen.",
    strain: "Under strain, appreciation can be held back, and the spontaneity between you may fade.",
  },
  // Virgo
  {
    core: "Your heart is happiest when things are improving. You do well with honest feedback from each other and with good outside advice.",
    strain: "When this is under pressure, discontent can turn into nit-picking about chores and money, with a harried feeling that something is about to go wrong.",
  },
  // Libra
  {
    core: "You have an air of belonging together, two different people who complete each other. Art, music and at least one beautiful room at home soothe you.",
    strain: "Under strain, you may prize agreement over really knowing each other, or blur into one person.",
  },
  // Scorpio
  {
    core: "Intensity and honesty come naturally to you. Humour, outside interests and friends who give you perspective are what keep that depth good for you.",
    strain: "When this is under pressure, you can go deeper and faster than you can manage and sink into brooding.",
  },
  // Sagittarius
  {
    core: "Your heart is a wanderer’s. You need open road, travel, learning and one long conversation about what life means.",
    strain: "Under strain, repetition and boredom can dull the feeling between you.",
  },
  // Capricorn
  {
    core: "Your shared heart is sober and realistic, building slowly and keeping its word. It is fed by learning to relax, to ask each other for reassurance and to turn down extra duties.",
    strain: "When this is under pressure, seriousness can take over, and you may carry more than you need to without asking each other for comfort.",
  },
  // Aquarius
  {
    core: "Your heart is a rebel’s. You may need more time apart, separate friends or separate holidays than most couples, in a home that looks like nobody else’s.",
    strain: "Under strain, living by conventional assumptions can leave you cool, sardonic and stuck in your heads.",
  },
  // Pisces
  {
    core: "Your heart needs quiet time alone together, with music, low light and privacy you defend firmly. There is something contemplative in your shared mood.",
    strain: "When this is under pressure, and that care lapses, the relationship can simply drift.",
  },
];

/** Composite Moon by house. */
export const C_MOON_HOUSE: Reading[] = [
  // 1st
  {
    core: "Your feelings as a couple sit on the surface where everyone can see them, and people tend to bring you their own needs. Keeping room for what the two of you need is the task.",
    strain: "Under strain, other people’s demands can crowd out your own.",
  },
  // 2nd
  {
    core: "You build faith in the relationship by taking emotional risks together, such as showing feeling, risking embarrassment and making a nest. Each one taken gives you firmer ground.",
    strain: "When this is under pressure, your faith in the relationship can rise and fall from week to week, and doubt about the basics may keep coming back.",
  },
  // 3rd
  {
    core: "You tend to attract a busy, slightly chaotic life. Its use is to give you plenty to talk about and to teach you to speak from the heart.",
    strain: "Under strain, life can go dull, and when you have little to say to each other the warmth may drop.",
  },
  // 4th
  {
    core: "Your happiness depends on plenty of time simply at home, in a cocoon of your own with the people you count as family. It helps to understand each other’s family background.",
    strain: "When this is under pressure, family matters can weigh heavily on you and feel more like burden than joy.",
  },
  // 5th
  {
    core: "The aim is to keep falling in love, through play, a shared creative outlet, new friends and perhaps children who remind you how to play. Lightness is a real need for the two of you.",
    strain: "Under strain, you may settle into sensible routine, and the feeling of being in love can go quiet.",
  },
  // 6th
  {
    core: "Work and responsibilities tend to gather around you, and working together brings you closer, often in caring for someone who needs it. In time you may guide younger couples.",
    strain: "When this is under pressure, you can be swallowed by routine because neither of you finds it easy to say no.",
  },
  // 7th
  {
    core: "Your closeness is warm and unguarded and runs on touch and simply sleeping side by side. As a couple you also need kind, nurturing friends who reflect you back to yourselves.",
    strain: "Under strain, you may become isolated as a couple, and you tend to feel the lack of that outside warmth.",
  },
  // 8th
  {
    core: "Feelings run strong between you and come to the surface quickly, so things tend to get resolved and not left to linger. Forgiveness, patience and humour are what this depth needs.",
    strain: "When this is under pressure, jealousy, anger or possessiveness can flare, and several crises in a row may wear you down.",
  },
  // 9th
  {
    core: "You are travellers at heart. You need more change, distance and big ideas than most couples, perhaps even a life abroad.",
    strain: "Under strain, a dull, repetitive life can drain the feeling out of the relationship.",
  },
  // 10th
  {
    core: "The mood at work comes home with you, so finding the right work, and backing each other towards it even at some cost, matters a great deal. You may also share a caring role in your community.",
    strain: "When this is under pressure, unhappy work that is left alone can sour home life.",
  },
  // 11th
  {
    core: "You feel best when you are building something large together, often a home or a family, with allies who share the aim. Shared long-term goals settle your mood.",
    strain: "Under strain, and without goals, you may spread yourselves thin on socialising that tires you and gives little back.",
  },
  // 12th
  {
    core: "Your happiness depends on a lot of time alone together, in quiet, in meditation, or absorbed in something beautiful. That shared inner space is where your feeling for each other is renewed.",
    strain: "When this is under pressure, too much socialising can drain you both.",
  },
];

/** Composite Ascendant by sign: how the couple comes across and approaches the world. */
export const C_RISING_SIGN: Reading[] = [
  // Aries
  {
    core: "You come across as confident and plucky. That ease is earned by facing challenges side by side, as comrades.",
    strain: "Under strain, and without challenges met together, you may feel less sure of yourselves in company than you look.",
  },
  // Taurus
  {
    core: "You give off a calm naturalness. You need silence, nature, shared meals, familiar people and places, and some financial security.",
    strain: "When this is under pressure, status games can pull you away from that haven.",
  },
  // Gemini
  {
    core: "You come across as lively and witty. You need to keep life interesting through classes, new sights and good conversation.",
    strain: "Under strain, you can be busy without learning anything, and boredom may creep in behind the activity.",
  },
  // Cancer
  {
    core: "People tend to find the two of you nurturing and your home soothing. Protecting that nest, with limits where they are needed, is part of looking after it.",
    strain: "When this is under pressure, friends and relatives who lean on you heavily can drain your nest.",
  },
  // Leo
  {
    core: "You have flair and a certain dignity as a couple. Looking and feeling impressive gives you the nerve to take creative risks and to lead, sometimes quite literally on a stage.",
    strain: "Under strain, you may hold back from being seen, and the creative risks that suit you can go untaken.",
  },
  // Virgo
  {
    core: "You come across as a capable team whose skills fit together. Your sense of purpose turns on finding the right shared work or service.",
    strain: "When this is under pressure, and that work is missing, life can fill up with thankless duties.",
  },
  // Libra
  {
    core: "You are gracious and good at bringing people together. You learn about relating by watching other people and other couples, so the company you choose matters.",
    strain: "Under strain, you may socialise with everyone and choose your company with less care than it deserves.",
  },
  // Scorpio
  {
    core: "There is a disarming intensity about you, and a dark sense of humour, that leads people to tell you their secrets. Honest, unshockable outsiders help you keep your own perspective.",
    strain: "When this is under pressure, and without that outside view, you can lose perspective on yourselves.",
  },
  // Sagittarius
  {
    core: "You come across as free spirits, with an understanding between you to take chances and gather wide experience. What you are learning together is faith, and that asks for some risk.",
    strain: "Under strain, you may play safe, and the faith you are building together can go untested.",
  },
  // Capricorn
  {
    core: "People see you as steady and older than your years, a couple who intend to grow old together. You grow by taking on large tasks and roles in your community.",
    strain: "When this is under pressure, you may avoid those large tasks and lose something of what they would have made of you.",
  },
  // Aquarius
  {
    core: "You do not quite fit in, and that suits you. You do well to grow a thick skin and shape the relationship your own way.",
    strain: "Under strain, the wish not to disappoint family can pull you towards a shape that is not yours.",
  },
  // Pisces
  {
    core: "There is a dreamy, intuitive chemistry about you. It suits you to live outwardly as seekers, through prayer or meditation together, teachers and places that move you.",
    strain: "When this is under pressure, you can be left passively watching life happen.",
  },
];

/** Composite Venus by sign: how affection is kept alive. */
export const C_VENUS_SIGN: Reading[] = [
  // Aries
  {
    core: "Affection between you runs on spark, cheek and shared adventure, with each backing the other’s courage. Arguments settled quickly and kept in proportion suit you.",
    strain: "Under strain, and without challenges to meet together, you can turn on each other.",
  },
  // Taurus
  {
    core: "Your affection lives in simplicity, steadiness, touch and cosy ease. You are good at letting small things go.",
    strain: "When this is under pressure, you may avoid even the conflicts you need, and security and routine can smother the spark.",
  },
  // Gemini
  {
    core: "You stay fond of each other through mental rapport, constant conversation, a varied life and encouragement of each other’s interests. Curiosity about each other is what keeps the warmth going.",
    strain: "Under strain, fixed ideas about each other and a failure to talk can cool things as quickly as boredom does.",
  },
  // Cancer
  {
    core: "Your affection is tender and nurturing. It needs gentleness, a slow pace and a protected private world where confidences stay put.",
    strain: "When this is under pressure, you can hurt each other more than you intend, and after a few knocks you may shut each other out just when opening up would help.",
  },
  // Leo
  {
    core: "You need to believe wholeheartedly that the two of you are something special, and to show it by celebrating, dressing up, complimenting and courting each other. Being seen as a happy couple helps.",
    strain: "Under strain, affection can fade as you stop believing you are right together.",
  },
  // Virgo
  {
    core: "You show love through responsibility, clear agreements and steady improvement. Small grievances are best dealt with as they arise.",
    strain: "When this is under pressure, criticism can creep in, and you may blame each other for an emptiness that belongs to yourselves.",
  },
  // Libra
  {
    core: "Affection is kept alive by fair negotiation and by treating your real differences as things that complete you. Shared taste in art and beauty helps.",
    strain: "Under strain, you may only keep things nice, and differences can fester until you lose some faith in each other.",
  },
  // Scorpio
  {
    core: "The warmth between you depends on psychological honesty, a lot of time alone together, strict confidentiality and a strong sexual bond. This is affection that wants depth.",
    strain: "When this is under pressure, jealousy, possessiveness and raw reactions can come up.",
  },
  // Sagittarius
  {
    core: "You need shared adventure and travel, and an early, explicit agreement about the rules, including exclusivity, flirting and close friendships with others. Room to roam together keeps you fond of each other.",
    strain: "Under strain, unexamined assumptions about freedom can cause trouble, and so can a stiflingly ordinary life.",
  },
  // Capricorn
  {
    core: "For you romance rests on character, which means integrity, promises kept in large things and small, and an apology when you fall short. Making time to play keeps it warm.",
    strain: "When this is under pressure, seriousness can crowd out play, and affection may become hard to see.",
  },
  // Aquarius
  {
    core: "You need to question the assumptions about love you inherited, on living together, age, children or distance. Closeness designed your own way is what keeps affection alive.",
    strain: "Under strain, obeying rules you have not examined can drain the pleasure from being together.",
  },
  // Pisces
  {
    core: "Your affection needs a consciously spiritual side and private time that you protect. Quiet together is where fondness is renewed.",
    strain: "When this is under pressure, you may give that quiet time away to outside demands.",
  },
];

/** Composite Venus by house. */
export const C_VENUS_HOUSE: Reading[] = [
  // 1st
  {
    core: "You look right together and people are drawn to you. The task is to keep choosing to love and to go on behaving like lovers on purpose.",
    strain: "Under strain, you may overdo the socialising or lean on the happy-couple image, which lets murkier matters build up unnoticed.",
  },
  // 2nd
  {
    core: "It helps to gather what lets you believe in the relationship, such as good advice, couples you admire and tokens such as rings. Investing in each other is how its worth becomes real to you.",
    strain: "When this is under pressure, doubts about what the relationship is worth can grow larger than the facts justify, and arguments about money may really be about trust.",
  },
  // 3rd
  {
    core: "You speak well together. Courtesy and careful words are what protect your closeness from wearing thin.",
    strain: "Under strain, the diplomacy can fail, and you may end up fighting private wars.",
  },
  // 4th
  {
    core: "There is a deep, lasting warmth beneath everything, and you are home-lovers at heart. A beautiful, peaceful home sets the tone for your romance.",
    strain: "When this is under pressure, an ugly or chaotic home can sour the feeling between you.",
  },
  // 5th
  {
    core: "You shine together, and you need to keep it feeling like a love affair. Shared creativity, pleasure, an open door for friends and, often, a welcome for children all feed it.",
    strain: "Under strain, pleasure and courtship can slip down the list, and the relationship may feel less like a love affair.",
  },
  // 6th
  {
    core: "You do well to seek out couples further along than you and learn from them humbly. Later you can pass on what you learn to others.",
    strain: "When this is under pressure, pride can get in the way, in the form of a feeling that you have nothing to learn about love.",
  },
  // 7th
  {
    core: "You like each other, easily and naturally. As a couple you need warm, supportive friends and other couples around you, and honest conversation between you from early on.",
    strain: "Under strain, the less pretty side of each other can come as a disillusionment.",
  },
  // 8th
  {
    core: "For you romance is what sustains desire. You bond deeply, and you need to keep seducing each other.",
    strain: "When this is under pressure, coarseness, dismissiveness and taking each other for granted can cool it.",
  },
  // 9th
  {
    core: "Your love is kept alive by newness, such as travel, courses and exploring big questions together. Respect for each other’s beliefs is part of it.",
    strain: "Under strain, sameness can turn into boredom with each other, and trying to convert each other does not help.",
  },
  // 10th
  {
    core: "As a couple you stand for something in your community, a picture of love that restores other people’s faith in commitment. You may also work well together in the arts, counselling or design.",
    strain: "When this is under pressure, the public picture can take more of your attention than the private affection behind it.",
  },
  // 11th
  {
    core: "You need to think ahead together about what feeds your love, right down to a shared picture of old age. Planning for it is a form of affection for the two of you.",
    strain: "Under strain, you may let life just happen to you, or spread yourselves too thin socially.",
  },
  // 12th
  {
    core: "Your romantic and sexual feeling depends on renewing a shared spiritual life, with plenty of private retreat. Time away from the world is where it deepens.",
    strain: "When this is under pressure, you can escape together into television, drink or other ways of not being present.",
  },
];

/** Composite Mars by sign: desire, and how tension is handled. */
export const C_MARS_SIGN: Reading[] = [
  // Aries
  {
    core: "Your desire is direct and ardent. What you are learning is to claim each other boldly and to find that anger can be safe, and airing small annoyances quickly serves you.",
    strain: "Under strain, unspoken anger can weaken desire, and loyalty may become a sore point.",
  },
  // Taurus
  {
    core: "Your desire is earthy, accepting and generous. It thrives on simple trust in the body.",
    strain: "When this is under pressure, too much talking and thinking about sex, shame, or fantasy borrowed from the media can get in the way of real sensuality.",
  },
  // Gemini
  {
    core: "For you desire starts in the mind, with words, play, variety and no judgement. Keeping things fresh and talking freely is what it needs.",
    strain: "Under strain, tension can show up as ruts, one of you lecturing while the other listens, cutting remarks or stony silence.",
  },
  // Cancer
  {
    core: "Your desire is tender and nurturing. It needs kindness and safety, given equally in both directions.",
    strain: "When this is under pressure, tension can come out as sulking, clinging and complaints about side issues, or as one of you being babied.",
  },
  // Leo
  {
    core: "Your desire is proud, uninhibited and full of compliments. You do well to encourage each other to express it freely.",
    strain: "Under strain, either of you may feel held back, and the result can be outsized anger or hurt, followed by coldness and pettiness.",
  },
  // Virgo
  {
    core: "The aim in your physical life is to be whole, not perfect, free of shame and of pressure to perform. Praise, no unasked advice, and talking about the behaviour and not the person all help.",
    strain: "When this is under pressure, tension can show as a spreading habit of criticism and small digs.",
  },
  // Libra
  {
    core: "You bring grace and beauty to lovemaking. You do best when you negotiate your different styles with tact.",
    strain: "Under strain, tension can turn into icy formality, going through the motions, or one of you imposing preferences.",
  },
  // Scorpio
  {
    core: "Your desire is intense and revealing, and it asks for a bond of deep honesty. It helps to let each other take a breather without reading it as betrayal.",
    strain: "When this is under pressure, each of you knows where the other is tender, and tension can turn into obsessive arguments over very little.",
  },
  // Sagittarius
  {
    core: "Your desire is robust and exploratory. It works best inside limits you have both freely agreed and treat as a matter of honour.",
    strain: "Under strain, boredom in life can leak into the bedroom, and tension may show up as prudish disapproval or self-righteous, moralising rows.",
  },
  // Capricorn
  {
    core: "Keeping desire alive is long-term work for you, built on integrity, promises kept, shared projects and trust that is earned. It does best inside a firm commitment.",
    strain: "When this is under pressure, you may guess what the other wants in place of asking, and hide behind correct behaviour.",
  },
  // Aquarius
  {
    core: "Your physical life needs to be your own design, without regard for what couples are supposed to do. What suits the two of you is the measure that counts.",
    strain: "Under strain, copying the norm can feel like going through the motions, and opposing things purely out of habit serves you no better.",
  },
  // Pisces
  {
    core: "Your desire is sensitive and flowing and can feel like something beyond the two of you. It needs gentleness, since crudeness tends to switch it off.",
    strain: "When this is under pressure, you may lean on alcohol to get close, or use sex to avoid a conflict or a hard fact.",
  },
];

/** Composite Mars by house. */
export const C_MARS_HOUSE: Reading[] = [
  // 1st
  {
    core: "Disagreement is part of how you love, and anger does not need to be forbidden as long as you agree rules for it. You are at your best standing side by side against outside challenges.",
    strain: "Under strain, the two of you can end up guarding a border between you.",
  },
  // 2nd
  {
    core: "Your drive as a couple gathers around money and getting by. You do well to go after your goals together as a team, with shared aims for what you earn and build.",
    strain: "When this is under pressure, a shared fear about getting by can surface, and you may find yourselves arguing about fair shares and scarcity.",
  },
  // 3rd
  {
    core: "Your energy as a couple goes into how you talk. You need to argue fairly, in words, tone and gesture, and to keep every channel open and life interesting.",
    strain: "Under strain, sarcasm comes a little too easily to you both, and an overfull diary or plain boredom can be mistaken for being tired of each other.",
  },
  // 4th
  {
    core: "Your desire runs deep and lasts, and it needs a safe home. Home and family are where the heat between you tends to gather.",
    strain: "When this is under pressure, anger that belongs with family, such as old anger at a parent, can get aimed at each other, and if it is held in, desire may shut down.",
  },
  // 5th
  {
    core: "Your fire is released through spontaneity, sport, moving to music and things you make together. Accepting the noisy child in each of you is part of it.",
    strain: "Under strain, suppressed playfulness can turn into friction, sometimes around actual children.",
  },
  // 6th
  {
    core: "Work is where your energy as a couple gathers, and learning to say no protects both your health and the relationship. Older, plain-spoken people can show you how conflict is handled.",
    strain: "When this is under pressure, work can become a hot spot, and overwork may eat into the relationship.",
  },
  // 7th
  {
    core: "As a couple you provoke some people, and it falls to you to stand up to them together. You need frank, loyal friends, and it is worth choosing them slowly.",
    strain: "Under strain, friction with other people can take up a good deal of your energy, more so if you face it separately.",
  },
  // 8th
  {
    core: "Being lovers takes you both into deep territory, and the bond asks for courage. An early commitment to honesty and loyalty is what it needs.",
    strain: "When this is under pressure, closeness can stir up old fears and hurts in either of you, and a blazing start may burn out quickly.",
  },
  // 9th
  {
    core: "Your passion is fed by real adventure and by courage that has been tested, including the courage to say what you see. Shared risk keeps the heat between you.",
    strain: "Under strain, fear of anger can silence you, and the heat may go with it.",
  },
  // 10th
  {
    core: "You make an effective team under pressure, often standing up in public for something that matters. It is worth making sure the cause is truly yours.",
    strain: "When this is under pressure, you can attract rivals and critics, and the fight may harden into hatred.",
  },
  // 11th
  {
    core: "The force between you grows over the years. Dealing with anger as it arises is what lets your chemistry improve with age.",
    strain: "Under strain, tension that is left to pile up can turn that force into rage and eventually blow.",
  },
  // 12th
  {
    core: "You need to choose edgy experiences on purpose, and to take the risk of being honest with each other. This is where the intensity between you finds a good use.",
    strain: "When this is under pressure, you may play safe, and the intensity you avoid can turn up uninvited.",
  },
];

/** Composite Saturn by house: where the couple has to do the work. */
export const C_SATURN_HOUSE: Reading[] = [
  // 1st
  {
    core: "You carry yourselves like an older couple, and people soon treat you as long established and come to you for advice. Picturing yourselves old together steadies you.",
    strain: "Under strain, you may shrug off that seriousness and be left unsure of yourselves.",
  },
  // 2nd
  {
    core: "Your work is to build solid security slowly while keeping money in its place, and to build confidence in yourselves as a couple. This is a relationship that rewards persistence.",
    strain: "When this is under pressure, confidence in yourselves can run low, and you may give up on the relationship too cheaply or pinch the present for a distant future.",
  },
  // 3rd
  {
    core: "Your success depends on deep, patient, detailed conversation, with time set aside for it. Talking things through properly is the discipline here.",
    strain: "Under strain, silence can let a backlog of unspoken matters build until it erupts or leaves you with little left to give.",
  },
  // 4th
  {
    core: "Making a home together is your main task, and it asks for sacrifices over saving, moving, blending families and whose life changes most. It comes down to how much you both want this.",
    strain: "When this is under pressure, either of you may be unwilling to pay that price.",
  },
  // 5th
  {
    core: "You do well to practise celebration as a discipline, putting play, pleasure and sex in the diary and taking on long creative projects together. Joy is serious business for the two of you.",
    strain: "Under strain, you can become stiff, dutiful and tired, lovers lost behind your responsibilities.",
  },
  // 6th
  {
    core: "A consciously agreed, fair division of labour and promises kept are essential for you. They are what carry you through demanding times.",
    strain: "When this is under pressure, each of you may feel you are doing three quarters of the work, and resentment can set in.",
  },
  // 7th
  {
    core: "This is about the company you keep. You benefit from the guidance of a noticeably older, firmly committed couple, and the qualities you admire in them are the ones to build in yourselves.",
    strain: "Under strain, and without such examples, you may feel you are working out commitment alone.",
  },
  // 8th
  {
    core: "Trust between you is built slowly, through difficulties got through and promises kept. It asks for a wholehearted, lifelong kind of commitment.",
    strain: "When this is under pressure, a fear of commitment can surface in either of you, and one broken promise may weigh more than a hundred kept.",
  },
  // 9th
  {
    core: "You need to work out explicitly, and early, why you are together, what your ethics are, and what commitment means on matters such as forgiveness, secrets and family. Beliefs you have reached yourselves are the ones that hold.",
    strain: "Under strain, you may lean on borrowed beliefs, and basics left unagreed can weigh on you heavily.",
  },
  // 10th
  {
    core: "Your work is to show the people around you how committed love is done, which makes you something of a public example. It is a real weight, and the two of you are free to decline it.",
    strain: "When this is under pressure, being watched can feel like a burden, and you may resent a role you did not ask for.",
  },
  // 11th
  {
    core: "You need a circle of people in long relationships of their own who are on your side. The company you keep shapes how you last.",
    strain: "Under strain, drab, humourless company can pull you down, and so can friends whose break-ups set the tone.",
  },
  // 12th
  {
    core: "You mature as a couple by defending your privacy and your time alone together. That is where an understanding without words can grow.",
    strain: "When this is under pressure, you may give in to social pressure and seldom get away.",
  },
];

/** Composite Mercury, Jupiter, Uranus, Neptune and Pluto by house: one sentence each. */
export const C_OTHER_HOUSE: Record<"mercury" | "jupiter" | "uranus" | "neptune" | "pluto", string[]> = {
  mercury: [
    "You are visibly talkative and curious together, and it is worth promising each other to keep life interesting.",
    "Your confidence as a couple rests on a shared mental life, so keep talking, since doubt can creep in when you stop, and stay well informed about your finances.",
    "Talk comes easily to you, so the task is real conversation instead of chatter, and learning when to switch off.",
    "You do best in a home built around shared interests, and you may think of your beginning as a meeting of minds.",
    "Romance and fun are renewed for you by learning, games, reading and ideas enjoyed together.",
    "You share practical and communication skills that you can teach to others, and your daily duties need to be talked through instead of assumed.",
    "You benefit from fresh ideas about relating, which tend to reach you through youthful, open-minded friends who show you a way of talking to each other.",
    "It serves you to keep the lines open on the subjects that feel taboo, frightening or deeply revealing, because those are the ones most worth discussing.",
    "A shared life of the mind is close to sacred for you, so enjoy debating how each of you sees the world, because without it you may start to wonder what holds you together.",
    "You are known publicly as talkers, teachers or carriers of news, and it is worth making sure that does not slide into gossip.",
    "Your long-range goals centre on learning and keeping life interesting, and they need planning, along with care for your health and finances.",
    "Your inner growth comes through study and discussion, as long as you do not use reason to explain feelings away or to beat each other down.",
  ],
  jupiter: [
    "You are a magnetic, generous couple whom others assume to be happy, and the challenge is to live up to your own reputation.",
    "You make an effective team at earning money as long as you trust and invest in the relationship, because self-doubt can leave you poorer in every sense.",
    "You are inspiring and entertaining talkers, though clever words can also become a wall between you.",
    "You tend to do well with home and property, and your happiness deepens when you look after others and have them to stay.",
    "Fun is a serious need for you, and it is worth deliberately keeping up the shared pleasure of your early days.",
    "Make your duties as enjoyable as you can, sharing them out by who likes what more than by strict fairness, or the relationship can start to feel like hard labour.",
    "You need warm, generous friends who say out loud that they believe in the two of you.",
    "You have a rich gift for sexual and emotional bonding, and it deserves generous time and a high place among your priorities.",
    "Travel, constant learning and perhaps a shared faith keep you sure that you are together for a reason, and too much comfort is what can dull that.",
    "Together you tend to rise in standing and are suited to leading and encouraging others, so choose an aim you would be proud to reach.",
    "You are good strategists, and you do best over the long term when you get clear about your goals and keep company with people who share them.",
    "You are closer to the sacred together than apart, and even the setbacks you meet can turn out to be prompts to wake up.",
  ],
  uranus: [
    "You need to actually live differently, not just look different, questioning every unwritten rule about how a couple behaves.",
    "You need to decide for yourselves what you value and what counts as wealth, against the pressure to consume, and a sudden loss or an impulse buy can show you what really matters to you.",
    "You have an uncensored, unconventional way of talking that is your own invention, along with a tendency to blurt things out.",
    "The picture of home you inherited may not fit you, so choose your own living arrangement on purpose and stand by it.",
    "You need to find out what is actually fun for the two of you instead of what your crowd says should be.",
    "You may both be inclined to rebel against chores until things slide, so inventive answers to who does what serve you well.",
    "You need independent, even controversial friends who show you how to be yourselves inside a relationship.",
    "You have to find your own way through sexuality and jealousy, because many of the usual rules may not fit you and it is yours to work out which.",
    "You need some distance from the culture you grew up in, and a morality you have examined and truly believe.",
    "A conventional way of life is likely to feel empty to you, and you tend to become people who change things in your community.",
    "The longer you are together, the further you tend to move from where you began, in your beliefs, your friends and your direction.",
    "Your inner life has to become your own, which often means leaving behind the beliefs you were each raised with.",
  ],
  neptune: [
    "You are an adaptable, closely attuned couple who need to seek out spiritual experience on purpose instead of drifting.",
    "Money choices can get vague between you, and what really builds your confidence is taking your shared spirituality and imagination seriously and investing in them.",
    "Reaching each other through words can take effort, and your wordless, intuitive understanding is a strength to build on.",
    "Your home needs to be a sanctuary with some shared practice at its centre, and it is worth making sure you do not go without a home you really need.",
    "Your lovemaking needs a sense of deeper meaning to keep desire alive, and it is worth watching for shared habits that turn compulsive.",
    "You learn from an older couple how to keep the spirit alive in everyday routine and later pass it on, and you are drawn to helping others for its own sake.",
    "You may attract people who are lost and lean on you heavily, some of whom you will need to let go, and also visionaries, artists and healers who are vital to you.",
    "Your sexual life needs to open onto something deeper to stay alive, and distance between you is better faced than covered over with alcohol or drugs.",
    "You do well to reconcile faith and reason by exploring many traditions and visiting places that matter to you, avoiding beliefs so fixed that they numb you.",
    "As a couple you publicly stand for compassion, imagination or spiritual awareness, so it matters that you do not drift.",
    "The feeling that you belong together grows slowly, and it is helped by a circle of friends who take the inner life seriously.",
    "You are strongly attuned to each other and need quiet, almost sacred time together, without which you can start to tune each other out.",
  ],
  pluto: [
    "There is a dramatic, magnetic intensity about you, and it is at its best when you do as you please, wisely, and keep hold of some innocence.",
    "You take survival and security seriously as a couple, and what deepens you is learning to trust that the relationship can last, even if a sense of foreboding comes up at times.",
    "You have the depth to tell each other frightening truths, and that grows through gentle speech and trust built slowly, more so if either of you is wary of being blamed for what you say or notice.",
    "You feel like family to each other at a deep level, and the bond deepens through private psychological work and through faith in the idea of family.",
    "Your chemistry is strong, and it is at its best as you find an easy relationship with joy and stay together simply because you want to.",
    "You are outstanding in a crisis, and you do best with service that is meaningful and freely taken on, not duty you did not choose.",
    "You are drawn to intense, psychologically honest people who strengthen your trust in others, though it is wise not to be pulled into their troubles.",
    "You share a deep awareness of how much can be lost, and it becomes a strength through honest, bonded closeness and accepting together that life is fragile.",
    "You hunger for the plain truth and prefer to test beliefs and moral codes for yourselves before accepting what the crowd hands down.",
    "You have something uncomfortable to bring to your community’s attention, and the work is finding the nerve to be seen, which can take time.",
    "You are careful about group pressure, and trust in a supportive circle is something you build slowly and value more as the years go on.",
    "You share a deep sensitivity to loss, and it finds its place as you reach, in your own time, a spiritual way of understanding it.",
  ],
};

/** Composite lunar nodes by the sign of the SOUTH Node (the North Node is in the opposite sign): the pattern the couple can fall into, then the way forward. */
export const C_NODES_SIGN: string[] = [
  "A familiar pattern between you can be a kind of battle, in which you keep life dramatic and tiring, compete, and reduce each other to caricatures. You are growing towards calm, peace-making and real listening, where you know each other as complex people and find that love is larger than passion.",
  "You can fall easily into a simple, settled way of living that may harden into standing still and being sure you are right. You are growing towards accepting complexity and moral grey areas, and towards owning your needs for power, sex and control so that you do not pin them on each other.",
  "Your familiar pattern is quick wits and improvisation, which can leave you overstretched, clever in the moment with no long plan, and inclined to blame outside pressure. You are growing towards deciding what truly matters, helped by stepping away together each year to review your direction.",
  "The familiar pattern between you is being family, so comfortable, and so focused on looking after others, that you may avoid meeting as two adults. You are growing towards seeing each other as full grown-ups, protecting each other’s solitude, and taking what you know out into the wider community.",
  "You can slip easily into being the perfect couple, performing for an audience and letting other people’s expectations define your success. You are growing towards doing as you please and minding less what anyone thinks.",
  "A familiar pattern between you is very high standards, which can leave you both feeling inadequate, ashamed or guilty. You are growing towards letting go of the constant struggle to improve, and towards play and rest with no goal attached.",
  "Your familiar pattern is civilised politeness and pleasant surroundings in place of real contact, so that in some ways you may hardly know each other. You are growing towards passion, honest anger when it is called for and shared adventure, trusting that love does not require agreement.",
  "The familiar pattern between you is intensity, and it can bring an attachment to heaviness. You are growing towards plain comfort, a hug or a nap in place of analysis, time in nature, and the simple acceptance that life is easier with a partner.",
  "You can fall into a shared need for certainty, holding strong beliefs and quietly agreeing to ignore whatever does not fit them. You are growing towards wonder, surprise, long conversations and vigorous, respectful disagreement.",
  "A familiar pattern between you is duty without tears, in which you may go numb to pain and need while responsibilities multiply. You are growing towards letting yourselves cry and need each other, and towards building a home that is emotionally safe.",
  "Your familiar pattern can be standing outside as the ones who are right but unheard. You are growing towards being heard, which means becoming persuasive, likeable and good at building bridges, so that being right turns into being effective.",
  "The familiar pattern between you can be losing yourselves, through drifting, giving up what you need, and a spirituality that turns quietly self-absorbed. You are growing towards getting down to earth, letting small things matter, and being of practical use.",
];

/** Composite lunar nodes by the house of the SOUTH Node (the North Node is in the opposite house): where the familiar pattern plays out, then where growth lies. */
export const C_NODES_HOUSE: string[] = [
  "The familiar pattern is each of you acting alone, which can reach the point of isolation and a readiness to take separate roads. Growth lies in listening, depending on each other and committing, on the understanding that each of you holds half of what the other needs.",
  "The familiar pattern plays out around money and security, where a fear of scarcity can make the relationship doubt itself or feel like a trap. Growth lies in deep bonding and a mature, self-aware intimacy in which you really give yourselves to each other.",
  "The familiar pattern is speed, which can mean being swept along by events and talking quickly and cleverly without reaching what matters. Growth lies in stepping back to ask what you value and what it all means, and in travel undertaken for what it teaches you.",
  "The familiar pattern plays out in family life, where what the family requires can swallow who the two of you are. Growth lies in coming out into the world and offering what you have to give, even when that means moving away from familiar ground.",
  "The familiar pattern plays out around pleasure, creative life or children, with habits that can repeat and leave little room for the two of you. Growth lies in thinking ahead, setting long-term goals and getting wiser about what brings lasting joy.",
  "The familiar pattern is duty and self-sacrifice, in which your own needs can get lost under responsibilities and under helping people who would be better left to help themselves. Growth lies in withdrawing together into restful solitude and letting yourselves receive.",
  "The familiar pattern is losing yourselves in each other, which can leave a sweet couple with little sense of two separate selves. Growth lies in a healthy selfishness, in independence, and in taking the fear out of being two distinct people.",
  "The familiar pattern is a bond that runs on pressure and crisis, which can leave you braced for the worst. Growth lies in building safety you can feel, through financial security, a secure home, quiet and nature, and in regaining your confidence.",
  "The familiar pattern plays out in belief, where zeal for a cause or a creed can blind you. Growth lies in trusting what you can see and experience for yourselves, staying curious, hearing teachers who disagree, and keeping nothing off limits in conversation.",
  "The familiar pattern plays out in public, where you can end up playing a role and carrying other people’s conviction that you belong together. Growth lies in making sure the feeling is real and the choice your own, and in giving your attention to home and private emotional life.",
  "The familiar pattern is being carried along by a group and its opinions, away from your own values, and this can repeat in any new crowd. Growth lies in recovering your own desires, in play, and in making things together.",
  "The familiar pattern is retreating into an inner world, which can mean missing out on ordinary happiness and at times leaning on drink or other escapes. Growth lies in coming back to the body through exercise, meals and touch, and in routine, competence and useful work.",
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
