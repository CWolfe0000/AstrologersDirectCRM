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
        <P>Your reading looks at Venus (how you love), the Moon (what you need), Mars (what you go after), your Descendant and 7th house (who you are drawn to), and the close aspects between those planets and Saturn, Uranus, Neptune and Pluto. Those aspects are the recurring dynamics.</P>

        <H>The pattern across your partners</H>
        <P>Each partner is reduced to a list of signatures: the signs of their Sun, Moon, Venus and Mars, the houses of your chart their planets fall in, and every aspect between their planets and yours. There are several hundred possible signatures.</P>
        <P>A signature that turns up in at least half of your partners is a candidate. Then comes the check. We build a comparison group of 500 random birth dates from the same years your partners were born, and measure how often each signature appears in that group against your chart. Using the same years matters: slow planets stay in one place for a long time, so everyone of a similar age shares those contacts with you, and they are not a pattern.</P>
        <P>A repeat is shown only if it would happen by coincidence less than one time in ten for that signature. We then draw 300 random groups of the same size as yours from the comparison group and count how many repeats they show. That number is on the page next to yours. With two partners the two numbers are usually close, and the page says so. The picture gets sharper with each partner you add.</P>

        <H>Two charts together</H>
        <P>For a couple we list the closest contacts between the two charts, sorted into what comes easily and what causes friction, where each person’s planets fall in the other’s houses, and the composite chart, which is made of the midpoints between your planets and describes the relationship itself. There is no compatibility score.</P>

        <H>Triggers</H>
        <P>Each person is also read alone. A difficult aspect in someone’s chart, such as Venus square Saturn, is theirs whoever they are with. We then check whether the other person has a planet within 3° or 4° of either end of it, by conjunction, square or opposition. If so, that person sets it off. A planet in trine or sextile to either end eases it instead, and if nothing touches it, it stays quiet in this relationship. The supportive aspects in each chart are read the same way: the other person’s planets on them, or in trine or sextile to them, bring that strength out. You see all of this in both directions, and across past partners, being set off, eased or brought out in the same place again and again counts as a repeat.</P>

        <H>Timing</H>
        <P>Your calendar lists the periods in the next 12 months when Jupiter, Saturn, Uranus, Neptune or Pluto come within a degree or two of your relationship points, with start, peak and end dates.</P>

        <H>What this is not</H>
        <P>Astrology has not been shown to predict behaviour, and nothing here tells you what a person will do or whether a relationship will last. Use it the way you would use a good question from a friend: as a prompt to look at your own history. If you are in a relationship that frightens you, please talk to someone you trust or a local support service.</P>

        <Link href="/reading" className="btn-primary mt-10">Get your free pattern</Link>
      </main>
    </>
  );
}
