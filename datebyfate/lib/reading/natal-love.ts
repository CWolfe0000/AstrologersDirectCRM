/**
 * Natal love texts: the Sun, Moon, rising sign, Venus and Mars by sign, and
 * the planets in houses 4 to 8.
 *
 * Every reading has two forms. `core` says what the placement is and needs,
 * and holds for everyone who has it. `strain` is the difficult form it can
 * take. A placement alone does not justify asserting a difficulty, so the app
 * shows `strain` as written only when the planet is under hard aspect, and
 * softens it otherwise. `strain` is therefore conditional, describes a
 * tendency and not a history, and starts "Under strain," or "When this is
 * under pressure,".
 *
 * Themes follow the Forrests' "Skymates, Volume 1", chs. 4–11; the wording is
 * our own.
 *
 * Arrays of twelve are in zodiac order, Aries first.
 */

export interface Reading {
  /** What the placement is and needs, whatever its aspects. */
  core: string;
  /** The difficult form it can take; shown as written only when the planet is under hard aspect. Starts "Under strain," or "When this is under pressure,". */
  strain: string;
}

/** The Sun in each sign, in love: what feeds you, and the form it takes under strain. */
export const SUN_LOVE: Reading[] = [
  // Aries
  {
    core: "You feel most alive with a partner who meets you with full energy and says what they mean. Plain honesty reassures you more than tact does, and you bring courage and momentum to a relationship that has gone quiet.",
    strain: "Under strain, the wish to wake things up can turn into arguments about very little, which may leave both of you warier than before.",
  },
  // Taurus
  {
    core: "You love for the long term and look past surface shine to what lasts. Touch and tangible signs of affection are how love becomes real for you, and your steady persistence carries a bond through hard patches.",
    strain: "When this is under pressure, security can stand in for contentment, and you may hold your position long after it has stopped making you happy.",
  },
  // Gemini
  {
    core: "Stimulation feeds you, and what looks like restlessness is an appetite for experience. You can commit fully to one person when you are free to keep lively friendships and the two of you keep learning and talking together.",
    strain: "Under strain, routine can drain you until your attention scatters across many things and stays near the surface of each.",
  },
  // Cancer
  {
    core: "You open in stages, because once someone is inside you hold nothing back. Gentleness, honesty and a willingness to make a home together are what let you show your whole self, and your care then runs deep.",
    strain: "When this is under pressure, you can stay behind your guard longer than you need to, or offer care in place of letting yourself be known.",
  },
  // Leo
  {
    core: "Courtship comes naturally to you, with play, praise and open-hearted attention. You stay in love when appreciation keeps flowing both ways, so you do well with a partner who has some colour of their own and enjoys yours.",
    strain: "Under strain, feeling unappreciated can lead you to withdraw behind pride, or to perform for approval in place of saying what you need.",
  },
  // Virgo
  {
    core: "You value realism, competence and a partner who can hear an honest observation and actually change. Love for you is something two people keep improving through shared plans, and your trust builds as someone proves reliable.",
    strain: "When this is under pressure, the eye for improvement can turn into fault-finding, towards a partner or towards yourself, and self-doubt may lead you to accept less than is fair.",
  },
  // Libra
  {
    core: "Partnership is where you feel most alive, and you need the give and take of a real equal. You bring fairness, courtesy and a talent for seeing both sides to the people you love.",
    strain: "Under strain, you can lose your own centre and revolve around the other person, debating small questions of fairness while the larger one goes unsaid.",
  },
  // Scorpio
  {
    core: "You need regular, honest emotional depth with a partner, and it is what keeps you well. Physical closeness means most to you when it comes with real psychological contact, and you bring that same honesty in return.",
    strain: "When this is under pressure, and depth is missing, you may brood or turn moody, and the truth can come out sharper than you intended.",
  },
  // Sagittarius
  {
    core: "Freedom is a real need for you, and you do best with a partner who has their own interests and friends and welcomes change. You want love to be part of a larger search for meaning, and that search is richer for you when shared.",
    strain: "Under strain, a dull stretch can feel like a reason to move on, which may keep you from the depth that lies on the other side of it.",
  },
  // Capricorn
  {
    core: "Commitment comes naturally to you, and you bring integrity and staying power. You value a dependable, self-sufficient partner who also has some sparkle, and love feeds you most when you say what you feel and ask for what you want.",
    strain: "When this is under pressure, feeling can go unspoken until love becomes dutiful routine, and you may end up carrying the responsible role for both of you.",
  },
  // Aquarius
  {
    core: "You question the usual rules about how a relationship should look and prefer to design your own with a partner. Respect for each person’s individuality is the heart of love for you.",
    strain: "Under strain, the need for independence can show up as resistance over small things, or as a stepping back that a partner may read as distance.",
  },
  // Pisces
  {
    core: "You are deeply tender, and a relationship lasts for you when two inner lives are really in contact, which often happens in shared quiet. Time in nature and calm evenings together feed that.",
    strain: "When this is under pressure, you may slip away into whatever is pleasant and easy and leave the hard conversation for later.",
  },
];

/** The Moon in each sign: what must be fed for your heart to trust. */
export const MOON_LOVE: Reading[] = [
  // Aries
  {
    core: "Your heart trusts someone who can meet your fire without flinching. Letting a partner see your anger directly is a sign you feel safe, and you are instinctively loyal. Shared adventure keeps you content at home.",
    strain: "Under strain, and especially when life lacks adventure, you can become touchy or competitive, and home may start to feel like one emergency after another.",
  },
  // Taurus
  {
    core: "Your heart is fed by touch, physical comfort and unhurried quiet together. Once you trust someone you are at ease in your body with them, and animals, plants and nature at home steady you.",
    strain: "When this is under pressure, you may sidestep conflict to keep the peace, so resentment can build quietly and come out later all at once.",
  },
  // Gemini
  {
    core: "Talk is what makes you feel connected, light banter included, because the exchange itself creates closeness for you. Fresh shared experiences feed the bond, and you are happy in a busy, lively home.",
    strain: "Under strain, routine can leave you restless and vaguely dissatisfied, and you may fill the gap with talk that keeps you occupied without bringing you closer.",
  },
  // Cancer
  {
    core: "Your tender core is well protected and takes time to reach, often sitting behind a more outgoing manner. You nurture naturally, and a warm, enclosing home is where your heart settles.",
    strain: "When this is under pressure, looking after someone can stand in for being close to them, and you may be drawn to people who need care but find it hard to give it back.",
  },
  // Leo
  {
    core: "Your heart needs encouragement, though it is shy about asking. You trust a partner who visibly enjoys what you create, whether that is a meal or a new look, and you want a home you can feel proud of.",
    strain: "Under strain, going unnoticed can hurt more than you let on, and you may go quiet and pull away in place of asking for the attention you want.",
  },
  // Virgo
  {
    core: "You trust someone you can talk with freely, and when you feel safe you share your self-doubts. A mild restlessness runs through you that becomes steady, practical support and a life built with care. You like an orderly home.",
    strain: "When this is under pressure, that restlessness can turn into worry over small things, and home may become a list of tasks more than a place to rest.",
  },
  // Libra
  {
    core: "Your heart needs courtesy, gentleness and pleasant surroundings, and you treat closeness as something to be done with care. You make a calm, beautiful home, and a rough or careless remark registers with you more than most people realise.",
    strain: "Under strain, you may smooth things over so thoroughly that you lose track of your own needs behind an agreeable manner.",
  },
  // Scorpio
  {
    core: "Your heart needs honesty that keeps deepening, and a home where feelings can be shown as they are. You withdraw at times to process, and you do best with a partner who respects that rhythm and is fully present when you return.",
    strain: "When this is under pressure, and the need for depth goes unfed, it can show as simmering moods or a strong reaction to something small.",
  },
  // Sagittarius
  {
    core: "Part of you needs to feel that you choose a partner freely, not out of dependence. Keeping your practical self-sufficiency helps commitment stay a choice, and you want a colourful, unconventional home life.",
    strain: "Under strain, mixed feelings about needing someone can show as admiring a partner greatly while keeping them at arm’s length.",
  },
  // Capricorn
  {
    core: "You need time alone and substantial projects of your own, and solitude is restful for you, not lonely. You do well with a partner who is glad to be loved without being strictly needed, and you like an orderly home.",
    strain: "When this is under pressure, self-reliance can leave a partner feeling shut out, and caution may tighten into wanting to manage money, home and plans closely.",
  },
  // Aquarius
  {
    core: "Your heart needs breathing room, and short separations do you good. You commit best once you know who you are apart from others’ expectations, with a partner whose own idea of a relationship is unconventional.",
    strain: "Under strain, ordinary closeness can feel confining, and a partner may read your need for space as detachment.",
  },
  // Pisces
  {
    core: "Your heart wants a merging of spirits, in quiet moments and in physical love, and home has to feel like a sanctuary. You bring great gentleness, and you do best with a calm partner whom you can tell what you want.",
    strain: "When this is under pressure, you may give up more than is good for you and go through the motions, or retreat into daydreams when the atmosphere turns harsh.",
  },
];

/** The rising sign: what you lead with and look for in a first meeting. */
export const RISING_LOVE: Reading[] = [
  // Aries
  {
    core: "You meet people head on, with candour and energy. Your interest is plain from the start, and what you hope to find in a first conversation is someone who answers frankly and with some spirit of their own.",
    strain: "Under strain, your frankness can land harder than you mean it to, and it may take a new person a while to see the warmth and loyalty behind it.",
  },
  // Taurus
  {
    core: "You lead with naturalness and honesty, and you are at ease in your body. People tend to feel familiar with you quickly, and in a first meeting you are looking for someone unhurried and real.",
    strain: "When this is under pressure, comfort can become the priority, and you may hold still when a relationship is asking you to move.",
  },
  // Gemini
  {
    core: "You lead with quickness, curiosity and good cheer, and conversation is how you first reach someone. There is more feeling behind the words than the lightness suggests, and you are looking for someone who notices that.",
    strain: "Under strain, more words can cover what you feel, and a partner may underestimate its depth. A short, plain statement from the heart, followed by silence, tends to serve you better.",
  },
  // Cancer
  {
    core: "You lead with care and watchfulness, and you take time to study a person before letting them close. You are looking for evidence of gentleness, and once you find it your warmth arrives in full.",
    strain: "When this is under pressure, the first step can become the hardest, and someone who would have been good for you may meet only your reserve.",
  },
  // Leo
  {
    core: "You lead with dignity and presence, and you can appear to need very little. Behind that sits a real wish to be appreciated, and sincere praise is what opens you up. You are looking for someone who is glad to give it.",
    strain: "Under strain, and without that appreciation, you may retreat into composure and become hard for a partner to reach.",
  },
  // Virgo
  {
    core: "You lead with competence and precision, and people tend to ask for your help early. You talk in careful detail, and you are looking for someone who supports your work and is interested in the feeling underneath the detail.",
    strain: "When this is under pressure, you may do things for a partner in place of opening up, and the detail can stand between them and what you feel.",
  },
  // Libra
  {
    core: "You lead with warmth and a gift for rapport, and people quickly feel you are on the same page. Relationships play a large part in your life, and in a first meeting you look for common ground and ease.",
    strain: "Under strain, the wish to reduce friction can make two people seem to have more in common than they do, and the differences may surface later.",
  },
  // Scorpio
  {
    core: "You lead with intensity and a searching attention that goes straight past small talk. You are looking for a real meeting of inner lives and a partner in growth, and without that your feeling tends to fade.",
    strain: "When this is under pressure, you may be drawn fast into a dramatic closeness with someone equally intense and then be unsure where to take it.",
  },
  // Sagittarius
  {
    core: "You lead with humour, generosity and a wide-open interest in the world, and that draws people to you. You need novelty, and you commit readily to a relationship that has room to move in it.",
    strain: "Under strain, a commitment can start to feel like confinement, and you may back away from the whole arrangement when your real objection is to the lack of room.",
  },
  // Capricorn
  {
    core: "You lead with composure and good judgement, and you watch carefully before you show your hand. You are looking for someone steady enough to be shown what sits behind the composed face, and letting them see it is how love begins for you.",
    strain: "When this is under pressure, the composure can stay in place too long, and a partner may be left unsure how you feel.",
  },
  // Aquarius
  {
    core: "You lead with friendliness and independence of mind, and you keep a little space around you at first. You are looking for someone who welcomes your unusual side and encourages it.",
    strain: "Under strain, you may present a more conventional version of yourself in order to fit in, and a partner can sense that part of you is being held back.",
  },
  // Pisces
  {
    core: "You lead with sensitivity and adaptability, and you can fit into almost any setting or company. You are looking for someone who makes room for your quiet time, reflection and creative life.",
    strain: "When this is under pressure, you may take on a partner’s expectations and style, and a sign of it is your own quiet time and creative life shrinking.",
  },
];

/** Venus in each sign: what warms you, how you attract, what you need in a partner. */
export const VENUS_LOVE: Reading[] = [
  // Aries
  {
    core: "You warm to independence, directness and spirit, and you attract by being bold and offering a challenge. You need a relationship where strong feelings, pleasant or not, can be said aloud, and that builds courage in both of you.",
    strain: "Under strain, unspoken anger dulls your affection quickly, and you may push for a confrontation to clear the air.",
  },
  // Taurus
  {
    core: "You warm to earthy people who are comfortable in their bodies and outdoors, and you attract through physical ease and soothing company. You want a lasting bond that keeps you calm, simple and in touch with your instincts.",
    strain: "When this is under pressure, your patience for emotional theatrics runs short, and you may close off until things are calm again.",
  },
  // Gemini
  {
    core: "You warm to curious people with many interests, and you attract through conversation, stories and flirting. You need a relationship that keeps your mind open and keeps you both discovering new things.",
    strain: "Under strain, dullness and fixed, judging attitudes cool your affection, and your interest may wander towards whatever is new.",
  },
  // Cancer
  {
    core: "You attract by being tender, protective and a safe place to come home to. You need a gentle partner and a relationship that is safe and lasting, and once gentleness has been shown over time you enjoy an imaginative, fanciful side in a partner too.",
    strain: "When this is under pressure, you may wait a long time for proof before opening, and protect your feelings more than the situation requires.",
  },
  // Leo
  {
    core: "You warm to presence and charisma, and you attract with generosity, humour and wholehearted gestures. You need a spontaneous relationship in which each of you can count on the other’s approval and both get to shine.",
    strain: "Under strain, feeling judged or turned away chills you fast, and you may hold back your warmth until you are sure of your welcome.",
  },
  // Virgo
  {
    core: "You warm to people devoted to their work or craft and serious about growing, with wit and discernment. You attract by being honest, attentive to detail and practically helpful, and you want a relationship in which you actively help each other.",
    strain: "When this is under pressure, a relationship that has stalled is hard for you to bear, and your wish to improve it can come across as a list of corrections.",
  },
  // Libra
  {
    core: "You are drawn to creative, kind, tactful people, and you attract through social grace, fairness and a love of beauty. You need courtesy and close attention to each other’s feelings.",
    strain: "Under strain, you may protect the appearance of harmony at the cost of saying what is true for you, and coarseness puts you off quickly.",
  },
  // Scorpio
  {
    core: "You warm to people who can be completely honest and who stay with emotional depth. You attract through intensity, privacy and a quiet sexual undercurrent, and you need room for both of you to be fully human together without judgement.",
    strain: "When this is under pressure, any hint of deception or shallowness can shake your trust, and you may watch closely for it.",
  },
  // Sagittarius
  {
    core: "You warm to easygoing, tolerant, funny, principled people with an appetite for experience. You attract by offering adventure, ideas and interesting friends, and you need a relationship that widens your view and adds colour to life.",
    strain: "Under strain, restriction or boredom weighs on you, and you may feel you are settling for less and start looking past what you have.",
  },
  // Capricorn
  {
    core: "You warm to responsible, self-contained, practical people, and you attract through reserve and quiet depth. You are comfortable with commitment and want a grown-up relationship built on integrity, with time alone for each of you.",
    strain: "When this is under pressure, immaturity or heavy dependence in a partner wears on you, and your reserve can deepen until your affection is hard to see.",
  },
  // Aquarius
  {
    core: "You warm to free-spirited, non-possessive people who go their own way, and you attract through originality, honesty and letting others be themselves. You need a lot of space in love and give it generously.",
    strain: "Under strain, the space you give can widen into detachment, and you are quick to pull back if you feel useful to someone without being seen by them.",
  },
  // Pisces
  {
    core: "You warm to visionary, otherworldly people, and you attract as a dreamer or poet who offers a refuge from everyday life. You need a relationship that joins the sexual and the spiritual.",
    strain: "When this is under pressure, harsh surroundings and hard questioning can send you inward, and a partner may find you have quietly slipped out of reach.",
  },
];

/** Mars in each sign: what you desire, how you pursue, what gives you energy. */
export const MARS_LOVE: Reading[] = [
  // Aries
  {
    core: "You desire openly and pursue directly, and you enjoy the chase and a contest for someone’s heart. You are very protective, you say things straight in a disagreement, and challenges you choose for yourself give you energy.",
    strain: "Under strain, repeated setbacks or a lack of challenges of your own choosing drain you, and anger may gather and look for somewhere to go.",
  },
  // Taurus
  {
    core: "You want sensual pleasure without shame, and you pursue by offering comfort through food, touch and time outdoors. You are determined once you have decided, and contact with your body and with nature restores you.",
    strain: "When this is under pressure, ignoring your instincts or staying indoors too long drains you, and you may feel self-conscious about physical desire.",
  },
  // Gemini
  {
    core: "You want variety and a lively exchange of ideas, and you pursue with wit, messages, stories and new things to do together. You enjoy a debate and argue with words and questions, and novelty gives you energy.",
    strain: "Under strain, boredom, certainty and prejudice drain you, and desire may scatter towards whatever is new.",
  },
  // Cancer
  {
    core: "You want a safe setting for real bonding, and you pursue by showing how well cared for someone would be, quietly hoping for the same in return. You defend your home fiercely, and having someone to nurture gives you energy.",
    strain: "When this is under pressure, you may worry that desire could get out of hand and cause hurt, and intrusion or being relied on only as a carer drains you.",
  },
  // Leo
  {
    core: "You express desire with warmth, confidence and healthy pride, and you pursue with loyal, generous, well-staged romance. Play, humour, praise and leading in something that matters give you energy.",
    strain: "Under strain, constant negativity drains you, and you may hold back from showing what you want for fear of being made to feel foolish.",
  },
  // Virgo
  {
    core: "You show desire by being useful, and you pursue by demonstrating how much you can help. You treat a relationship as a craft worth perfecting, and you bring real competence to looking after a partner.",
    strain: "When this is under pressure, your help can land as scrutiny or criticism, and you may feel you have to keep earning your place.",
  },
  // Libra
  {
    core: "You pursue as the understanding, romantic peacemaker, and you want to close the distance that unspoken anger creates. Once you engage, honest disagreement about real differences gives you energy.",
    strain: "Under strain, isolation, pointless quarrelling and unfairness drain you, and you may put off a conflict for fear of where it could lead.",
  },
  // Scorpio
  {
    core: "You want a relationship of thorough honesty that changes you both, and you pursue with intensity and probing conversation. Passion and deep closeness give you energy.",
    strain: "When this is under pressure, shallowness or having to show only a fraction of yourself drains you, and you may be on guard against being deceived.",
  },
  // Sagittarius
  {
    core: "You want excitement and variety, and you also want to act ethically. The two come together when you make a high-minded commitment freely. You pursue by offering adventure and your ideals, and travel, causes and new ideas give you energy.",
    strain: "Under strain, confinement, routine and situations that compromise your principles drain you, and the pull between excitement and conscience can sharpen.",
  },
  // Capricorn
  {
    core: "You show desire through responsible action more than display, and you pursue strategically, with practical reasons why you are a good choice. You want to protect and provide, and long-term projects and some solitude give you energy.",
    strain: "When this is under pressure, a lack of time alone drains you, and you may be hard on yourself over any sense of having let a loved one down.",
  },
  // Aquarius
  {
    core: "You want to be freely, even rebelliously, yourself in desire, and you pursue as the original thinker who offers honesty and room to breathe. Freedom of thought and speech gives you energy.",
    strain: "Under strain, restriction, convention and petty control drain you, and you may resist anything that feels like living by someone else’s rules.",
  },
  // Pisces
  {
    core: "You want erotic and spiritual passion joined together, and you pursue gently, with imagination and poetry, hoping to reach someone’s inner life. What you seek is the strength to let go fully with another person, and dreaming time restores you.",
    strain: "When this is under pressure, harshness and unkindness drain you, and without time to dream your desire can go quiet.",
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
        core: "Privacy, quiet and time to reflect feed your vitality, and you have a deep capacity to commit to home and family. You do best with someone who respects silence and will put down roots in one place with you.",
        strain: "Under strain, intrusion into your private space weakens your trust, and you may retreat further into yourself than the situation calls for.",
      },
      moon: {
        core: "You need solitude, deep roots and a warm home built on long, familiar bonds. An emotionally available partner at home is what lets your heart rest.",
        strain: "When this is under pressure, and you go without downtime, you can grow vague and hard to reach, and emotional distance at home may shut you down.",
      },
      mercury: {
        core: "You want a home full of ideas and conversation, where anything can be discussed. You do best living with someone curious, talkative and energetic.",
        strain: "Under strain, a closed mind or a lack of response at home wears you down, and you may feel unheard in the place where you most want to speak freely.",
      },
      venus: {
        core: "Your trust builds slowly and lasts, and people’s affection for you grows with time. You need privacy with a partner and a beautiful, peaceful home, and you do best with someone gracious and good at relating.",
        strain: "When this is under pressure, habits of relating learned in your family, such as keeping things pleasant on the surface, can shape how you love until you look at them.",
      },
      mars: {
        core: "You are resilient and fiercely protective of home and the people in it. You do best with a strong, loyal, adventurous partner who has the nerve to hear you out when you are angry.",
        strain: "Under strain, you may hold anger in silence until it comes out all at once, and a partner who shrinks from it loses your respect.",
      },
      jupiter: {
        core: "You want a generous, plentiful home with an open door. You do best sharing it with someone optimistic, humorous and free of pettiness.",
        strain: "When this is under pressure, constant negativity or needless austerity at home weakens the bond, and you may push back hard against any feeling of scarcity.",
      },
      saturn: {
        core: "You take the commitments of a shared home seriously, and you bring reliability and staying power to them. You need a mature, competent partner with integrity, someone grounded in what is real.",
        strain: "Under strain, you can be wary of being that exposed to another person, and immaturity or self-indulgence in a partner may confirm the wariness.",
      },
      uranus: {
        core: "You need a home that supports your individuality, and your household may look quite unlike the conventional one. You do best with an independent partner who is unmoved by social pressure.",
        strain: "When this is under pressure, a domineering or blindly conventional atmosphere at home stifles you, and you may feel like the odd one out among your own family.",
      },
      neptune: {
        core: "You need a home that shelters your sensitivity and inner life, a sanctuary where quiet is respected. You do best with a sensitive partner who is open to the spiritual side of life.",
        strain: "Under strain, noise and bad moods at home unsettle you easily, and a partner who dismisses your quiet states can weaken your trust.",
      },
      pluto: {
        core: "You need a home where strong feelings and complete honesty are welcome. You bring depth to family life, and you do best with an intense, honest partner who is willing to look closely at both of you.",
        strain: "When this is under pressure, a home life kept on the surface can set you brooding, and family history may weigh on you until it is talked through.",
      },
      node: {
        core: "You are growing toward making a real home and private life. Giving home and family priority over your public role is the direction that develops you most, even where it feels unpractised.",
        strain: "Under strain, you may keep putting work and public duties first, and home can stay something you mean to get to later.",
      },
      southnode: {
        core: "Family and clan are familiar ground, and you know the ways of the household you came from by heart. That pattern is one you can fall back on when you make a home of your own.",
        strain: "When this is under pressure, you may replay your family’s ways in your own relationships without noticing. Looking at them plainly is what gives you a choice.",
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
        core: "You have a real need to be seen, and play and creative self-expression bring out your warmth. To start or renew love you need shared play and taking turns as each other’s audience.",
        strain: "Under strain, being judged for wanting attention flattens the feeling, and it is worth noticing when someone needs to dominate you.",
      },
      moon: {
        core: "You are restored by being heard, having a good time and caring for others, whether through cooking, listening or play. To start or renew love you need imagination, tenderness and the sharing of inner feelings.",
        strain: "When this is under pressure, and joy runs short, you may make up for it with excess, and a bond can come to lean on dependence in one direction or the other.",
      },
      mercury: {
        core: "You need your voice heard, and for you love is a conversation that can run late into the night for years. To start or renew it you need wit, mental rapport and shared interests.",
        strain: "Under strain, silence and a lack of curiosity flatten the feeling, and you may find yourself with people who keep their heart behind clever talk.",
      },
      venus: {
        core: "You are renewed by style, sensuality and making beautiful things, and you are drawn to charming, creative people. To start or renew love you need grace and care in how each of you presents yourself.",
        strain: "When this is under pressure, coarseness flattens the feeling, and polished charm can hold your attention before you have seen what lies behind it.",
      },
      mars: {
        core: "You have a strong need to release energy through play, sport and physical love. To start or renew a relationship you need heat, intensity and things to do together.",
        strain: "Under strain, you may hold that energy back and then feel it press to get out, and passivity or timidity in a partner flattens the feeling.",
      },
      jupiter: {
        core: "You want relationships that make life larger, and pleasure renews your faith in things. To start or renew love you need an open, questing spirit and a sense of fun, with someone robust, funny and principled.",
        strain: "When this is under pressure, pettiness and prudishness flatten the feeling, and you may be taken with people who promise more than they can deliver.",
      },
      saturn: {
        core: "You take quiet satisfaction in achievement more than in wild fun, and you give your heart carefully. To start or renew love you need maturity in a partner and respect for your serious side.",
        strain: "Under strain, you may say less than you feel and keep your reserve when warmth is called for, and irresponsibility or constant silliness flattens the feeling.",
      },
      uranus: {
        core: "You want to be treated as one of a kind, not by formula, and you are drawn to free spirits who give and want space. To start or renew love you need freedom and the unexpected.",
        strain: "When this is under pressure, conformity and worry about others’ opinions flatten the feeling, and you may be drawn to people committed only to their own independence.",
      },
      neptune: {
        core: "Romance for you carries a longing that is hard to name, and you are drawn to gentle, soulful people and wordless connection. To start or renew love you need mystery and a sense of magic.",
        strain: "Under strain, hard practicality flattens the feeling, and you may be drawn to people who are looking for an escape and lean on you heavily.",
      },
      pluto: {
        core: "You bring depth and honesty to romance, and emotionally deep self-expression is how you relax into it. To start or renew love you need passion, intensity and someone willing to begin a hard conversation.",
        strain: "When this is under pressure, it can be hard to relax and trust at the start, and you may meet people who analyse you readily but resist insight in return.",
      },
      node: {
        core: "You are growing toward play, courtship and spontaneous self-expression. Letting yourself enjoy new connections without a plan is the direction that develops you most.",
        strain: "Under strain, you may stay serious and strategic where lightness is called for, and treat enjoyment as something to be earned first.",
      },
      southnode: {
        core: "Romance, pleasure and creativity are familiar ground for you, and you are at home in the early, exciting stage of love. It is a pattern you can fall back on easily.",
        strain: "When this is under pressure, you may stay in the romance stage and move on when it fades. It helps to think constructively about where a relationship could go next.",
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
        core: "You show love through support and reliability, and you have every right to ask and to be seen as you are. You learn most about love from colourful people who take up space comfortably.",
        strain: "Under strain, you may keep your heart behind duty and helpfulness, and unspoken resentment can build beneath it.",
      },
      moon: {
        core: "You show love through what you do for people, and your care is practical and steady. You learn most from warm, emotionally available people who show that closeness also comes through openness, eye contact and touch.",
        strain: "When this is under pressure, being seen without defences can feel risky, and you may slip into serving in place of letting someone near.",
      },
      mercury: {
        core: "You have real verbal skill and can make a good case. You learn most about love from good storytellers who are even better listeners, people who draw others out and make you want to tell them everything.",
        strain: "Under strain, a well-made argument can take the place of real two-way exchange, and intimate conversation may be where you most need help.",
      },
      venus: {
        core: "You treat lasting romantic love as a craft worth learning well. You learn most from gracious, magnetic people who know how to keep attraction alive and how to raise hard subjects with tact.",
        strain: "When this is under pressure, you may feel unsure how to keep romance going over time, and let it slide for want of a method.",
      },
      mars: {
        core: "You have a fiercer, more passionate side than you usually show. You learn most from direct people who release anger cleanly, state their sexual needs frankly and know they have the right to make demands.",
        strain: "Under strain, you may keep that fiercer side out of sight, and anger or desire can go unstated.",
      },
      jupiter: {
        core: "You are modest by nature, and you have room to ask more of love than you do. You learn most from confident, generous people whose faith in you is catching and who leave everyone around them feeling better about themselves.",
        strain: "When this is under pressure, modesty can become a habit of settling for too little in love.",
      },
      saturn: {
        core: "You bring discipline and a strong sense of duty to the people you love. You learn most from serious, accomplished people who put their discipline behind something they believe in.",
        strain: "Under strain, you may lose yourself in thankless duty and count it as virtue, giving effort where nobody has asked for it.",
      },
      uranus: {
        core: "You have an unconventional side that deserves room in your relationships. You learn most from original thinkers and risk-takers who refused to compromise who they are and came through intact.",
        strain: "When this is under pressure, you may keep that side small in order to fit in, and it can end up with far less space than it needs.",
      },
      neptune: {
        core: "You are highly sensitive and pick up a great deal from the people around you. You learn most from wise, imaginative, quietly spiritual people who can help you steady and train that sensitivity.",
        strain: "Under strain, sensitivity that has no steady handling can leave you overwhelmed or hurt by what you absorb.",
      },
      pluto: {
        core: "You have a natural intensity that belongs in your relationships. You learn most from deep, truthful people who look at you directly and treat that way of being as entirely acceptable.",
        strain: "When this is under pressure, you may show far less intensity than you feel, as if it were something to be ashamed of.",
      },
      node: {
        core: "You are growing toward service, practical care and guiding others. Being useful to the people you love, in ordinary daily ways, is the direction that develops you most.",
        strain: "Under strain, you may stand apart and stay absorbed in your own inner world when someone close needs practical help.",
      },
      southnode: {
        core: "Learning from teachers and authorities is familiar ground for you, and you know how to take good advice. It is a pattern you can fall back on in love.",
        strain: "When this is under pressure, you may look to someone else for the answers about your relationship when your own judgement is ready to be trusted.",
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
        core: "A few close relationships shape your life, and mutual exchange feeds your vitality. To commit you need full reciprocity with someone secure in themselves who can negotiate, and what you seek is real agreement between equals.",
        strain: "Under strain, you may revolve around a partner without stating your needs, or overcorrect and insist on your own view, and evasiveness weakens your trust.",
      },
      moon: {
        core: "You thrive in a close, mutually caring partnership, and you are loyal in it and good at listening. To commit you need tenderness and room for all feelings, not only the acceptable ones.",
        strain: "When this is under pressure, a partner’s needs can eclipse your own direction, and having your feelings dismissed weakens your trust.",
      },
      mercury: {
        core: "You need lively conversation in every close bond. To commit you need real mental rapport with a partner who is curious and still learning, and your gift is listening freshly and expecting to be surprised.",
        strain: "Under strain, boredom and not feeling heard weaken your trust, and you may assume you know what a partner will say before they have said it.",
      },
      venus: {
        core: "You want a relationship marked by grace and warm mutual respect, and you bring both to it. To commit you need courtesy and good intentions on each side. The charm you admire in others is yours to develop too.",
        strain: "When this is under pressure, you may look to a dazzling partner for qualities you doubt in yourself and feel unsure of holding them, and unkindness weakens your trust.",
      },
      mars: {
        core: "You bring candour and great loyalty to partnership, and you are drawn to spirited people who stay engaged in a disagreement. To commit you need courage and energy in both of you, with real conflicts brought into the open and resolved or accepted.",
        strain: "Under strain, you may stir things up when passion fades, and fearfulness, passivity or surface politeness in a partner weakens your trust.",
      },
      jupiter: {
        core: "You are generous and supportive, and a relationship feels alive to you when it is moving toward an ideal. To commit you need a sense of possibility and a partner who believes in you, perhaps more than you do.",
        strain: "When this is under pressure, idealism can leave you hard to satisfy and tip into the fault-finding you dislike, and narrow-mindedness or poor ethics weaken your trust.",
      },
      saturn: {
        core: "You take a vow with full seriousness and are capable of sober, honourable, lasting commitment. To commit you need a fully adult partner with integrity and realism, someone whose word holds.",
        strain: "Under strain, trust can be slow to give, and a serious letdown left unaddressed may lead you to keep your heart out of view.",
      },
      uranus: {
        core: "You need more space and freedom in partnership than most, and you want to choose your partner and your way of living on your own terms. To commit you need a shared resolve to write your own rules together.",
        strain: "When this is under pressure, ordinary closeness can feel confining, and possessiveness, control or concern for outside opinion weakens your trust.",
      },
      neptune: {
        core: "You want a relationship with a spiritual basis and a closeness that hardly needs words. To commit you need an inner life in both of you alongside practical competence, and compassion matters greatly to you.",
        strain: "Under strain, you may fall for someone’s lovely qualities and miss practical problems, so it helps to check the everyday facts before you give your trust.",
      },
      pluto: {
        core: "You bring depth and a searching honesty to commitment, and you want to know a partner all the way down. To commit you need passion, gut-level truthfulness and an ease with strong feelings in both of you.",
        strain: "When this is under pressure, trust can turn into the central question, and you may keep probing a partner who has already earned the benefit of the doubt.",
      },
      node: {
        core: "You are growing toward real partnership between equals. Sharing decisions and letting someone truly meet you is the direction that develops you most, and it rewards patience from you and from a partner.",
        strain: "Under strain, you may carry responsibility alone out of habit and find it strange to rely on someone else.",
      },
      southnode: {
        core: "Relationship is familiar ground, and you have real skill in it. Reading another person and finding agreement come easily, and it is a pattern you can fall back on.",
        strain: "When this is under pressure, you may put the other person’s needs first, seek agreement where none is needed, and revolve around a partner’s problems.",
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
        core: "You want a relationship of complete honesty that changes you, with rough edges shown and met with compassion. You need intensity in a partner and a willingness to look at the harder side of you both.",
        strain: "Under strain, evasion, denial and shallowness can end your desire, and keeping up appearances for the sake of peace may leave you feeling unlike yourself.",
      },
      moon: {
        core: "You want a bond that feels like home and joins everyday familiarity with desire. You need sensitivity and wholehearted, exclusive commitment in a partner.",
        strain: "When this is under pressure, you may feel unrooted in close relationships, and a partner who avoids growing up loses your interest however attractive they are.",
      },
      mercury: {
        core: "You need to speak your feelings and be truly listened to, and talk is part of how you bond deeply. You need an intelligent, curious partner who is willing to talk, listen and learn from you.",
        strain: "Under strain, emotional silence and rigid thinking can end your desire, and you may go quiet yourself when you expect not to be heard.",
      },
      venus: {
        core: "You want grace and dignity in physical love, and for you courtship should continue for as long as the relationship does. Shared enjoyment of art comforts you both, and you need a graceful partner.",
        strain: "When this is under pressure, crassness, vulgarity or a purely material view of physical love can end your desire quickly.",
      },
      mars: {
        core: "You want passion without shame, and you keep it by dealing with anger promptly and honestly. You need courage, passion and loyalty in a partner, someone truthful who welcomes your intensity.",
        strain: "Under strain, anger that has little to do with your partner can surface in close moments, and careful, word-mincing politeness may end your desire.",
      },
      jupiter: {
        core: "You want love you can believe in, with spontaneity, joy and the freedom to commit wholeheartedly and let go. You need a big-spirited, generous partner who judges kindly.",
        strain: "When this is under pressure, you may hesitate over the leap of commitment or settle for a dutiful arrangement, and meanness, control and shaming can end your desire.",
      },
      saturn: {
        core: "You bring seriousness and self-possession to close bonding, and you want a bond that proves itself over time. You need a patient partner of integrity who keeps promises for the long term.",
        strain: "Under strain, you may expect love to end badly and keep to yourself, or choose people who confirm the fear, and immaturity or self-indulgence can end your desire.",
      },
      uranus: {
        core: "You need freedom and individuality inside commitment, and the sense that you chose this bond yourself. You need a partner who respects your autonomy, tolerates difference and gives you space.",
        strain: "When this is under pressure, insecurity, control and possessiveness in a partner can end your desire, and you may guard your independence closely.",
      },
      neptune: {
        core: "You want physical love to include real contact between two inner lives, and eye contact matters greatly to you. You need a sensitive partner who brings tenderness to it and is open to the spiritual side of life.",
        strain: "Under strain, excitement fades where that contact is missing, and a purely physical, materialistic view of sex can end your desire.",
      },
      pluto: {
        core: "You want an intimate bond in which both of you can say anything and be changed by it. You need honest, undefensive self-examination in a partner, and someone at ease with intensity.",
        strain: "When this is under pressure, deep feelings can show in your intimate life as anger on the outside and sadness within, and shallowness or denial may end your desire.",
      },
      node: {
        core: "You are growing toward emotional and sexual depth. Letting someone know you fully is the direction that develops you most, and you deserve kindness from yourself as you go.",
        strain: "Under strain, you may concentrate on security and practical matters when a relationship is asking for depth, because depth feels unfamiliar.",
      },
      southnode: {
        core: "Intensity is familiar ground for you, and you know how to stay steady in a crisis. It is a pattern you can fall back on in close relationships.",
        strain: "When this is under pressure, you may be drawn to drama where stability and ordinary comfort would serve you better. Work through what truly needs it and let the rest be.",
      },
    },
  },
};

/** The idea of the arc of intimacy: houses 4 to 8 as a sequence. */
export const ARC_OF_INTIMACY: string =
  "Houses four to eight describe the stages of building a relationship, from making a home and falling in love, through taking responsibility and committing, to bonding deeply. Each stage rests on the one before, and a stage that is skipped tends to bring the same frustrations back.";
