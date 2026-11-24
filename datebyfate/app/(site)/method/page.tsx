import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "How It Works", description: "What Datebyfate calculates, where the words come from, and how the pattern across your partners is checked against chance." };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-10 text-2xl font-semibold">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-ink-2">{children}</p>;

export default function Method() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-14">
        <p className="eyebrow">How it works</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">What Datebyfate does, exactly</h1>
        <P>Every reading is produced by fixed rules from a calculated chart. The same birth details always give the same reading, and each paragraph names the chart factor it comes from.</P>

        <H>The charts</H>
        <P>Planet positions come from the Swiss Ephemeris, the standard used by professional astrology software. We use the tropical zodiac, Placidus houses and the traditional sign rulers. A birthplace gives us the time zone and its history, so daylight saving time is handled for you.</P>
        <P>If a birth time is unknown we calculate for noon, leave out the rising sign and houses, and leave out anything that depends on the Moon’s exact position, which moves about 13° a day.</P>

        <H>Your own pattern</H>
        <P>Your reading looks at Venus (how you love), the Moon (what you need), Mars (what you go after), your Descendant and 7th house (who you are drawn to), and the close aspects your Sun, Moon, Venus and Mars make to each other and to Jupiter, Saturn, Uranus, Neptune and Pluto. Those aspects are the recurring dynamics.</P>

        <H>The elements</H>
        <P>The element readings follow the approach Stephen Arroyo set out in <em>Astrology, Psychology, and the Four Elements</em>. Each element is a kind of energy a person is attuned to. Your balance counts the Sun most, then the Moon, rising sign and Mars, then Venus and Mercury, then Jupiter and Saturn, with extra weight for the planets that rule your rising sign and your Sun sign. Uranus, Neptune and Pluto describe a generation and are not counted. Two people are compared first by each one’s Sun and Moon against the other’s Sun and Moon, which matters most for lasting love, then by Venus and Mars, then planet by planet. The same element is the closest harmony, fire with air and earth with water come next, and other mixes take energy, though friction can be productive. The wording throughout is our own.</P>

        <H>The aspects</H>
        <P>Aspects are read in the way Sue Tompkins sets out in <em>Aspects in Astrology</em>: first by the two planets involved, then by the kind of aspect. A conjunction is unity, the strongest contact. An opposition is a polarity, often lived out through the other person. A square is a challenge that pushes for action. A trine is ease, and a sextile is an opportunity that takes a little effort. Within one chart we use her working orbs: 8° for the conjunction, opposition, square and trine and 4° for the sextile, with 2° more when the Sun or Moon is involved. Each aspect is marked close or wide, because the close ones are central and the wide ones only confirm. This applies to each person’s own chart: yours, and the chart of each person you add. Each kind of aspect normally joins signs of particular elements, so when one falls across a sign boundary and the elements are different, the reading says so. The wording throughout is our own.</P>

        <H>The pattern across your partners</H>
        <P>Each partner is reduced to a list of signatures: the signs of their Sun, Moon, Venus and Mars, the houses of your chart their planets fall in, and every aspect between their planets and yours. There are several hundred possible signatures.</P>
        <P>A signature that turns up in at least half of your partners is a candidate. Then comes the check. We build a comparison group of 500 random birth dates from the same years your partners were born, and measure how often each signature appears in that group against your chart. Using the same years matters: slow planets stay in one place for a long time, so everyone of a similar age shares those contacts with you, and they are not a pattern.</P>
        <P>A repeat is shown only if it would happen by coincidence less than one time in ten for that signature. We then draw 300 random groups of the same size as yours from the comparison group and count how many repeats they show. That number is on the page next to yours. With two partners the two numbers are usually close, and the page says so. The picture gets sharper with each partner you add.</P>

        <H>Two charts together</H>
        <P>For a couple we list the closest contacts between the two charts, sorted into what comes easily and what causes friction, and where each person’s planets fall in the other’s houses. The readings of contacts between two charts are our own and do not come from the books named here. There is no compatibility score.</P>

        <H>The relationship’s own chart</H>
        <P>The composite chart follows Robert Hand’s method in <em>Planets in Composite</em>. Each planet is the midpoint of your two planets, and the houses are cast from the midpoint of your two Midheavens, which needs both birth times. It is read in his order: a crowd of planets in one house first, then the houses of the Sun and Moon, then the aspects to the Sun and Moon. He does not read the composite by sign, apart from the Sun and Moon, so those are shown last. We use the average of your two birth latitudes where he would use the place you live. The wording throughout is our own.</P>

        <H>Triggers</H>
        <P>Each person is also read alone. A difficult aspect in someone’s chart, such as Venus square Saturn, is theirs whoever they are with. We then check whether the other person has a planet within 3° or 4° of either end of it, by conjunction, square or opposition. If so, that person sets it off. A planet in trine or sextile to either end eases it instead, and if nothing touches it, it stays quiet in this relationship. The supportive aspects in each chart are read the same way: the other person’s planets on them, or in trine or sextile to them, bring that strength out. You see all of this in both directions, and across past partners, being set off, eased or brought out in the same place again and again counts as a repeat.</P>

        <H>Timing</H>
        <P>The calendar follows Steven Forrest’s method in <em>The Changing Sky</em>. Jupiter, Saturn, Uranus, Neptune and Pluto set themes that last months or years, and each can go two ways, so every period comes with a task and a trap. What matters is which planet meets which point in your chart; the kind of aspect only says how it arrives. We use his orbs (5° for Jupiter, 3.5° for Saturn, 3° for Uranus, 2° for Neptune and Pluto), so the retrograde passes of one transit fall within one period, with the exact dates listed. The calendar also gives your progressed Moon, which marks the chapter you are in, your progressed Venus, and the slow planets moving through your 5th, 7th and 8th houses. Nothing in it predicts an event. Timing the ruler of your 7th house, and transits to a couple’s composite chart, are our own additions. The wording throughout is our own.</P>

        <H>Planetary practice</H>
        <P>The Practice page gives the planetary day and hours for where you live. The planetary day runs from sunrise to sunrise. Daylight is divided into twelve equal hours and the night into twelve more, the first hour after sunrise belongs to the planet of the weekday, and the rest follow in the traditional order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon. This, the pairing of one planet’s hour with another planet’s day, and the colours and scents follow Jason Miller’s <em>Advanced Planetary Magic</em> and Dykes and Gibson’s <em>Astrological Magic</em>.</P>
        <P>The page gives what each hour is used for on each day, all forty-nine pairings from Miller’s book, including those for attraction, influence and wrath, in our own words. Those books work with the seven visible planets and do not tie a practice to a birth chart, so matching a short practice to each difficult aspect in your chart is our own addition. The everyday advice beside each practice follows Donna Cunningham’s <em>An Astrological Guide to Self-Awareness</em>, in our own words.</P>
        <P>Planetary magic is a traditional spiritual practice, described for personal use and entertainment. We make no claim that any working will have an effect, and you are responsible for how you use it.</P>

        <H>What this is not</H>
        <P>Astrology has not been shown to predict behaviour, and nothing here tells you what a person will do or whether a relationship will last. Use it the way you would use a good question from a friend: as a prompt to look at your own history. If you are in a relationship that frightens you, please talk to someone you trust or a local support service.</P>

        <Link href="/reading" className="btn-primary mt-10">Get your free pattern</Link>
      </main>
    </>
  );
}
