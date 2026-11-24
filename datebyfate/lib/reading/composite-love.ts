/**
 * Composite chart readings for a couple: Sun, Moon, Ascendant, Venus, Mars, Saturn,
 * the other planets by house, and the lunar nodes.
 *
 * Themes follow the Forrests' "Skymates, Volume Two", chs. 5–16; the wording is our own.
 *
 * Arrays by sign are in zodiac order, Aries first. Arrays by house are house 1 first.
 */

/** Composite Sun by sign: what keeps this couple alive, and what drains it. */
export const C_SUN_SIGN: string[] = [
  "What keeps the two of you alive is adventure, intensity and risks taken together, and above all the courage to say that something needs talking about. When that courage fails, it comes out as bickering, pettiness and a low, constant stress neither of you can name.",
  "You thrive on stability, peace and physical comfort: touch, long meals, music, animals, time outdoors. The risk is keeping the calm at any price, so that struggles you really need to have get quietly put away.",
  "You need a quick, varied supply of new experiences, ideas and conversation, with each of you keeping the other curious. Certainty and boredom are what wither this relationship, so keep your questions open.",
  "Your vitality depends on loving without defences and keeping your promises, until the two of you feel like home to each other and to the people you look after. If either of you hedges on commitment, the warmth and the desire slowly leak away.",
  "You come alive when you are seen: celebrating, playing, dressing up, making things together and applauding each other generously. A long stretch of nothing but practicality and thrift deadens you.",
  "You need to feel that you are growing together and being useful to the people around you. Watch that it does not turn into constant self-examination and helpful comments that wear you both out. You also need to simply enjoy what you already have.",
  "You are fed by calm, beauty, courtesy and fairness, and by the way your differences balance each other. Rudeness shakes your faith in each other, and avoiding conflict through compromises neither of you believes in only makes the eventual row bigger.",
  "You stay alive by going deep into each other’s inner lives, which takes willingness, humour and complete trust. Without those it becomes moodiness, sniping and a heaviness that drains you both, with boundaries overrun.",
  "You are on a shared search for meaning, and you need change, travel, learning and room to stretch. When you choose a settled life over that nature, you get nagging disorder, fixed opinions and tiredness.",
  "What sustains you is long-term commitment and conduct you can both be proud of, the kind that makes other people look to you as an example. Wavering over the promise you have made is what drains your energy.",
  "You have to invent your own form of relationship, outside the usual conventions, and trust that your oddities suit you. If you follow the standard script, you are left with a nagging sense that something is wrong.",
  "You need quiet time together that feeds the spirit, with music, stillness and a sense of wonder, and you need to be able to laugh at yourselves. Without it you drift into listlessness, resignation and escapism.",
];

/** Composite Sun by house. */
export const C_SUN_HOUSE: string[] = [
  "You are a couple other people notice and follow, even while you may privately wonder whether you are meant to be together. Make being together a conscious, adult choice, because whatever you model, good or bad, others tend to copy.",
  "You are building confidence in yourselves as a couple, and it helps to give yourselves concrete signs of a future, such as shared plans and shared purchases. The trap is excessive caution: hedging, holding back and endlessly making sure.",
  "You run on curiosity, conversation, short trips, learning and a fast, unpredictable life in which you improvise, and how you speak to each other matters a great deal. Predictability and silence are what flatten you.",
  "Your energy comes from home, roots, family and quiet time in a place that is entirely yours, with a sense that it will last. Give your home life priority, because when the base is neglected the two of you run down, and family matters tend to loom large.",
  "You need to keep the feeling of being in love alive: compliments, flowers, anniversaries, play and things you create together, with friends coming and going. The risk is pleasure tipping into habits and compulsions you cannot easily put down.",
  "You are fed by working side by side, by being of real use, and by learning from older couples before guiding others in turn. If you avoid meaningful work together, it tends to come back as plain, dispiriting drudgery.",
  "The attraction was strong and immediate, and what keeps you well is skill at partnership: equal weight for each person’s needs, compromise, and handling conflict. If you merge too closely, a first disagreement feels like betrayal, so keep friends you can let off steam with.",
  "With you, everything comes to the surface, and what sustains the passion is being completely honest and unguarded with each other. If old wounds are left unhealed they start to run the relationship, and you both end up emotionally exhausted.",
  "You stay alive by widening your horizons through travel, other cultures, study and a philosophy of life you work out together. The risk is shutting yourselves inside one set of beliefs until certainty goes stale.",
  "You have a public role as a couple, perhaps through shared work or something you give your community, and others take their cue from how you live. Stay aware of the example you set, because it is easy not to notice the mark you leave.",
  "Your energy comes from shared goals, a clear picture of the future, deliberate planning, and belonging to a group of like-minded people. Without a direction you settle into a comfortable limbo that never quite goes anywhere.",
  "You need a shared inner life: quiet evenings, a spiritual practice of some kind, and lovemaking treated as something sacred. When you forget this and let ordinary busyness take over, the relationship tends to feel as though it is slipping away.",
];

/** Composite Moon by sign: what the couple's heart needs, the home that suits it. */
export const C_MOON_SIGN: string[] = [
  "Your shared heart is a fighter’s: you need challenges, and something outside the relationship to push against together. With nothing to take on you push against each other, and the real danger is getting lazy.",
  "Your heart needs simple physical pleasures: nature, quiet, good food, bodily comfort, and the private animal playfulness between you. Overthinking and busyness make you ignore those plain creature needs, and you both feel the lack.",
  "The relationship should feel like one long conversation, kept fresh by new things to see and talk about. Boredom tends to arrive dressed as responsibility, and when the talking stops it is a sign that something is wrong.",
  "You felt familiar to each other almost at once, and your heart needs nesting, tenderness and a safe base to build commitment on. The risk is going quiet and closing up when you should be saying that you need touch, attention or reassurance.",
  "Your shared mood is generous and a little grand: you need to spoil each other, applaud each other, celebrate and be seen. When appreciation is held back, the spontaneity between you fades.",
  "Your heart is happiest when things are improving, and you do well with honest feedback and good outside advice. Left unchecked, discontent turns into nit-picking about chores and money and a harried feeling that disaster is close.",
  "You have an air of belonging together, two opposites that complete each other, and you are soothed by art, music and at least one beautiful room at home. Be careful not to prize agreement over really knowing each other, or to blur into one person.",
  "Intensity and honesty come naturally to you. The risk is going deeper and faster than you can manage and sinking into brooding, so you need humour, outside interests and friends who give you perspective.",
  "Your heart is a wanderer’s: you need open road, travel, learning and one long conversation about what life means. Repetition and boredom are what dull the feeling between you.",
  "Your shared heart is sober and realistic, building slowly and keeping its word. The risk is too much maturity, so learn to relax, to ask each other for reassurance, and to turn down extra duties.",
  "Your heart is a rebel’s, and you may need more time apart, separate friends or separate holidays than most couples, in a home that looks like nobody else’s. Living by conventional assumptions makes you cool, sardonic and stuck in your heads.",
  "Your heart needs quiet time alone together, with music, low light and privacy you defend firmly. Without that care the relationship simply drifts.",
];

/** Composite Moon by house. */
export const C_MOON_HOUSE: string[] = [
  "Your feelings as a couple sit on the surface where everyone can see them, and people bring you their own needs. Guard against other people’s demands crowding out what the two of you need.",
  "Your faith in the relationship can rise and fall from week to week, and you build it by taking emotional risks: showing feeling, risking embarrassment, making a nest together. If you avoid those risks, doubt about the basics keeps coming back.",
  "You attract a busy, slightly chaotic life, and its purpose is to give you plenty to talk about and to teach you to speak from the heart. When life gets dull and you have nothing to say to each other, the warmth drops.",
  "Your happiness depends on plenty of time simply at home, in a cocoon of your own with the people you count as family. Take time to understand each other’s family background, because family matters weigh heavily on you, as joy or as burden.",
  "The aim is to keep falling in love, through play, a shared creative outlet, new friends and perhaps children who remind you how to play. Settling into sensible routine is what does the damage here.",
  "Work and responsibilities multiply around you, and working together brings you closer, often in caring for someone who needs it. The risk is being swallowed by routine because neither of you can say no.",
  "Your closeness is warm and vulnerable and runs on touch and simply sleeping side by side. As a couple you also need kind, nurturing friends who reflect you back to yourselves, and you suffer if you become isolated.",
  "Feelings run strong, and jealousy, anger and possessiveness surface quickly, so things between you tend to get resolved and not left to linger. Too many crises in a row wear you down, and the remedy is forgiveness, patience and humour.",
  "You are travellers at heart and need far more change, distance and big ideas than most couples, perhaps even a life abroad. A dull, repetitive life drains the feeling out of the relationship.",
  "The mood at work comes home with you, so finding the right work, and backing each other towards it even at some cost, matters a great deal. You may also share a caring role in your community. Unhappy work, left alone, sours home life.",
  "You feel best when you are building something large together, often a home or a family, with allies who share the aim. Without goals you spread yourselves thin on socialising that tires you and gives little back.",
  "Your happiness depends on a lot of time alone together, in quiet, in meditation, or absorbed in something beautiful. Too much socialising drains you.",
];

/** Composite Ascendant by sign: how the couple comes across and approaches the world. */
export const C_RISING_SIGN: string[] = [
  "You come across as confident and plucky. That ease is earned by facing challenges side by side, as comrades.",
  "You give off a calm naturalness, and you need silence, nature, shared meals, familiar people and places, and some financial security. Status games can pull you away from that haven.",
  "You come across as lively and witty, and you need to keep life interesting through classes, new sights and good conversation. The risk is being busy without learning anything.",
  "People find the two of you motherly and your home soothing. Set limits with needy friends and relatives so that your nest is not drained.",
  "You have flair and a certain dignity as a couple. Looking and feeling impressive gives you the nerve to take creative risks and to lead, sometimes quite literally on a stage.",
  "You come across as a capable team whose skills fit together, and your sense of purpose turns on finding the right shared work or service. Without it, life fills up with thankless duties.",
  "You are gracious and good at bringing people together, and you learn about relating by watching other people and couples. Choose your company with care instead of socialising with everyone.",
  "There is a disarming intensity about you, and a dark sense of humour, that makes people tell you their secrets. You need honest, unshockable outsiders to keep your own perspective.",
  "You come across as free spirits, with an understanding between you to take chances and gather wide experience. What you are learning together is faith, and that requires risk.",
  "People see you as steady and older than your years, a couple who intend to grow old together. You grow by taking on large tasks and roles in your community, and you lose something if you avoid them.",
  "You do not quite fit in, and that is right for you. Grow a thick skin and shape the relationship your own way, even where it disappoints family.",
  "There is a dreamy, intuitive chemistry about you. Live outwardly as seekers, through prayer or meditation together, teachers and places that move you, so that you are not left passively watching life happen.",
];

/** Composite Venus by sign: how affection is kept alive. */
export const C_VENUS_SIGN: string[] = [
  "Affection between you runs on spark, cheek and shared adventure, with each backing the other’s courage. Without challenges to meet together you turn on each other, so settle arguments quickly and keep them in proportion.",
  "Your affection lives in simplicity, steadiness, touch and cosy ease, and you are good at letting small things go. The risk is avoiding even the conflicts you need, and smothering the spark in security and routine.",
  "You stay fond of each other through mental rapport, constant conversation, a varied life and encouragement of each other’s interests. Fixed ideas about each other and a failure to talk kill it as quickly as boredom does.",
  "Your affection is tender and nurturing, and it needs gentleness, a slow pace and a protected private world where confidences stay put. You can hurt each other badly, and after a few knocks you tend to shut each other out just when you most need to open up.",
  "You need to believe wholeheartedly that the two of you are something special, and to show it by celebrating, dressing up, complimenting and courting each other. Affection fades when you stop believing you are right together.",
  "You show love through responsibility, clear agreements and steady improvement, and small grievances need dealing with as they arise. The risk is criticism, and blaming each other for an emptiness that is really your own.",
  "Affection is kept alive by fair negotiation and by treating your real differences as things that complete you, helped by shared taste in art and beauty. If you only keep things nice, the differences fester until you lose faith in each other.",
  "The warmth between you depends on complete psychological honesty, a lot of time alone together, strict confidentiality and a strong sexual bond. Its shadow is jealousy, possessiveness and raw, primitive reactions.",
  "You need shared adventure and travel, and an early, explicit agreement about the rules, including exclusivity, flirting and close friendships with others. Unexamined assumptions about freedom cause trouble, and so does a stiflingly ordinary life.",
  "For you romance rests on character: integrity, promises kept in large things and small, and an apology when you fall short. The risk is too much seriousness, so loosen up and make time to play.",
  "You need to question the assumptions about love you inherited, on living together, age, children or distance, and design closeness your own way. Obeying rules you have never examined drains the pleasure from being together.",
  "Your affection needs a consciously spiritual side and private time that you protect. The risk is giving that quiet time away to outside demands.",
];

/** Composite Venus by house. */
export const C_VENUS_HOUSE: string[] = [
  "You look right together and people are drawn to you, and the task is to keep choosing to love and to go on behaving like lovers on purpose. Take care not to overdo the socialising or to lean on the happy-couple image, which lets murkier matters build up unnoticed.",
  "Your doubts about what the relationship is worth are larger than the facts justify, so gather what helps you believe in it: good advice, couples you admire, tokens such as rings. Arguments about money are really about trust, and the risk is never quite investing in each other.",
  "You speak well together, and courtesy and careful words are what protect your closeness from wearing thin. When the diplomacy fails, you can end up fighting private wars.",
  "There is a deep, lasting warmth beneath everything, and you were home-lovers from the start. A beautiful, peaceful home sets the tone for your romance, and an ugly or chaotic one sours it.",
  "You shine together, and you need to keep it feeling like a love affair, with shared creativity, pleasure, an open door for friends and, often, a welcome for children.",
  "You do well to seek out couples further along than you and learn from them humbly, then pass on what you learn to others later. Pride, the feeling that you have nothing to learn about love, is what gets in the way.",
  "You simply like each other, easily and naturally, and as a couple you need warm, supportive friends and other couples around you. Keep the conversation honest from early on, so that the less pretty side of each other does not come as a disillusionment.",
  "For you romance is what sustains desire. You bonded quickly and deeply, and you need to keep seducing each other. Coarseness, dismissiveness and taking each other for granted are what cool it.",
  "Your love is kept alive by newness, such as travel, courses and exploring big questions together, with respect for each other’s beliefs. Sameness turns into boredom with each other, and trying to convert each other does no good either.",
  "As a couple you stand for something in your community, a picture of love that restores other people’s faith in commitment. You may also work well together in the arts, counselling or design.",
  "You need to think ahead together about what feeds your love, right down to a shared picture of old age. The risk is letting life just happen to you, or spreading yourselves too thin socially.",
  "Your romantic and sexual feeling depends on renewing a shared spiritual life, with plenty of private retreat. The shadow is escaping together into television, drink or other ways of not being present.",
];

/** Composite Mars by sign: desire, and how tension is handled. */
export const C_MARS_SIGN: string[] = [
  "Your desire is direct and ardent, and what you are learning is to claim each other boldly and to find that anger can be safe. Unspoken anger weakens desire, and loyalty is a sore point, so air small annoyances quickly.",
  "Your desire is earthy, accepting and generous, and it thrives on simple trust in the body. Too much talking and thinking about sex, shame, or fantasy borrowed from the media gets in the way of real sensuality.",
  "For you desire starts in the mind, with words, play, variety and no judgement. Tension shows up as ruts, one of you lecturing while the other listens, cutting remarks or stony silence.",
  "Your desire is tender and nurturing and needs kindness and safety, given equally in both directions. Unresolved tension comes out as sulking, clinging and complaints about side issues, or as one of you being babied.",
  "Your desire is proud, uninhibited and full of compliments, and you encourage each other to express it freely. When either of you feels held back, the result is outsized anger or hurt, followed by coldness and pettiness.",
  "The aim in your physical life is to be whole, not perfect, free of shame and of pressure to perform. Tension shows as a spreading habit of criticism and small digs, and the remedy is praise, no unasked advice, and talking about the behaviour instead of the person.",
  "You bring grace and beauty to lovemaking, and you do best when you negotiate your different styles with tact. Unresolved tension turns into icy formality, going through the motions, or one of you imposing preferences.",
  "Your desire is intense and revealing, and it asks for a bond of searing honesty. Each of you knows exactly where the other is tender, so tension can turn into obsessive arguments over nothing. When one of you needs a breather, do not read it as betrayal.",
  "Your desire is robust and exploratory, and it works best inside limits you have both freely agreed and treat as a matter of honour. Boredom in life leaks into the bedroom, and tension shows up as prudish disapproval or self-righteous, moralising rows.",
  "Keeping desire alive is long-term work for you, built on integrity, promises kept, shared projects and trust that is earned, and it does best inside a firm commitment. The risk is guessing what the other wants instead of asking, and hiding behind correct behaviour.",
  "Your physical life has to be entirely your own design, without regard for what couples are supposed to do. Copying the norm feels like going through the motions, though opposing things purely out of habit is no better.",
  "Your desire is sensitive and flowing and can feel like something beyond the two of you, and crudeness kills it. Watch for leaning on alcohol to get close, or using sex to avoid a conflict or a hard fact.",
];

/** Composite Mars by house. */
export const C_MARS_HOUSE: string[] = [
  "Fighting is part of how you love, and anger does not need to be forbidden as long as you agree rules for it. You are also at your best standing side by side against outside challenges. Without that, the two of you end up guarding a border between you.",
  "Money is where your tensions gather, and behind them is a shared fear about getting by. Go after your goals together as a team, or you will find yourselves arguing about fair shares and scarcity.",
  "You need to learn to argue fairly, in words, tone and gesture, and to keep every channel open and life interesting. You are both a little too good at sarcasm, and an overfull diary or plain boredom can be mistaken for being tired of each other.",
  "Your desire runs deep and lasts, and it needs a safe home. The main trigger is family, especially old anger at a parent that gets aimed at each other, and when it is held in, desire shuts down and rage follows.",
  "Your fire is released through spontaneity, sport, moving to music and things you make together, and through accepting the noisy child in each of you. Suppressed playfulness turns into friction, sometimes around actual children.",
  "Work pressure is your hot spot, and it can wear on your health and on the relationship unless you learn to say no. Look for older, plain-spoken people who show you how conflict is handled, so that overwork does not eat the relationship.",
  "As a couple you provoke some people, and you have to stand up to them together. You need frank, loyal friends, and it is worth choosing them slowly.",
  "Being lovers stirs up old fears and wounds in both of you, and facing them is part of what you came together to do. Commit early to honesty and loyalty, or a blazing start can burn out quickly.",
  "Your passion is fed by real adventure and by courage that has been tested, including the courage to say what you see. If fear of anger silences you, the heat goes with it.",
  "You make an effective team under pressure, often standing up in public for something that matters, and that can attract rivals and critics. Take care that the cause is truly yours and that the fight does not harden into hatred.",
  "The force between you grows over the years, and it becomes either desire or rage depending on how you treat it. Deal with anger as it arises and your chemistry improves with age. Left to pile up, tension eventually blows.",
  "You need to choose edgy experiences on purpose, and to take the risk of complete honesty with each other. Playing safe does not work for you, because the intensity you avoid tends to turn up uninvited.",
];

/** Composite Saturn by house: where the couple has to do the work. */
export const C_SATURN_HOUSE: string[] = [
  "You carry yourselves like an older couple, and people soon treat you as long established and come to you for advice. Picturing yourselves old together steadies you, and shrugging off that seriousness leaves you unsure of yourselves.",
  "Your work is to build solid security slowly while keeping money in its place, and to build confidence in yourselves as a couple, which starts out low. The risks are giving up on the relationship too cheaply and pinching the present for the sake of a distant future.",
  "Your success depends on deep, patient, detailed conversation, with time set aside for it. Silence lets a backlog of unspoken matters build until it either erupts or leaves you with nothing left to give.",
  "Making a home together is your main task, and it asks for sacrifices over saving, moving, blending families and whose life changes most. It comes down to how much you want this, and the shadow is being unwilling to pay the price.",
  "You have to practise celebration as a discipline: put play, pleasure and sex in the diary, and take on long creative projects together. Otherwise you become stiff, dutiful and tired, lovers lost behind your responsibilities.",
  "A consciously agreed, fair division of labour and promises kept are essential, because they are what carry you through demanding times. Without that, each of you feels you are doing three quarters of the work, and resentment sets in.",
  "This is about the company you keep: you need guidance from a noticeably older, firmly committed couple. The qualities you admire in them are the ones you have to build in yourselves.",
  "Trust between you is forged slowly, through difficulties got through and promises kept, and you are easing each other’s fear of commitment. It asks for a wholehearted, lifelong kind of commitment, and one broken promise weighs more than a hundred kept.",
  "You need to work out explicitly, and early, why you are together, what your ethics are, and what commitment means on matters such as forgiveness, secrets and family. Borrowed beliefs will not hold, and leaving the basics unagreed puts real strain on you.",
  "Your work is to show the people around you how committed love is done, which makes you a public example whether you like it or not. It is a real weight, and the two of you are free to decline it.",
  "You need a circle of people in long relationships of their own who are on your side. Drab, humourless company pulls you down, and so do friends whose break-ups set the tone.",
  "You mature as a couple by defending your privacy and your time alone together, where an understanding without words can grow. The risk is giving in to social pressure and never getting away.",
];

/** Composite Mercury, Jupiter, Uranus, Neptune and Pluto by house: one sentence each. */
export const C_OTHER_HOUSE: Record<"mercury" | "jupiter" | "uranus" | "neptune" | "pluto", string[]> = {
  mercury: [
    "You are visibly talkative and curious together, and it is worth promising each other that life will never be boring.",
    "Your confidence as a couple rests on a shared mental life, so keep talking, since doubt creeps in when you stop, and stay well informed about your finances.",
    "Talk comes easily to you, so the task is real conversation instead of chatter, and learning when to switch off.",
    "You do best in a home built around shared interests, and you tend to remember your beginning as a meeting of minds.",
    "Romance and fun are renewed for you by learning, games, reading and ideas enjoyed together.",
    "You share practical and communication skills that you can teach to others, and your daily duties need to be talked through instead of assumed.",
    "You benefit from fresh ideas about relating, which tend to reach you through youthful, open-minded friends who show you a way of talking to each other.",
    "Keep the lines open on the subjects that are taboo, frightening or deeply revealing, because those are the ones you most need to discuss.",
    "A shared life of the mind is close to sacred for you, so enjoy debating how each of you sees the world, because without it you start to wonder what holds you together.",
    "You are known publicly as talkers, teachers or carriers of news, and it is worth making sure that never slides into gossip.",
    "Your long-range goals centre on learning and keeping life interesting, and they need planning, along with care for your health and finances.",
    "Your inner growth comes through study and discussion, as long as you do not use reason to explain feelings away or to beat each other down.",
  ],
  jupiter: [
    "You are a magnetic, generous couple whom others assume to be happy, and the challenge is to live up to your own reputation.",
    "You make an effective team at earning money as long as you trust and invest in the relationship, because self-doubt leaves you poorer in every sense.",
    "You are inspiring and entertaining talkers, though clever words can also become a wall between you.",
    "You tend to do well with home and property, and your happiness deepens when you look after others and have them to stay.",
    "Fun is a serious need for you, and it is worth deliberately keeping up the shared pleasure of your early days.",
    "Make your duties as enjoyable as you can, sharing them out by who likes what more than by strict fairness, or the relationship starts to feel like forced labour.",
    "You need warm, generous friends who say out loud that they believe in the two of you.",
    "You have a rich gift for sexual and emotional bonding, and it deserves generous time and a high place among your priorities.",
    "Travel, constant learning and perhaps a shared faith keep you sure that you are together for a reason, and too much comfort is what dulls that.",
    "Together you tend to rise in standing and are suited to leading and encouraging others, so choose an aim you would be proud to reach.",
    "You are good strategists, and you do best over the long term when you get clear about your goals and keep company with people who share them.",
    "You are closer to the sacred together than apart, and even the setbacks you meet can turn out to be prompts to wake up.",
  ],
  uranus: [
    "You need to actually live differently, not just look different, questioning every unwritten rule about how a couple behaves.",
    "You need to decide for yourselves what you value and what counts as wealth, against the pressure to consume, and a sudden loss or an impulse buy often shows you what really matters to you.",
    "You have an uncensored, unconventional way of talking that is your own invention, along with a tendency to blurt things out.",
    "The picture of home you inherited does not fit you, so choose your own living arrangement on purpose and stand by it.",
    "You need to find out what is actually fun for the two of you instead of what your crowd says should be.",
    "You are both inclined to rebel against chores until things fall apart, so you need inventive answers to who does what.",
    "You need independent, even controversial friends who show you how to be yourselves inside a relationship.",
    "You have to find your own way through sexuality and jealousy, because about half of the usual rules are wrong for you and you need to work out which half.",
    "You need some distance from the culture you grew up in, and a morality you have examined and truly believe.",
    "A conventional way of life would feel empty to you, and you tend to become people who change things in your community.",
    "The longer you are together, the further you move from where you began, in your beliefs, your friends and your direction.",
    "Your inner life has to become your own, which usually means leaving behind the beliefs you were each raised with.",
  ],
  neptune: [
    "You are an adaptable, closely attuned couple who need to seek out spiritual experience on purpose instead of drifting.",
    "Money choices can get vague between you, and what really builds your confidence is taking your shared spirituality and imagination seriously and investing in them.",
    "Reaching each other through words can be hard, but your wordless, intuitive understanding is a strength to build on.",
    "Your home needs to be a sanctuary with some shared practice at its centre, and you should take care not to go without a home you really need.",
    "Your lovemaking needs a sense of deeper meaning or desire fades, and you should watch for shared habits that turn compulsive.",
    "You learn from an older couple how to keep the spirit alive in everyday routine and later pass it on, and you are drawn to helping others for its own sake.",
    "You attract lost, draining people, some of whom you must let go, and also visionaries, artists and healers who are vital to you.",
    "Your sexual life needs to open onto something deeper or it fades, and distance between you should never be covered over with alcohol or drugs.",
    "You do well to reconcile faith and reason by exploring many traditions and visiting places that matter to you, avoiding beliefs so fixed that they numb you.",
    "As a couple you publicly stand for compassion, imagination or spiritual awareness, so it matters that you do not drift.",
    "The feeling that you belong together grows slowly, and it is helped by a circle of friends who take the inner life seriously.",
    "You are strongly attuned to each other and need quiet, almost sacred time together, without which you start to tune each other out.",
  ],
  pluto: [
    "There is a dramatic, magnetic intensity about you that can come across as overpowering, and your healing lies in learning to do as you please, wisely, and in recovering some innocence.",
    "An old fear about survival can leave a sense of foreboding that undercuts your faith in the relationship, and the healing is learning to trust that it can last.",
    "There is an old fear between you of being punished for what you say or notice, and it heals through gentle speech and slowly trusting each other with frightening truths.",
    "You feel like family to each other at a deep level, and your healing comes through private psychological work and through recovering your faith in the idea of family.",
    "Your chemistry is explosive and has something to do with pleasure long held back, and it heals as you find an easy relationship with joy and stay together simply because you want to.",
    "You are outstanding in a crisis but carry an old weight of duty you never chose, and the healing is finding service that is meaningful and freely taken on.",
    "You are drawn to intense, psychologically honest people who restore your trust in others, though you should be careful not to be pulled into their troubles.",
    "You share a deep awareness of how much can be lost, and it heals through honest, bonded closeness and accepting together that life is fragile.",
    "You hunger for the plain truth and are wary of beliefs and moral codes handed down by the crowd, having felt how they can wound.",
    "You have something uncomfortable to bring to your community’s attention, and the work is getting past a deep fear of being seen.",
    "You are wary of group pressure, having felt what a crowd can do, and that eases later on as you build trust and a supportive circle.",
    "You share a deep sensitivity to loss, and it heals as you find, in your own time, a spiritual way of understanding it.",
  ],
};

/** Composite lunar nodes by the sign of the SOUTH Node (the North Node is in the opposite sign): the pattern the couple falls into, then the way forward. */
export const C_NODES_SIGN: string[] = [
  "An old, familiar pattern between you is a kind of battle: you keep life dramatic and tiring, compete, and reduce each other to caricatures. You are growing towards calm, peace-making and real listening, where you know each other as complex people and find that love is larger than passion.",
  "You fall easily into a simple, settled way of living that can harden into standing still and being sure you are right. You are growing towards accepting complexity and moral grey areas, owning your needs for power, sex and control, and no longer pinning them on each other.",
  "Your familiar pattern is quick wits and improvisation: always overstretched, clever in the moment with no long plan, and blaming outside pressure. You are growing towards deciding what truly matters, helped by stepping away together each year to review your direction.",
  "The old pattern between you is being family: so comfortable, and so focused on looking after others, that you avoid meeting as two adults. You are growing towards seeing each other as full grown-ups, protecting each other’s solitude, and taking what you know out into the wider community.",
  "You slip easily into being the perfect couple, performing for an audience and letting other people’s expectations define your success. You are growing towards doing as you please and no longer minding what anyone thinks.",
  "An old, familiar pattern between you is impossible standards, which leave you both feeling inadequate, ashamed or guilty. You are growing towards letting go of the constant struggle to improve, and towards play and rest with no goal attached.",
  "Your familiar pattern is civilised politeness and pleasant surroundings in place of real contact, so that in some ways you hardly know each other. You are growing towards passion, honest anger when it is called for and shared adventure, trusting that love does not require agreement.",
  "The old pattern between you is intensity shared through hard times, and with it an attachment to heaviness. You are growing towards plain comfort, a hug or a nap in place of analysis, time in nature, and the simple acceptance that life is easier with a partner.",
  "You fall into a shared need for certainty, holding strong beliefs and quietly agreeing to ignore whatever does not fit them. You are growing towards wonder, surprise, long conversations and vigorous, respectful disagreement.",
  "An old, familiar pattern between you is duty without tears: going numb to pain and need while responsibilities multiply. You are growing towards letting yourselves cry and need each other, and towards building a home that is emotionally safe.",
  "Your familiar pattern is standing outside as the ones who are right but unheard. You are growing towards being heard: becoming persuasive, likeable and good at building bridges, so that being right turns into being effective.",
  "The old pattern between you is losing yourselves: drifting, giving up what you need, and a spirituality that is quietly self-absorbed. You are growing towards getting down to earth, letting small things matter, and being of practical use.",
];

/** Composite lunar nodes by the house of the SOUTH Node (the North Node is in the opposite house): where the old pattern plays out, then where growth lies. */
export const C_NODES_HOUSE: string[] = [
  "The old pattern is each of you acting alone, self-sufficient to the point of isolation and ready to take separate roads. Growth lies in listening, depending on each other and committing, on the understanding that each of you holds half of what the other needs.",
  "The old pattern plays out around money and security, where a fear of scarcity makes the relationship doubt itself or feel like a trap. Growth lies in deep bonding and a mature, self-aware intimacy in which you really give yourselves to each other.",
  "The old pattern is speed: being swept along by events and talking quickly and cleverly without ever reaching what matters. Growth lies in stepping back to ask what you value and what it all means, and in travel undertaken for what it teaches you.",
  "The old pattern plays out in family life, where what the family requires swallows who the two of you are. Growth lies in coming out into the world and offering what you have to give, even when that means moving away from familiar ground.",
  "The old pattern plays out around pleasure, creative life or children, with compulsions that repeat and leave little room for the two of you. Growth lies in thinking ahead, setting long-term goals and getting wiser about what brings lasting joy.",
  "The old pattern is duty and self-sacrifice, with your own needs lost under responsibilities and under helping people who would be better left to help themselves. Growth lies in withdrawing together into restful solitude and letting yourselves receive.",
  "The old pattern is losing yourselves in each other and becoming a sweet couple with no separate selves. Growth lies in a healthy selfishness, in independence, and in taking the fear out of being two distinct people.",
  "The old pattern is a bond formed under pressure and crisis, which leaves you braced for the worst. Growth lies in building safety you can feel, through financial security, a secure home, quiet and nature, and in regaining your confidence.",
  "The old pattern plays out in belief, where zeal for a cause or a creed blinds you. Growth lies in trusting only what you can see and experience for yourselves, staying curious, hearing teachers who disagree, and keeping nothing off limits in conversation.",
  "The old pattern plays out in public, where you play a role and carry other people’s conviction that you belong together. Growth lies in making sure the feeling is real and the choice your own, and in giving your attention to home and private emotional life.",
  "The old pattern is being carried along by a group and its opinions, away from your own values, and this can repeat in any new crowd. Growth lies in recovering your own desires, in play, and in making things together.",
  "The old pattern is retreating into an inner world marked by sadness, missing out on ordinary happiness and at times leaning on drink or other escapes. Growth lies in coming back to the body through exercise, meals and touch, and in routine, competence and useful work.",
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
