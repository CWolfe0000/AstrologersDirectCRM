"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Scale } from "lucide-react";
import { api } from "@/lib/api";
import { BODIES, ordinal, type ChartView } from "@/lib/astro";
import { ABOUT, HORARY_TOPICS, NAME, Name, aspectBetween, derivedHouse, hourAgreement, perfectionTestimonies, planetaryHour, significators, strengthOf, timingUnit, type Motion, type Testimony } from "@/lib/astro/horary-judgment";
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
