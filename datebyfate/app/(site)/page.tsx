import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";
import { PRICES } from "@/lib/plans";

const STEPS = [
  { n: "1", title: "Start with your own chart", body: "Enter your birth date, time and place. You get your relationship pattern straight away: how you love, what you need, who you are drawn to and the dynamics you repeat. Free." },
  { n: "2", title: "Add the people you have loved", body: "A birth date is enough for each past partner. Datebyfate looks for what they have in common with each other, and how each of their charts met yours." },
  { n: "3", title: "Check someone new", body: "Add the person you have just met. See which parts of your pattern they repeat, which they break, and what the two of you are like together." },
];

const FAQ = [
  { q: "Do I need to know my birth time?", a: "No. Without it you still get your Venus, Mars and Sun readings and most of your dynamics. Your rising sign and the section on who you are drawn to need a time, and you can add it later." },
  { q: "I don’t know my exes’ birth times. Does it still work?", a: "Yes. A birth date is enough. We leave out the parts of their chart that depend on the time and use the rest." },
  { q: "How is this different from a compatibility score?", a: "There is no score. A single number hides everything useful. You get the specific contacts between two charts, sorted into what comes easily and what causes friction, in plain words." },
  { q: "Is the pattern real or coincidence?", a: "With two or three partners, some repeats always happen by chance. So we measure it: every repeat is compared with how often it shows up among random people born in the same years, and the page tells you how many repeats chance alone would produce." },
  { q: "Who can see the people I add?", a: "Only you. Names and birth details are encrypted, and you can delete any person, or your whole account, at any time." },
];

export default function Home() {
  return (
    <>
      <div className="bg-night text-cream">
        <SiteHeader dark />
        <section className="container grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-line">Relationship patterns, from your birth chart</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-6xl">You don’t have a type. You have a pattern.</h1>
            <p className="mt-5 max-w-xl text-lg text-cream/80">
              Datebyfate reads your chart for the way you love, finds what your past partners had in common, and tells you whether the person you have just met is more of the same.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/reading" className="btn-primary !px-6 !py-3 text-base">Get your free pattern</Link>
              <span className="text-sm text-cream/60">Two minutes. No account needed.</span>
            </div>
          </div>
          <div className="rounded-3xl border border-cream/15 bg-night-2 p-6 sm:p-8" aria-label="Example of a pattern across past partners">
            <p className="text-sm text-cream/60">Example · across 4 past partners</p>
            <ul className="mt-4 space-y-3">
              {[
                ["Their Saturn in tension with your Venus", "3 of 4", "1 in 5 people"],
                ["Mars in a water sign", "4 of 4", "1 in 4 people"],
                ["Sun in your 12th house", "3 of 4", "1 in 11 people"],
              ].map(([title, count, base]) => (
                <li key={title} className="rounded-2xl bg-night px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg">{title}</p>
                    <p className="shrink-0 text-sm font-semibold text-rose-line">{count}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-cream/60">Usual rate: {base}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-cream/60">A random group of four would show about 6 repeats like these. This one shows 14.</p>
          </div>
        </section>
      </div>

      <section className="container py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 max-w-2xl text-4xl font-semibold">Three charts in, one pattern out</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card">
              <span className="font-display text-3xl font-semibold text-rose">{s.n}</span>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-cream-2 py-20">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Checked against chance</p>
            <h2 className="mt-2 text-4xl font-semibold">We tell you when it is probably a coincidence</h2>
            <p className="mt-4 text-lg text-ink-2">
              Compare any three people and you will find things they share. Most astrology apps stop there and call it fate.
            </p>
            <p className="mt-3 text-ink-2">
              Datebyfate compares every repeat with a group of 500 random people born in the same years as your partners. You see how common each one is, how many repeats a random group would show, and how many you have. If your pattern is no stronger than chance, the page says so.
            </p>
            <Link href="/method" className="link mt-5 inline-block">Read how the method works</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Your pattern", "How you love, what you need, who you are drawn to and what you repeat. Free."],
              ["The pattern across your exes", "What your past partners share, and how each of their charts met yours."],
              ["A check on someone new", "Which parts of your pattern this person repeats, and which sore spots in each of your charts the other one presses on."],
              ["Your calendar", "The periods in the next 12 months when your relationship planets are active."],
            ].map(([t, b]) => (
              <div key={t} className="card !p-5">
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-2 text-4xl font-semibold">Before you start</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <span className="text-rose transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-2 max-w-2xl text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="rounded-3xl bg-night px-6 py-14 text-center text-cream sm:px-12">
          <h2 className="mx-auto max-w-2xl text-4xl font-semibold">Start with your own pattern</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/75">
            Your own reading is free. The pattern across your exes, checks on new people and your calendar are {PRICES.monthly.label} a month, or {PRICES.yearly.label} a year.
          </p>
          <Link href="/reading" className="btn-primary mt-7 !px-6 !py-3 text-base">Get your free pattern</Link>
        </div>
      </section>
    </>
  );
}
