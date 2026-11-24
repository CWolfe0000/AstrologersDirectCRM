import type { Metadata } from "next";
import Link from "next/link";
import { Locked, Section } from "@/components/reading";
import { POINT_NAMES } from "@/lib/astro/zodiac";
import { plural } from "@/lib/format";
import { nextHours, planetaryDayAt, type PlanetaryHour } from "@/lib/reading/hours";
import { CHALDEAN, DAY_RULERS, dayOf } from "@/lib/reading/hours";
import { DISCLAIMER, IN_LOVE, KIND_LABEL, USES } from "@/lib/reading/hour-uses";
import { PRACTICE, STEPS, practicesFor } from "@/lib/reading/practice";
import { requireUser } from "@/lib/server/auth";
import { loadContext } from "@/lib/server/readings";
import { bodiesAt } from "@/lib/server/swiss";
import { HomeForm } from "./home-form";

export const metadata: Metadata = { title: "Practice" };

export default async function Practice() {
  const user = await requireUser();
  const { self } = await loadContext(user.id);
  if (!self) return <p className="card">Add <Link className="link" href="/app">your own birth details</Link> first.</p>;

  const place = self.home ?? { place: self.birth.place, lat: self.birth.lat, lon: self.birth.lon, tz: self.birth.tz };
  const now = Date.now();
  const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: place.tz });
  const dated = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: place.tz });
  const span = (h: PlanetaryHour) => `${clock.format(h.start)} – ${clock.format(h.end)}`;
  const day = planetaryDayAt(now, place.lat, place.lon, place.tz);
  const current = day?.hours.find((h) => now >= h.start && now < h.end);

  // The sky today, as soft notes: the older books ask for the best time available, not a perfect one.
  const sky = bodiesAt(now);
  const phase = (((sky.moon.lon - sky.sun.lon) % 360) + 360) % 360;
  const notes: string[] = [phase < 180 ? "The Moon is waxing: a good fortnight for what you want to grow." : "The Moon is waning: a good fortnight for looking inward and letting go."];
  if (day && day.ruler !== "sun" && day.ruler !== "moon") {
    if (sky[day.ruler].speed < 0) notes.push(`${POINT_NAMES[day.ruler]} is retrograde. Tradition reads that as delay, so keep today’s practice reflective.`);
    const fromSun = Math.abs(((sky[day.ruler].lon - sky.sun.lon + 540) % 360) - 180);
    if (fromSun < 15) notes.push(`${POINT_NAMES[day.ruler]} is close to the Sun and out of sight. Tradition reads that as hidden, which suits private work.`);
  }

  const practices = practicesFor(self.chart);
  const today = day ? PRACTICE[day.ruler] : null;

  return (
    <div>
      <h1 className="text-4xl font-semibold">Practice</h1>
      <p className="mt-2 max-w-2xl text-ink-2">
        Planetary magic, timed by the planetary day and hour where you live: what each hour of today is used for, the full set of forty-nine hour and day pairings, and a practice matched to each pattern in your chart.
      </p>

      <p className="mt-4 max-w-2xl rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">{DISCLAIMER}</p>

      {!self.home && <p className="mt-5 rounded-xl bg-gold-soft px-4 py-3 text-sm text-ink-2">Times are for your birthplace, {self.birth.place}, until you say where you live now.</p>}

      {day && today ? (
        <>
          <section className="mt-8 rounded-3xl bg-night px-6 py-8 text-cream sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-line">Today in {place.place}</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{day.weekday}, Day Of {POINT_NAMES[day.ruler]}</h2>
            <p className="mt-3 max-w-2xl text-cream/85">
              {POINT_NAMES[day.ruler]} is worked with for {today.purpose}. The planetary day runs from sunrise ({clock.format(day.sunrise)}) to the next sunrise.
              {current && ` It is now the hour of ${POINT_NAMES[current.planet]}, until ${clock.format(current.end)}.`}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-cream/70">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </section>

          <Section title="Today’s five minutes" intro={`For ${POINT_NAMES[day.ruler]}. Best in one of its own hours today: ${day.hours.filter((h) => h.planet === day.ruler && h.end > now).map(span).join(", ") || "they have passed for today"}.`}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <ol className="card list-decimal space-y-2 pl-10 text-ink-2">{STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
              <dl className="card space-y-3">
                {[["Set Down", today.release], ["Cultivate", today.cultivate], ["Colour", today.colour], ["Scent", today.scent], ["During The Day", today.act]].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="text-ink-2 first-letter:uppercase">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Section>

          <Section title="Today’s planetary hours" intro="Twelve hours of daylight and twelve of night, each belonging to a planet, with what that hour is used for today. The planet of the hour is the main force and the planet of the day colours it.">
            <div className="card grid gap-x-10 gap-y-6 lg:grid-cols-2">
              {[false, true].map((night) => (
                <div key={String(night)}>
                  <h3 className="mb-2 text-lg font-semibold">{night ? "Night" : "Day"}</h3>
                  <ol>
                    {day.hours.filter((h) => h.night === night).map((h) => (
                      <li key={h.start} className="border-b border-line py-2 last:border-0">
                        <div className={`flex justify-between gap-4 ${h === current ? "font-semibold text-rose-hover" : h.planet === day.ruler ? "font-semibold" : ""}`}>
                          <span>{POINT_NAMES[h.planet]}{h === current && " · now"}</span>
                          <span className="tabular-nums">{span(h)}</span>
                        </div>
                        <p className="text-sm text-muted"><span className="font-semibold">{KIND_LABEL[USES[day.ruler][h.planet][0]]}.</span> {USES[day.ruler][h.planet][1]}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <p className="card mt-8 text-ink-2">The Sun does not rise and set today in {place.place}, so planetary hours cannot be worked out there. Use the planet of the weekday instead.</p>
      )}

      <Section title="A practice for each of your dynamics" intro="Each difficult aspect in your own chart, with the planet to work with and the next times that suit it. Use the same five minutes as above, with that planet’s colour and scent.">
        {practices.length === 0 ? (
          <p className="card text-ink-2">Your chart has no difficult aspects between the relationship planets, so there is nothing to steady here. Follow the planet of the day.</p>
        ) : user.premium ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {practices.map((p) => (
              <article key={p.key} className="card">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="mt-2 text-ink-2">{p.body}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">{p.basis}</p>
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">In everyday life</p>
                  <p className="mt-1 text-ink-2">{p.advice}</p>
                </div>
                <ul className="mt-4 space-y-3 border-t border-line pt-4">
                  {p.timings.map((t) => {
                    const times = nextHours(t.hour, t.day, now, place.lat, place.lon, place.tz);
                    return (
                      <li key={t.label}>
                        <p className="heading font-semibold">{t.label}</p>
                        <p className="text-ink-2">{t.note}</p>
                        <p className="text-sm text-muted">{times.length ? `Next: ${times.map((h) => `${dated.format(h.start)} – ${clock.format(h.end)}`).join("; ")}` : "No time in the coming week."}</p>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <Locked title={`${plural(practices.length, "practice")} matched to your chart`}>
            <p>Subscribe to see which planet to work with for each of your difficult dynamics, and the next times to do it where you live.</p>
          </Locked>
        )}
      </Section>

      <Section title="The forty-nine hours" intro="Every pairing of a planet’s hour with a planet’s day, and what it is used for. Each one comes round once or more every week.">
        {user.premium ? (
          <div className="grid gap-4">
            {DAY_RULERS.map((d) => (
              <details key={d} className="card group" open={day?.ruler === d}>
                <summary className="heading flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold">
                  {dayOf(d)}, day of {POINT_NAMES[d]}
                  <span className="text-rose transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-2 text-sm text-muted">In love, {POINT_NAMES[d]} is worked with for: {IN_LOVE[d].charAt(0).toLowerCase() + IN_LOVE[d].slice(1)}</p>
                <ul className="mt-3 divide-y divide-line">
                  {[...CHALDEAN].reverse().map((h) => {
                    const times = nextHours(h, d, now, place.lat, place.lon, place.tz, 1);
                    return (
                      <li key={h} className="grid gap-x-6 gap-y-0.5 py-2.5 sm:grid-cols-[11rem_1fr]">
                        <p className="font-semibold">{POINT_NAMES[h]} hour <span className="ml-1 rounded-full bg-cream-2 px-2 py-0.5 text-xs font-semibold text-ink-2">{KIND_LABEL[USES[d][h][0]]}</span></p>
                        <p className="text-ink-2">{USES[d][h][1]}{times[0] && <span className="block text-sm text-muted">Next: {dated.format(times[0].start)} – {clock.format(times[0].end)}</span>}</p>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        ) : (
          <Locked title="All forty-nine pairings, with the next time each one falls">
            <p>Subscribe to see what every hour of every day is used for, in love, influence, money, strength, wrath and inner work, and when each next comes round where you live.</p>
          </Locked>
        )}
      </Section>

      <section className="mt-12 max-w-xl">
        <h2 className="text-2xl font-semibold">Where you are</h2>
        <p className="mb-4 mt-1.5 text-muted">Planetary hours depend on local sunrise and sunset.</p>
        <div className="card"><HomeForm initial={self.home ?? null} /></div>
      </section>
    </div>
  );
}
