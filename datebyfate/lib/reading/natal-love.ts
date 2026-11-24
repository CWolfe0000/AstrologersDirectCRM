/**
 * Natal love texts: the Sun, Moon, rising sign, Venus and Mars by sign, and
 * the planets in houses 4 to 8.
 *
 * Themes follow the Forrests' "Skymates, Volume 1", chs. 4–11; the wording is
 * our own.
 *
 * Arrays of twelve are in zodiac order, Aries first.
 */

/** The Sun in each sign, in love: what you need, and the shadow. */
export const SUN_LOVE: string[] = [
  // Aries
  "You need a partner with enough nerve to meet you head on, and you would rather hear a blunt truth than a polite evasion. When love goes sleepy you stir things up, and the risk is picking fights over nothing that leave mistrust behind.",
  // Taurus
  "You love for the long term and are not taken in by glamour. Touch and tangible signs of affection matter to you, and your persistence carries a relationship through hard patches. The risk is mistaking security for contentment and becoming stubborn or bored.",
  // Gemini
  "You need stimulation, and routine drains you. You can commit fully to one person if you are free to keep lively friendships and your partner helps build a life of variety and learning. Without that you grow scattered and stay on the surface.",
  // Cancer
  "You guard yourself carefully, because once someone is let in you are fully exposed. A partner has to prove they are gentle, honest and committed before they see the real you. The risk is staying behind your guard, or giving care in place of closeness.",
  // Leo
  "Courtship comes naturally to you, with play, praise, romance and open-hearted attention. You stay in love when appreciation keeps flowing both ways, so a relationship gone stale needs courting again. Feeling unappreciated, you withdraw into pride or perform to please.",
  // Virgo
  "You value realism, competence and a partner who can hear criticism and actually change. Love has to keep improving for you, and you hold back until someone has proved trustworthy. The risk is nagging that wears down joy, or self-doubt that lets you put up with a selfish partner.",
  // Libra
  "Partnership is where you feel most alive, and you need the give and take of a real equal. The risk is losing your own centre and revolving around the other person, arguing about small questions of fairness while the real problem goes unsaid.",
  // Scorpio
  "You need regular, honest emotional depth with a partner, and physical closeness without it leaves you unsatisfied. When that depth is missing you brood, turn moody, or use the truth to wound.",
  // Sagittarius
  "Freedom is a real need for you, so you do best with a partner who has their own interests and friends, welcomes change and is not jealous. Every relationship has dull stretches and the depth lies beyond them. Leaving at the first one keeps your connections shallow.",
  // Capricorn
  "Committing is easy for you. The harder part is showing what you feel and asking for what you want, without which love becomes dutiful routine. You value a dependable partner with some sparkle, and the risk is becoming the parent in the relationship and enduring it out of honour.",
  // Aquarius
  "You question every rule about how a relationship should look and prefer to design your own. Respect for each person’s individuality is the heart of it for you. The risk is rebelling over small things, or detaching so far that you seem cold.",
  // Pisces
  "You are deeply tender, and a relationship lasts for you only when there is real contact between two inner lives, which often happens in shared quiet. Time in nature and calm evenings together feed it. The risk is escaping into whatever is pleasant when things get hard.",
];

/** The Moon in each sign: what must be fed for your heart to trust. */
export const MOON_LOVE: string[] = [
  // Aries
  "Your heart trusts someone who can take your fire, and letting a partner see your anger is a sign you feel safe. You are instinctively loyal. Starved of adventure you become touchy and competitive, and home life turns into one crisis after another.",
  // Taurus
  "Your heart is fed by touch, physical comfort and quiet time together, and once you trust someone you are at ease in your body with them. Animals, plants and nature at home steady you. You avoid conflict, so resentment builds up and comes out later all at once.",
  // Gemini
  "Talk is what makes you feel connected, including light banter, and fresh shared experiences keep the bond alive. When life becomes routine you get restless and vaguely dissatisfied, and you fill the gap with chatter.",
  // Cancer
  "Your tender core is well hidden and takes a long time to reach. You nurture naturally and need a warm, enclosing home. Caretaking is not the same as closeness, though, and choosing people who need looking after but cannot give back is a way of staying protected.",
  // Leo
  "Your heart needs applause, though it is shy about asking. You trust a partner who encourages you and visibly enjoys what you create, whether that is a meal or a new look, and you want a home you can be proud of. Without that attention you sulk and pull away.",
  // Virgo
  "You trust someone you can talk freely with, and when you feel safe you share your self-doubts. Your restlessness can become steady, practical support and a life built with care, or it can turn into petty worry. You run a tight home and need reminding it is also for rest.",
  // Libra
  "Your heart needs courtesy, gentleness and pleasant surroundings, and crude remarks put you off. You make a calm, beautiful home. The risk is smoothing things over so thoroughly that you lose track of your own needs behind agreeable sweetness.",
  // Scorpio
  "Your heart needs honesty that keeps deepening, and without it every relationship feels thin. You withdraw at times to process, and need a partner who respects that and is fully present when you return. Left unfed, the need shows as simmering moods and outbursts over small things.",
  // Sagittarius
  "Part of you needs not to need anyone, so you tend to idealise a partner and keep your distance at the same time. Staying practically self-sufficient helps, because commitment then remains a choice. You want a colourful, unconventional home life.",
  // Capricorn
  "You need time alone and big projects of your own, and a partner who is not hurt at being loved without being strictly needed. Deep down you assume everyone is alone, so sharing takes practice or your partner feels shut out. Under stress, caution turns into control of money, home and partner.",
  // Aquarius
  "Your heart needs breathing room, and short separations do you good. You commit best once you know who you are apart from others’ expectations, with a partner whose own expectations are unconventional. Before that, closeness feels stifling and you come across as cold.",
  // Pisces
  "Your heart wants a merging of spirits, in quiet moments and in sex, and home must feel like a sanctuary. The risk is drifting into self-sacrifice and going through the motions. You need to ask for what you want, and a harsh or jangling partner sends you into daydreams.",
];

/** The rising sign: how you come across and approach someone. */
export const RISING_LOVE: string[] = [
  // Aries
  "You come across as direct and challenging, which can alarm people before they know you. Stay forthright, and let a new partner see early that you are less dangerous than you look.",
  // Taurus
  "You come across as natural, honest and at ease in your body, so people feel familiar with you quickly. The other side is that you can settle into comfort and dig in when a relationship needs you to move.",
  // Gemini
  "You come across as quick, alert and cheerful, and that surface hides how much you feel. Partners can underestimate your depth. Short, plain statements from the heart, followed by silence, serve you better than more words.",
  // Cancer
  "You are cautious at first and study a person carefully before letting them close. Getting past your guard is the hard part. Once someone has passed, your care arrives in full.",
  // Leo
  "You come across as proud and self-contained, as if you need nothing. Behind that is a real hunger for appreciation. Praise opens you up, and without it you become distant and unreachable.",
  // Virgo
  "You come across as competent, precise and talkative, and people ask for your help early. The challenge is getting beneath the detail to what you feel. When insecure you do things for a partner in place of opening up, and you need support for your work.",
  // Libra
  "You come across as agreeable and attractive, with a gift for building rapport and reducing friction. Relationships play a large part in your life. Because you seem so in tune, others can overestimate how much you really have in common.",
  // Scorpio
  "You come across as intense and penetrating, which some find intimidating. You need a real meeting of inner lives and a partner in growth, or feeling fades. You can fall into dramatic involvements with intense people and then not know what to do next.",
  // Sagittarius
  "You come across as expansive, funny and generous, and that draws romantic attention. You need novelty. You do not avoid commitment as such, only commitments that feel like confinement.",
  // Capricorn
  "You come across as cautious, shrewd and hard to read. Love requires you to let someone see what is behind the composed face. Until you do, a partner cannot tell how you feel.",
  // Aquarius
  "You come across as friendly but cool at close quarters. Long pressure to fit in may have taught you to present a normal version of yourself, which leaves partners feeling you are not fully there. You do best with someone who welcomes your unusual side.",
  // Pisces
  "You fit into almost any setting and adapt to whoever you are with. In love, watch that you do not take on a partner’s expectations and style. A sign of that is your quiet time, reflection and creative life shrinking.",
];

/** Venus in each sign: what warms you, what you need in a partner, how you attract, what puts you off. */
export const VENUS_LOVE: string[] = [
  // Aries
  "You warm to independence, directness and spirit, and you attract by being bold and setting a challenge. You need a relationship where strong feelings, pleasant or not, can be said aloud. Closeness dulled by unspoken anger puts you off.",
  // Taurus
  "You warm to earthy people who are comfortable in their bodies and outdoors, and you attract through physical ease and soothing company. You want a lasting relationship that keeps you calm and simple. Emotional theatrics put you off.",
  // Gemini
  "You warm to curious people with many interests, and you attract through conversation, stories and flirting. You need a relationship that keeps your mind open and never bores you. Dullness and fixed, judging attitudes put you off.",
  // Cancer
  "You attract by being tender, protective and a safe place to come home to. You need a gentle partner and a relationship that is safe and lasting, and you open only after gentleness has been proved over time. Then you also enjoy an imaginative, fanciful side in a partner.",
  // Leo
  "You warm to presence and charisma, and you attract with generosity, humour and grand gestures. You need a spontaneous relationship in which each of you can count on the other’s approval and both get to shine. Feeling judged or rejected chills you.",
  // Virgo
  "You warm to people devoted to their work or craft and serious about growing, with wit and discernment. You attract by being honest, attentive to detail and practically helpful. A relationship that has stalled, with no will to improve it, puts you off.",
  // Libra
  "You warm to creative, warm, tactful people, and you attract through social grace, fairness and a love of beauty. You need courtesy and close attention to each other’s feelings, and crudeness puts you off. The risk is protecting the appearance of harmony at any cost.",
  // Scorpio
  "You warm to people who can be completely honest and do not run from emotional depth. You attract through intensity, privacy and an undercurrent of sexuality. You need room to be fully human together without judgement, and deception or shallowness destroys your trust.",
  // Sagittarius
  "You warm to easygoing, tolerant, funny, principled people with an appetite for experience. You attract by offering adventure, ideas and interesting friends. You need a relationship that widens your view and adds colour, and restriction, boredom or settling for less puts you off.",
  // Capricorn
  "You warm to responsible, self-contained, practical people, and you attract through reserve and quiet depth. You are not afraid of commitment and want a grown-up relationship built on integrity, with time alone. Immaturity and heavy dependence put you off.",
  // Aquarius
  "You warm to free-spirited, non-possessive people who break rules, and you attract through originality, honesty and letting others be themselves. You need a lot of space and give it too, sometimes to the point of seeming detached. Being used without being seen puts you off.",
  // Pisces
  "You warm to visionary, otherworldly people, and you attract as a dreamer or poet who offers a refuge from everyday life. You need a relationship that joins the sexual and the spiritual. Harsh light and hard questioning drive you away.",
];

/** Mars in each sign: what you desire, how you pursue, how you fight, the fear underneath. */
export const MARS_LOVE: string[] = [
  // Aries
  "You desire openly and pursue directly, enjoying the chase and a contest for someone’s heart, and you are very protective. In conflict you say it straight. Challenges you choose and can win give you energy, and constant defeat drains you, with old anger still to settle underneath.",
  // Taurus
  "You want sensual pleasure without shame, and you pursue by offering comfort through food, touch and time outdoors. You are determined and hard to shift once you have decided. Ignoring your instincts and staying indoors too long drains you, and the fear underneath is shame about the body.",
  // Gemini
  "You want variety and a lively exchange of ideas, and you pursue with wit, messages, stories and new things to do together. You argue with words and questions and enjoy a debate. Boredom, certainty and prejudice drain you.",
  // Cancer
  "You want a safe setting for real bonding, and you pursue by showing how well cared for someone would be, privately hoping for the same. You defend your home fiercely. Underneath is a fear that desire will get out of control and cause pain. Intrusion, or being used as a caretaker, drains you.",
  // Leo
  "You express desire with warmth, confidence and pride, and you pursue with loyal, generous, well-staged romance. Play, humour, praise and leading in something that matters give you energy. Constant negativity drains you, and the fear underneath is being shamed for showing what you want.",
  // Virgo
  "You show desire by being useful, and you pursue by proving how much you can help, treating the relationship as a craft to perfect. In conflict your help can land as scrutiny or criticism. Underneath is an old guilt about love or sex that drives you to keep earning your place.",
  // Libra
  "You pursue as the understanding, romantic peacemaker, wanting to close the distance that unspoken anger creates. Once you engage, honest conflict about real differences gives you energy. Isolation, pointless quarrelling and unfairness drain you, and the fear underneath is conflict that turns dangerous.",
  // Scorpio
  "You want a relationship of relentless honesty that changes you both, and you pursue with intensity and probing conversation. Passion and deep closeness give you energy. Shallowness and having to show only a fraction of yourself drain you, and the fear underneath is being deceived.",
  // Sagittarius
  "You want excitement and variety and you also want to act ethically, and the two pull against each other until you make a high-minded commitment freely. You pursue by offering adventure and impress with your ideals. Confinement, routine and unethical situations drain you.",
  // Capricorn
  "You show desire through responsible action more than display, and you pursue strategically, with practical reasons why you are a good choice. You want to protect and provide. Long-term projects and some solitude give you energy, and the fear underneath is failing the person you love.",
  // Aquarius
  "You want to be freely, even rebelliously, yourself in desire, and you pursue as the original thinker who offers honesty and room to breathe. Freedom of thought and speech gives you energy. Restriction, convention and petty control drain you, and the fear underneath is living by someone else’s rules.",
  // Pisces
  "You want erotic and spiritual passion joined together, and you pursue gently, with imagination and poetry, hoping to reach someone’s inner life. Your task is finding the strength to surrender. A lack of dreaming time, harshness and unkindness drain you.",
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
      string
    >;
  }
> = {
  4: {
    meaning:
      "The fourth house is about home, roots and family. It comes alive when you share a roof, money and daily routine with someone, and it shows what home must be for you and which family patterns you might repeat.",
    empty:
      "No planets here does not mean home matters less to you, only that your chart describes what you need at home through other placements.",
    planets: {
      sun: "Privacy, quiet and time to reflect feed your vitality, and you can commit deeply to home and family. You need someone who respects silence and will put down roots with you, and intrusiveness weakens your trust.",
      moon: "You need solitude, deep roots and a warm home built on long, familiar bonds, and without downtime you grow vague and unavailable. You need an emotionally available partner at home, and coldness shuts you down.",
      mercury:
        "You want a home full of ideas and conversation, perhaps because your early family was stifling or silencing. You need someone curious, talkative and energetic to live with, and a closed mind or no response wears you down.",
      venus:
        "You trust slowly and need privacy with a partner and a beautiful, peaceful home. The way your family related, including any false pleasantness, shapes how you love and is worth examining. You need someone gracious and good at relating, and boorishness puts you off.",
      mars: "You are resilient and fiercely protective of home, and your risk is holding anger in silence until it explodes. You need a strong, loyal, adventurous partner who can take some heat, and cowardice loses your respect.",
      jupiter:
        "You want a generous, open, plentiful home, perhaps in reaction to scarcity or strictness early on. You need someone optimistic, humorous and free of pettiness to share it, and constant negativity weakens the bond.",
      saturn:
        "You take the commitments of a shared home seriously, though early experience makes you wary of being that exposed. You need a reliable, mature, competent partner, and immaturity, wishful thinking and self-indulgence weaken your trust.",
      uranus:
        "You need a home that supports your individuality, and you may never have fitted your family’s mould. You need an independent partner unmoved by social pressure, and a domineering, dull or blindly conventional one stifles you.",
      neptune:
        "You need a home that shelters your sensitivity and inner life, since noise and bad moods unsettle you easily. You need a sensitive partner open to the spiritual side of life, and a rigidly literal one who dismisses your quiet states weakens your trust.",
      pluto:
        "You need a home where strong feelings and complete honesty are welcome, often against the background of a family wound, and you brood if home life stays superficial. You need an intense, honest partner willing to look deeply at you both, and dishonesty breaks your trust.",
      node: "You are growing toward making a real home and private life, after a habit of putting your public role first. Giving home priority feels awkward to you, and it is the right direction.",
      southnode:
        "Family and clan shaped you strongly, and it is an old, familiar pattern to replay your family’s ways in your own relationships and home. Looking at those patterns honestly is what frees you from repeating them.",
    },
  },
  5: {
    meaning:
      "The fifth house is about falling in love, play and enjoyment. It shows what has to be present at the start for a relationship to have a chance, and what renews a long one.",
    empty:
      "No planets here means romance and play are not a main emphasis of your chart, though the need to enjoy each other still applies to you.",
    planets: {
      sun: "You need to be seen, and play and creative self-expression soften you. To start or renew a relationship you need shared play and taking turns as each other’s audience. Being judged for wanting attention kills the feeling, and be wary of people who need to dominate you.",
      moon: "You heal by being heard, having a good time and caring for others, and without joy you make up for it with excess. To start or renew love you need imagination, tenderness and shared feelings. Insensitivity kills it, and be wary of bonds built on dependence.",
      mercury:
        "You need your voice heard, and for you love is a conversation that can run late into the night for years. To start or renew it you need wit and shared interests. Silence and lack of curiosity kill the feeling, and be wary of people who hide their heart behind clever talk.",
      venus:
        "You are renewed by style, sensuality and making beautiful things, and drawn to charming, creative people. To start or renew love you need grace and care in how each of you presents yourself. Crudeness kills the feeling, and be wary of charm that looks perfect and has a tangled history.",
      mars: "You have a strong need to release energy through play, sport and sex, along with a fear of letting it out after a habit of restraint. To start or renew love you need heat, intensity and physical activity. Passivity and timidity kill the feeling, and be wary of people carrying unresolved anger.",
      jupiter:
        "You want relationships that make life larger and restore your faith in pleasure. To start or renew love you need an open, questing spirit and a sense of fun. Pettiness and prudishness kill the feeling, and be wary of people who promise more than they can deliver.",
      saturn:
        "You take quiet satisfaction in achievement more than wild fun, and you do not give your heart quickly. To start or renew love you need maturity and respect for your serious side. Irresponsibility and constant silliness kill the feeling, and you may say too little about what you feel.",
      uranus:
        "You want to be treated as one of a kind, never by formula, and you are drawn to free spirits. To start or renew love you need freedom and the unexpected. Conformity and worry about others’ opinions kill the feeling, and be wary of people committed only to their own independence.",
      neptune:
        "Romance for you carries a longing that is hard to name, and you are drawn to gentle, soulful people and wordless connection. To start or renew love you need mystery and a sense of magic. Cold practicality kills the feeling, and be wary of needy, escapist people who drain you.",
      pluto:
        "Something once hurt your ability to relax and trust, and deep, honest self-expression is the cure. To start or renew love you need passion, depth and honesty. Emotional dishonesty kills the feeling, and be wary of people who analyse you but cannot take insight in return.",
      node: "You are growing toward play, courtship and spontaneous self-expression, which do not come easily after a habit of being serious and strategic. Being less calculating and letting yourself enjoy new connections is the right direction.",
      southnode:
        "Romance, pleasure and creativity are old, familiar ground for you, and you can fall back on staying in the early, exciting stage. It helps to think constructively about where a relationship could go next.",
    },
  },
  6: {
    meaning:
      "The sixth house is about humility and responsibility in love, which means seeing your own part in your relationship troubles and accepting that neither you nor a partner is perfect. It also describes the role models who can teach you how to love well.",
    empty:
      "No planets here means this house is not a main emphasis of your chart, though honesty about your own part still matters in any relationship.",
    planets: {
      sun: "You tend to hide your heart behind duty and being supportive, which breeds hidden anger and a quiet sense of superiority. Learn from colourful people who take up space, and who show that you have a right to ask and to be seen as you are.",
      moon: "You fear being seen without defences, so you show love mainly through tasks and can slip into serving. Learn from warm, emotionally available people who show that closeness also comes through vulnerability, eye contact and touch.",
      mercury:
        "Your verbal skill and good arguments can block real two-way connection, and intimate conversation is something you need help with. Learn from good storytellers who are even better listeners and who draw others out.",
      venus:
        "Lasting romantic love is a craft you have not fully learned yet. Learn from gracious, magnetic people who know how to keep attraction alive and how to raise hard subjects with tact.",
      mars: "You tend to hide your fiercer side. Learn from passionate, direct people who show how to release anger cleanly, state sexual needs frankly and accept that you are allowed to be difficult.",
      jupiter:
        "You are attached to modesty and settle for too little in love. Learn from confident, generous people whose faith in you is catching and who leave everyone around them feeling better about themselves.",
      saturn:
        "You can lose yourself in thankless duty and call it virtue. Learn from serious, accomplished people who put their discipline behind something they believe in, not behind dutifulness for its own sake.",
      uranus:
        "Your unconventional side gets far less room than it deserves. Learn from original thinkers and risk-takers who refused to compromise who they are and came through intact.",
      neptune:
        "You are highly sensitive, and that sensitivity can hurt you if it is not well managed. Learn from wise, imaginative, quietly spiritual people who can help you steady and train it.",
      pluto:
        "Your natural intensity shows too little on the outside, often because you were once shamed for it. Learn from deep, truthful people who look at you directly and make that way of being acceptable.",
      node: "You are growing toward service, practical care and guiding others, after a habit of standing apart that risks self-absorption. Being useful to the people you love is the right direction.",
      southnode:
        "Deferring to teachers and authorities is an old, familiar pattern for you. In love you can stop looking to someone else for the answers and trust your own judgement.",
    },
  },
  7: {
    meaning:
      "The seventh house is about commitment, trust and seeing a partner as a separate person. You are drawn to people who show its qualities, and they are best taken as examples of traits you can develop yourself, not as suppliers of what you lack.",
    empty:
      "No planets here does not mean partnership is absent or unimportant, only that your chart describes what you need in commitment through other placements.",
    planets: {
      sun: "A few close relationships shape your life, and mutual exchange feeds your vitality. To commit you need full reciprocity with someone secure in themselves who can negotiate, and you need to state your own needs. Instability, evasiveness and attempts to dominate you weaken your trust.",
      moon: "You thrive in a close, mutually caring partnership and are loyal in it. To commit you need tenderness and room for all feelings, not only the acceptable ones. Having your feelings dismissed weakens your trust, and the risk is letting a partner’s needs eclipse your own direction.",
      mercury:
        "You need lively conversation in every close bond. To commit you need real mental rapport and a partner who is curious and still learning. Boredom and not feeling heard weaken your trust, so keep listening freshly and never assume you know what they will say.",
      venus:
        "You want a relationship marked by grace and warm mutual respect. To commit you need courtesy and good intentions on both sides, and nastiness or insensitivity weakens your trust. Seeking a dazzling partner to supply charm you think you lack leaves you insecure, so develop it in yourself.",
      mars: "You are learning how to fight well, bringing real conflicts into the open where they can be resolved or accepted. You are blunt and very loyal, and you stir things up if passion fades. To commit you need courage and energy in both of you, and fearfulness, passivity and mere niceness weaken your trust.",
      jupiter:
        "You are generous and supportive, and a relationship feels alive to you when it is moving toward an ideal. To commit you need a sense of possibility and a partner who believes in you. Narrow-mindedness, petty criticism and poor ethics weaken your trust, and your own idealism can turn critical.",
      saturn:
        "You take a vow with full seriousness and are capable of sober, honourable commitment. Learning to trust is your central task, so you need a fully adult partner with integrity and realism. Immaturity, neediness and irresponsibility weaken your trust, and a serious letdown left unaddressed can close your heart.",
      uranus:
        "You need more space and freedom in partnership than most, and conventional closeness can feel confining. To commit you need a shared resolve to choose each other and your way of living without bowing to social pressure. Possessiveness, control and concern for outside opinion weaken your trust.",
      neptune:
        "You want a relationship with a spiritual basis and near-wordless closeness. To commit you need an inner life in both of you alongside practical competence. Lack of compassion weakens your trust, and the risk is falling for someone’s lovely qualities while missing serious flaws, so check the practical facts first.",
      pluto:
        "Trust is hard for you, often after betrayal or heartbreak, and facing those wounds honestly is what lets closeness work. To commit you need intensity, gut-level honesty and a partner unafraid of difficult feelings. Avoidance weakens your trust, and you also need to give a proven partner the benefit of the doubt.",
      node: "You are growing toward real partnership between equals, which feels strange after a habit of carrying responsibility alone. It takes patience from you and from a partner, and it is the right direction for you.",
      southnode:
        "Relationship is old, familiar ground and you have real skill in it. The pattern you fall back on is putting the other person’s needs first, seeking agreement when none is needed and revolving around a partner’s problems.",
    },
  },
  8: {
    meaning:
      "The eighth house is about sexual bonding and the deeper instinctive attachment that separates a mate from a good friend. It shows the qualities a partner needs for that bond to last, and the old hurts that closeness brings up.",
    empty:
      "No planets here does not mean a lack of passion or depth, only that your chart describes what you need in close bonding through other placements.",
    planets: {
      sun: "You are here to be changed by a relationship of complete honesty, with rough edges shown and met with compassion. You need intensity in a partner and a willingness to face the difficult side of you both. Avoidance, denial and shallowness end your desire.",
      moon: "You want a bond that feels like home and joins everyday familiarity with desire. You need sensitivity and wholehearted, exclusive commitment in a partner. Someone who refuses to grow up loses your interest, however attractive they are.",
      mercury:
        "You need to speak your feelings and be truly listened to, perhaps after a relationship that bored or silenced you. You need an intelligent, curious partner willing to talk, listen and learn from you. Emotional silence and rigid thinking end your desire.",
      venus:
        "You want grace and dignity in physical love, and for you courtship should continue for as long as the relationship does. Shared enjoyment of art comforts you both. You need a graceful partner, and crassness or vulgarity ends your desire.",
      mars: "You want passion without shame, and keeping it means dealing with anger promptly and honestly, including old anger that has nothing to do with your partner. You need courage, passion and loyalty in a partner. Careful, word-mincing niceness ends your desire.",
      jupiter:
        "You are recovering your belief in love and your willingness to commit and let go, perhaps after settling for a dutiful arrangement. You need a big-spirited, generous partner who judges kindly. Meanness, control and shaming end your desire.",
      saturn:
        "You are recovering the ability to trust after loss, betrayal or abandonment, and you may carry a fear that love ends badly. You need a patient partner of integrity who keeps promises. Immaturity and self-indulgence end your desire, and the risk is isolating yourself or choosing people who confirm the fear.",
      uranus:
        "You need freedom and individuality inside commitment, and the sense that you chose this bond yourself. You need a partner who respects your autonomy, tolerates difference and gives you space. Insecurity, control and possessiveness end your desire.",
      neptune:
        "You want sex to include real contact between two inner lives, and without it excitement does not last. Eye contact matters greatly to you. You need a sensitive partner who brings tenderness to physical love, and a purely physical, materialistic view of sex ends your desire.",
      pluto:
        "You carry a deep hurt that shows in your intimate life, often as anger outside and sadness inside, and you heal by working through it with a partner. You need honest, undefensive self-examination in both of you. Shallowness, denial and fear of difficult feelings end your desire.",
      node: "You are growing toward emotional and sexual depth, which feels unfamiliar and frightening after a habit of concentrating on security and practical survival. Be kind to yourself about that, and keep going, because depth is what you need.",
      southnode:
        "Intensity and crisis are old, familiar ground for you, and you can fall back on drama. You know that territory well and no longer grow there. Work through what truly needs it, and otherwise aim for stability and ordinary comfort.",
    },
  },
};

/** The idea of the arc of intimacy: houses 4 to 8 as a sequence. */
export const ARC_OF_INTIMACY: string =
  "Houses four to eight describe the stages of building a relationship, from making a home and falling in love, through taking responsibility and committing, to bonding deeply. Each stage rests on the one before, and a stage that is skipped tends to bring the same frustrations back.";
