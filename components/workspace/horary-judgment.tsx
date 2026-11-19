"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Scale } from "lucide-react";
import { api } from "@/lib/api";
import { BODIES, SIGNS, fmtDeg, ordinal, signOf, type ChartPoints, type ChartView } from "@/lib/astro";
import { Breakdown, BHead, BTable } from "@/components/ui/breakdown";
import { horaryConsiderations } from "@/lib/astro/horary";
import { ABOUT, HORARY_TOPICS, MOIETY, NAME, Name, SEVEN, aspectBetween, aspectChecks, horaryVerdict, derivedHouse, hourAgreement, perfectionTestimonies, planetaryHour, significators, strengthOf, timingUnit, type Motion, type Testimony } from "@/lib/astro/horary-judgment";
import type { Planet7 } from "@/lib/astro/traditional";
import type { ChartRecord, HoraryData } from "@/lib/data/types";
import { zonedToUtc } from "@/lib/timezones";
import { cn, DATA_MODE, TODAY } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";

const motionCache = new Map<string, Promise<Motion>>();
const TONE = { for: "text-sage-dark", against: "text-accent", neutral: "text-muted" } as const;
const ICON = { for: CheckCircle2, against: AlertTriangle, neutral: Scale } as const;
const h3 = "mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted";
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });

/** Significators, perfection, strength, timing and radicality for a horary chart, with the judgment and outcome log. */
export function HoraryJudgment({ chart, horary, view, onSave }: { chart: ChartRecord; horary: HoraryData; view: ChartView; onSave: (h: HoraryData) => void }) {
  const p = view.inner;
  const topicHouse = horary.topicHouse ?? 7;
  const aboutHouse = horary.aboutHouse ?? 1;
  const quesitedHouse = derivedHouse(topicHouse, aboutHouse);
  const sig = significators(p, quesitedHouse);
  const utc = React.useMemo(() => zonedToUtc(`${horary.at}:00`, horary.tz || "UTC").toISOString(), [horary.at, horary.tz]);
  const [motion, setMotion] = React.useState<Motion | null | "error">(null);

  React.useEffect(() => {
    if (DATA_MODE !== "server") return setMotion("error");
    const key = `${utc}|${view.settings.zodiac}`;
    let pr = motionCache.get(key);
    if (!pr) {
      pr = api<{ motion: Motion }>("/api/v1/astro/motion", { body: { utc, settings: { zodiac: view.settings.zodiac } } }).then((r) => r.motion);
      motionCache.set(key, pr);
    }
    let live = true;
    pr.then((m) => live && setMotion(m), () => { motionCache.delete(key); if (live) setMotion("error"); });
    return () => {
      live = false;
    };
  }, [utc, view.settings.zodiac]);

  const [draft, setDraft] = React.useState({ judgment: horary.judgment ?? "", outcome: horary.outcome ?? "pending", outcomeNote: horary.outcomeNote ?? "" });
  React.useEffect(() => setDraft({ judgment: horary.judgment ?? "", outcome: horary.outcome ?? "pending", outcomeNote: horary.outcomeNote ?? "" }), [chart.id, horary.judgment, horary.outcome, horary.outcomeNote]);
  const dirty = draft.judgment !== (horary.judgment ?? "") || draft.outcome !== (horary.outcome ?? "pending") || draft.outcomeNote !== (horary.outcomeNote ?? "");

  const m = motion && motion !== "error" ? motion : null;
  const testimonies: Testimony[] = m && !sig.same ? perfectionTestimonies(p, m, sig.querent, sig.quesited) : [];
  const direct = m && !sig.same ? aspectBetween(m, sig.querent, sig.quesited) : null;
  const applier = direct?.applier;
  const applierBody = applier ? p.bodies.find((b) => b.id === applier) : undefined;
  const hour = planetaryHour(Date.parse(utc), horary.at.slice(0, 10), horary.lat, horary.lon);
  const agree = hour ? hourAgreement(hour.ruler, p.asc) : null;
  const where = (pl: Planet7) => {
    const b = p.bodies.find((x) => x.id === pl);
    return b ? `${ordinal(b.house)} House` : "";
  };
  const strengths = [...new Set<Planet7>([sig.querent, "moon", sig.quesited])].map((pl) => strengthOf(p, pl));
  const cautions = horaryConsiderations(p, horary.at).filter((c) => c.tone === "caution").map((c) => c.title);
  const verdict = m && !sig.same ? horaryVerdict(testimonies, cautions, strengths, sig.quesited, agree ? agree.agrees : null) : null;
  const timing = direct?.applying && direct.perfectsAt && applierBody ? (() => {
    const u = timingUnit(applierBody.lon, applierBody.house);
    const deg = Math.max(1, Math.round(direct.orb));
    return `About ${deg} ${deg === 1 ? u.unit.replace(/s$/, "") : u.unit} (Lilly’s rule); the aspect perfects on ${fmtDate(direct.perfectsAt)}.`;
  })() : verdict?.deciding?.at ? `The deciding aspect perfects on ${fmtDate(verdict.deciding.at)}.` : null;

  return (
    <div className="mt-4 space-y-5 border-t border-line pt-4">
      <section>
        <p className={h3}>The Matter</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-[12.5px]">
            <span className="mb-1 block text-muted">The Question Is About</span>
            <Select value={String(topicHouse)} onChange={(e) => onSave({ ...horary, topicHouse: Number(e.target.value) })}>
              {HORARY_TOPICS.map((t) => <option key={t.id} value={t.house}>{ordinal(t.house)}: {t.label}</option>)}
            </Select>
          </label>
          <label className="block text-[12.5px]">
            <span className="mb-1 block text-muted">Whose Matter</span>
            <Select value={String(aboutHouse)} onChange={(e) => onSave({ ...horary, aboutHouse: Number(e.target.value) })}>
              {ABOUT.map((a) => <option key={a.id} value={a.house}>{a.label.charAt(0).toUpperCase() + a.label.slice(1)}{a.house !== 1 ? ` (${ordinal(a.house)})` : ""}</option>)}
            </Select>
          </label>
        </div>
        <p className="mt-2 text-[12.5px] text-ink-3">
          Quesited: the <b className="font-medium">{ordinal(quesitedHouse)} House</b>{aboutHouse !== 1 ? ` (the ${ordinal(topicHouse)} from the ${ordinal(aboutHouse)})` : ""}.
        </p>
      </section>

      <section>
        <p className={h3}>Verdict</p>
        {motion === null ? (
          <p className="flex items-center gap-2 text-[12.5px] text-muted"><Loader2 className="size-3.5 animate-spin" /> Weighing the testimonies…</p>
        ) : !verdict ? (
          <p className="text-[12.5px] text-muted">{sig.same ? "One planet signifies both; judge by the Moon and planets in the houses involved." : "The verdict needs the Swiss Ephemeris engine."}</p>
        ) : (
          <div className={cn("rounded-lg border p-3", verdict.lean.startsWith("yes") ? "border-sage-100 bg-sage-50/60" : verdict.lean === "unclear" ? "border-line bg-canvas/60" : "border-accent-100 bg-accent-50/50")}>
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn("font-serif text-[22px] leading-tight", verdict.lean.startsWith("yes") ? "text-sage-dark" : verdict.lean === "unclear" ? "text-ink" : "text-accent")}>{verdict.headline}</span>
              <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-3">{verdict.confidence} Confidence</span>
            </p>
            {verdict.deciding && <p className="mt-1.5 text-[12.5px] text-ink-3"><span className="font-medium text-ink">Deciding Testimony:</span> {verdict.deciding.text}</p>}
            {timing && <p className="mt-1 text-[12.5px] text-ink-3"><span className="font-medium text-ink">Timing:</span> {timing}</p>}
            {(verdict.supports.length > 0 || verdict.against.length > 0 || verdict.cautions.length > 0) && (
              <div className="mt-2 grid gap-2 text-[12.5px] sm:grid-cols-2">
                {verdict.supports.length > 0 && <div><p className="font-medium text-sage-dark">Supporting</p><ul className="list-disc pl-4 text-ink-3">{verdict.supports.map((x) => <li key={x}>{x}</li>)}</ul></div>}
                {(verdict.against.length > 0 || verdict.cautions.length > 0) && <div><p className="font-medium text-accent">Against & Cautions</p><ul className="list-disc pl-4 text-ink-3">{[...verdict.against, ...verdict.cautions].map((x) => <li key={x}>{x}</li>)}</ul></div>}
              </div>
            )}
            <Breakdown title="How the Verdict Was Reached" className="mt-2.5 bg-surface/70">
              {verdict.steps.map((x) => <p key={x}>{x}</p>)}
              <p className="text-muted">Order of weight: direct perfection between the significators, then the Moon to the quesited, then translation, then collection. Prohibition, frustration or refranation deny it. A square perfects with difficulty, an opposition with regret. Cautions before judgment lower confidence, not the lean.</p>
            </Breakdown>
            <p className="mt-2 text-[11.5px] text-muted">A rule-based lean from the testimonies below, not a judgment. Weigh it with the whole chart.</p>
          </div>
        )}
      </section>

      <section>
        <p className={h3}>Significators</p>
        <ul className="space-y-1 text-[13px]">
          <li><span className="text-muted">Querent:</span> <span className="glyph">{BODIES[sig.querent].glyph}</span> {Name(sig.querent)}, Ruler of the Ascendant ({where(sig.querent)}), with the Moon as Co-Significator ({where("moon")}).</li>
          <li><span className="text-muted">Quesited:</span> <span className="glyph">{BODIES[sig.quesited].glyph}</span> {Name(sig.quesited)}, Ruler of the {ordinal(quesitedHouse)} House ({where(sig.quesited)}).</li>
        </ul>
        {sig.same && <p className="mt-1.5 text-[12.5px] text-warn">One planet rules both houses. Traditionally, judge by the Moon and by planets in the houses involved.</p>}
      </section>

      <section>
        <p className={h3}>Perfection</p>
        {motion === null ? (
          <p className="flex items-center gap-2 text-[12.5px] text-muted"><Loader2 className="size-3.5 animate-spin" /> Following the planets forward…</p>
        ) : motion === "error" ? (
          <p className="text-[12.5px] text-muted">Perfection needs the Swiss Ephemeris engine.</p>
        ) : sig.same ? (
          <p className="text-[12.5px] text-muted">Not applicable when one planet signifies both.</p>
        ) : (
          <ul className="space-y-2">
            {testimonies.map((t, i) => {
              const Icon = ICON[t.tone];
              return (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", TONE[t.tone])} aria-hidden />
                  <span>{t.text}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-[11.5px] text-muted">Ptolemaic aspects within the planets’ moieties (half of Lilly’s orbs, added together), followed in the ephemeris for up to 400 days.</p>
      </section>

      {direct?.applying && direct.perfectsAt && applierBody && (
        <section>
          <p className={h3}>Timing</p>
          {(() => {
            const u = timingUnit(applierBody.lon, applierBody.house);
            const deg = Math.max(1, Math.round(direct.orb));
            return (
              <p className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                <span>
                  {direct.orb.toFixed(1)}° to perfection, with {NAME[applierBody.id as Planet7]} applying from a {u.mode} sign in an {u.house} house: about <b className="font-medium">{deg} {deg === 1 ? u.unit.replace(/s$/, "") : u.unit}</b> by Lilly’s rule of thumb. In the ephemeris the aspect perfects on {fmtDate(direct.perfectsAt)}.
                </span>
              </p>
            );
          })()}
        </section>
      )}

      <section>
        <p className={h3}>Strength</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-muted"><th className="py-1.5 font-semibold">Planet</th><th className="py-1.5 font-semibold">Essential</th><th className="py-1.5 font-semibold">Accidental</th></tr>
            </thead>
            <tbody>
              {strengths.map((s) => (
                <tr key={s.planet} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-2"><span className="glyph">{BODIES[s.planet].glyph}</span> {Name(s.planet)}</td>
                  <td className="py-1.5 pr-2"><b className={cn("tabular-nums", s.essential > 0 ? "text-sage-dark" : s.essential < 0 ? "text-accent" : "")}>{s.essential > 0 ? "+" : ""}{s.essential}</b> <span className="text-muted">{s.essentialNotes.join(", ")}</span></td>
                  <td className="py-1.5"><b className={cn("tabular-nums", s.accidental > 0 ? "text-sage-dark" : s.accidental < 0 ? "text-accent" : "")}>{s.accidental > 0 ? "+" : ""}{s.accidental}</b> <span className="text-muted">{s.accidentalNotes.join(", ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted">Lilly’s points. Combust within 8°30′ of the Sun, under the beams within 17°, cazimi within 17′.</p>
      </section>

      <section>
        <p className={h3}>Radicality</p>
        {hour && agree ? (
          <p className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
            {agree.agrees ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-dark" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />}
            <span>
              Asked in the hour of <b className="font-medium">{NAME[hour.ruler]}</b> ({ordinal(hour.hour)} hour of the {hour.night ? "night" : "day"}), on a day ruled by {NAME[hour.dayRuler]}. {agree.how}
            </span>
          </p>
        ) : (
          <p className="text-[12.5px] text-muted">The Sun doesn’t rise or set here on this date, so there are no planetary hours.</p>
        )}
        <p className="mt-1.5 text-[11.5px] text-muted">Planetary hours run from local sunrise to sunset and sunset to sunrise, in Chaldean order.</p>
      </section>

      <HoraryBreakdown p={p} m={m} horary={horary} sig={sig} quesitedHouse={quesitedHouse} hour={hour} agree={agree} utc={utc} />

      <section className="rounded-lg border border-line p-3">
        <p className={h3}>Judgment & Outcome</p>
        <label className="block text-[12.5px]">
          <span className="mb-1 block text-muted">Your Judgment</span>
          <Textarea rows={3} value={draft.judgment} onChange={(e) => setDraft({ ...draft, judgment: e.target.value })} placeholder="What you told the querent, and why." />
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-[180px_1fr]">
          <label className="block text-[12.5px]">
            <span className="mb-1 block text-muted">Outcome</span>
            <Select value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value as typeof draft.outcome })}>
              <option value="pending">Not Known Yet</option>
              <option value="yes">Yes, It Happened</option>
              <option value="no">No, It Didn’t</option>
              <option value="partly">Partly</option>
            </Select>
          </label>
          <label className="block text-[12.5px]">
            <span className="mb-1 block text-muted">What Happened</span>
            <Textarea rows={2} value={draft.outcomeNote} onChange={(e) => setDraft({ ...draft, outcomeNote: e.target.value })} placeholder="What the querent reported, and when." />
          </label>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          {horary.outcomeAt && <span className="mr-auto text-[11.5px] text-muted">Outcome Recorded {fmtDate(Date.parse(`${horary.outcomeAt}T12:00:00Z`))}</span>}
          <Button size="sm" disabled={!dirty} onClick={() => onSave({ ...horary, judgment: draft.judgment.trim() || undefined, outcome: draft.outcome, outcomeNote: draft.outcomeNote.trim() || undefined, outcomeAt: draft.outcome !== "pending" ? (draft.outcome !== horary.outcome ? TODAY : horary.outcomeAt ?? TODAY) : undefined })}>Save</Button>
        </div>
      </section>
    </div>
  );
}

/** Everything the judgment above is built from: positions, the aspects checked, the hour and the rules applied. */
function HoraryBreakdown({ p, m, horary, sig, quesitedHouse, hour, agree, utc }: {
  p: ChartPoints;
  m: Motion | null;
  horary: HoraryData;
  sig: ReturnType<typeof significators>;
  quesitedHouse: number;
  hour: ReturnType<typeof planetaryHour>;
  agree: ReturnType<typeof hourAgreement> | null;
  utc: string;
}) {
  const local = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { timeZone: horary.tz || "UTC", hour: "numeric", minute: "2-digit" });
  const cusp = p.cusps[quesitedHouse - 1]!;
  const pairs: [Planet7, Planet7][] = sig.same ? [] : [[sig.querent, sig.quesited], ...(sig.querent !== "moon" && sig.quesited !== "moon" ? [["moon", sig.quesited] as [Planet7, Planet7]] : [])];
  const seq = hour ? Array.from({ length: hour.index + 1 }, (_, k) => SEVEN[(SEVEN.indexOf(hour.dayRuler) + k) % 7]!) : [];
  return (
    <Breakdown>
      <div className="space-y-1">
        <BHead>Significators</BHead>
        <p>Ascendant {fmtDeg(p.asc)} {signOf(p.asc).name} → ruled by {NAME[sig.querent]} (traditional rulership) = the querent. The Moon is always co-significator of the querent.</p>
        <p>{ordinal(quesitedHouse)} House cusp {fmtDeg(cusp)} {signOf(cusp).name} → ruled by {NAME[sig.quesited]} = the quesited.{horary.aboutHouse && horary.aboutHouse !== 1 ? ` (${ordinal(horary.topicHouse ?? 7)} counted from the ${ordinal(horary.aboutHouse)}: (${horary.aboutHouse} − 1) + ${horary.topicHouse ?? 7} = ${quesitedHouse}.)` : ""}</p>
      </div>
      <div className="space-y-1">
        <BHead>Positions at {new Date(utc).toISOString().slice(0, 16).replace("T", " ")} UTC</BHead>
        <BTable
          head={["Planet", "Position", "House", "Speed / Day", "Moiety"]}
          rows={SEVEN.map((pl) => {
            const b = p.bodies.find((x) => x.id === pl)!;
            return [`${BODIES[pl].glyph} ${Name(pl)}`, `${fmtDeg(b.lon)} ${signOf(b.lon).name}`, b.house, `${b.speed < 0 ? "−" : ""}${Math.abs(b.speed).toFixed(3)}°${b.speed < 0 ? " ℞" : ""}`, `${MOIETY[pl]}°`];
          })}
        />
      </div>
      {m && pairs.map(([a, b]) => {
        const ev = aspectBetween(m, a, b);
        return (
          <div key={a + b} className="space-y-1">
            <BHead>{Name(a)} and {NAME[b]}: aspects checked</BHead>
            <BTable
              head={["Aspect", "Separation", "From Exact", "Orb Limit", "In Orb"]}
              rows={aspectChecks(m, a, b).map((c) => [c.aspect.charAt(0).toUpperCase() + c.aspect.slice(1), `${c.separation.toFixed(2)}°`, `${c.off.toFixed(2)}°`, `${c.limit}° (${MOIETY[a]} + ${MOIETY[b]})`, c.inOrb ? "Yes" : "No"])}
            />
            {ev && (
              <p>
                Closest: {ev.aspect}, {ev.orb.toFixed(2)}° from exact, {ev.applying ? `applying (${NAME[ev.applier]} is faster)` : "separating"}.
                {ev.perfectsAt ? ` Followed forward in the ephemeris, it perfects at ${new Date(ev.perfectsAt).toISOString().slice(0, 16).replace("T", " ")} UTC.` : ev.refranation ? ` ${Name(ev.refranation)} stations before the aspect perfects (refranation).` : ev.applying ? " It doesn’t perfect while the planets stay within orb." : ""}
              </p>
            )}
          </div>
        );
      })}
      <div className="space-y-1">
        <BHead>Timing Rule (Lilly)</BHead>
        <BTable head={["Sign", "Angular", "Succedent", "Cadent"]} rows={[["Cardinal", "Days", "Weeks", "Months"], ["Mutable", "Weeks", "Months", "Months"], ["Fixed", "Months", "Years", "Years"]]} />
        <p>One unit per degree to perfection, from the applying significator’s sign and house.</p>
      </div>
      {hour && (
        <div className="space-y-1">
          <BHead>Planetary Hour</BHead>
          <p>
            {hour.night ? "Night" : "Day"} from {local(hour.periodStart)} to {local(hour.periodEnd)} local time ({hour.night ? "sunset to sunrise" : "sunrise to sunset"}, NOAA calculation), divided into 12 hours of {Math.round(hour.hourLength / 60_000)} minutes.
            The question at {horary.at.slice(11, 16)} falls in hour {hour.index + 1} of 24 counted from sunrise. The day is ruled by {NAME[hour.dayRuler]}; counting hours in Chaldean order from it: {seq.map((x) => Name(x)).join(" → ")}.
          </p>
          {agree && <p>Agreement: {agree.how} Tests, in order: the same planet rules the hour and the Ascendant; the hour’s ruler is a triplicity ruler of the Ascendant; the hour’s ruler has the Ascendant sign’s nature.</p>}
        </div>
      )}
      <p className="text-[11.5px] text-muted">Sign of the Ascendant: {SIGNS[Math.floor(p.asc / 30)]!.name}. Positions from Swiss Ephemeris; aspects use the five Ptolemaic aspects.</p>
    </Breakdown>
  );
}
