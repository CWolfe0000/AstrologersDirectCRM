"use client";

import * as React from "react";
import { BODIES, ordinal, type BodyId, type ChartView } from "@/lib/astro";
import { ageOn, dignityTable, firdaria, isDayChart, lots, profection, releasingL1, releasingL2, signName, type Planet7 } from "@/lib/astro/traditional";
import { lengthOfLife, obliquity, vitalSector, type ReleaserId } from "@/lib/astro/length-of-life";
import { cn, TODAY } from "@/lib/utils";
import { Segmented } from "@/components/ui/tabs";

const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const G = ({ id }: { id: BodyId | "southnode" }) => <span className="glyph text-[15px]" title={BODIES[id as BodyId]?.name}>{BODIES[id as BodyId]?.glyph}</span>;
const h3 = "mb-2 text-[13px] font-semibold text-ink";
const th = "px-1.5 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted";
const td = "border-b border-line/60 px-1.5 py-1.5 text-[12.5px]";

const RELEASER: Record<ReleaserId, string> = { sun: "Sun", moon: "Moon", asc: "Ascendant", fortune: "Lot of Fortune" };
const pos = (lon: number) => `${Math.floor(lon % 30)}° ${signName(Math.floor(lon / 30))}`;
const yrs = (n: number) => `${Math.round(n * 10) / 10} years`;

/** Length of life: releaser and giver of years, and Valens' vital sector. Closed until the practitioner opens it. */
function LengthOfLife({ view, birthUtc, lat }: { view: ChartView; birthUtc: string; lat?: number }) {
  const p = view.inner;
  const r = React.useMemo(() => lengthOfLife(p), [p]);
  if (!r) return null;
  const tropical = view.settings.zodiac === "tropical";
  const sector = tropical && lat !== undefined ? vitalSector(p, r.releaser.lon, lat, obliquity(birthUtc)) : null;
  const g = r.giver;
  return (
    <details className="group rounded-lg border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        Length of Life
        <span className="text-[11.5px] font-normal text-muted group-open:hidden">Show</span>
        <span className="hidden text-[11.5px] font-normal text-muted group-open:inline">Hide</span>
      </summary>
      <div className="space-y-4 border-t border-line px-3 py-3">
        <p className="rounded-lg bg-warn-50 px-3 py-2 text-[12.5px] text-ink-3">
          A historical technique, shown so the working can be studied. The ancient authors disagree with each other, the two methods below rarely agree, and neither has been shown to predict how long anyone lives.
        </p>

        <div>
          <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Releaser and Giver of Years</p>
          <ul className="mb-2 text-[12px]">
            {r.candidates.map((c) => (
              <li key={c.id} className={cn("flex justify-between gap-3 border-b border-line/60 py-1", c === r.releaser && "font-semibold text-accent")}>
                <span>{RELEASER[c.id]} <span className="font-normal text-muted">{pos(c.lon)}, {ordinal(c.house)} House</span></span>
                <span className="text-right font-normal text-muted">{!c.placed ? "Not in a releasing place" : c.giver ? `Giver: ${BODIES[c.giver].name}` : "No planet with dignity aspects it"}</span>
              </li>
            ))}
          </ul>
          {g && r.years !== null ? (
            <div className="rounded-lg border border-line px-3 py-2 text-[13px]">
              <p>
                Releaser (hyleg): <b className="font-medium">{RELEASER[r.releaser.id]}</b>. Giver of years (alcocoden): <b className="font-medium"><G id={g.id} /> {BODIES[g.id].name}</b>, which holds {g.dignities.join(", ").toLowerCase()} at that degree and {g.aspect === "Conjunction" ? "is in the same sign" : `aspects it by ${g.aspect.toLowerCase()}`}.
              </p>
              <ul className="mt-1.5 text-[12.5px] tabular-nums">
                <li className="flex justify-between"><span>{BODIES[g.id].name} in the {ordinal(g.house)} House: {g.grant} years</span><span>{g.years}</span></li>
                {r.changes.map((c) => (
                  <li key={c.id} className="flex justify-between"><span>{BODIES[c.id].name}, {c.aspect.toLowerCase()} to {BODIES[g.id].name}</span><span>{c.years > 0 ? `+${c.years}` : `−${-c.years}`}</span></li>
                ))}
                <li className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Total</span><span>{yrs(r.years)}</span></li>
              </ul>
            </div>
          ) : (
            <p className="rounded-lg border border-line px-3 py-2 text-[13px]">No planet with dignity at a releaser's degree aspects it, so this method gives no figure for this chart.</p>
          )}
          <p className="mt-1.5 text-[11.5px] text-muted">Releaser: by day Sun then Moon, by night Moon then Sun, then the Ascendant after a new moon or the Lot of Fortune after a full moon, then the other; a luminary or the Lot must be in the 1st, 7th, 9th, 10th or 11th house. Giver: the planet with most dignity at the releaser's degree that aspects it by sign (ties go to the term ruler). Greater years if the giver is angular, middle if succedent, lesser if cadent. Venus and Jupiter aspecting the giver by sign add their lesser years; Mars and Saturn conjunct, square or opposite take theirs away.</p>
        </div>

        <div>
          <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Vital Sector (Valens)</p>
          {sector ? (
            <div className="rounded-lg border border-line px-3 py-2 text-[13px]">
              From the {RELEASER[r.releaser.id]} at {pos(r.releaser.lon)} to {pos(sector.endLon)}, {sector.cut ? <>the {sector.cut.aspect === "Body" ? "body" : sector.cut.aspect.toLowerCase()} of <G id={sector.cut.id} /> {BODIES[sector.cut.id].name}</> : "a full quadrant with no ray of Mars or Saturn in the way"}: {Math.round(sector.arc * 10) / 10}° of the zodiac, rising in <b className="font-medium">{yrs(sector.years)}</b>.
            </div>
          ) : (
            <p className="rounded-lg border border-line px-3 py-2 text-[13px]">{!tropical ? "Rising times are calculated for the tropical zodiac only." : "Rising times cannot be calculated at this birth latitude."}</p>
          )}
          <p className="mt-1.5 text-[11.5px] text-muted">From the releaser forward to the first body, square or opposition of Mars or Saturn, and no further than 90°. The arc becomes years by its rising time at the birth latitude: one degree of oblique ascension is one year.</p>
        </div>
      </div>
    </details>
  );
}

/** Traditional techniques for a natal chart: dignities, profections, firdaria, zodiacal releasing, length of life. */
export function TraditionalPanel({ view, birthUtc, lat }: { view: ChartView; birthUtc: string; lat?: number }) {
  const p = view.inner;
  const now = Date.parse(`${TODAY}T12:00:00Z`);
  const day = isDayChart(p);
  const rows = dignityTable(p);
  const age = Math.max(0, ageOn(birthUtc, TODAY));
  const houseOf = (id: BodyId) => p.bodies.find((b) => b.id === id)?.house;
  const lotLons = lots(p);
  const [lot, setLot] = React.useState<"spirit" | "fortune">("spirit");
  const l1 = React.useMemo(() => releasingL1(lotLons[lot], birthUtc), [lotLons, lot, birthUtc]);
  const curL1 = l1.find((x) => x.start <= now && now < x.end);
  const l2 = curL1 ? releasingL2(curL1) : [];
  const fortuneSign = Math.floor(lotLons.fortune / 30);
  const angularToFortune = (s: number) => [0, 3, 6, 9].includes((s - fortuneSign + 12) % 12);
  const fird = React.useMemo(() => firdaria(birthUtc, day), [birthUtc, day]);
  const curF = fird.find((f) => f.start <= now && now < f.end);
  const curSub = curF?.subs.find((x) => x.start <= now && now < x.end);

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-canvas-2 px-3 py-2 text-[12.5px] text-ink-3">
        <b className="font-medium text-ink">{day ? "Day Chart" : "Night Chart"}</b> (the Sun is {day ? "above" : "below"} the horizon). Sect decides the triplicity ruler, the lots and the order of the firdaria.
      </p>

      <section>
        <h3 className={h3}>Essential Dignities</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px]">
            <thead className="border-b border-line">
              <tr><th className={th}>Planet</th><th className={th} title="Domicile ruler">Dom.</th><th className={th} title="Exaltation">Exalt.</th><th className={th} title="Triplicity: day, night, participating">Trip.</th><th className={th}>Term</th><th className={th}>Face</th><th className={cn(th, "text-right")} title="Lilly’s points">Pts</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} title={r.has.join(", ")}>
                  <td className={td}><G id={r.id} /> <span className="text-[11px] text-muted">{r.has.filter((h) => h !== "Peregrine" || r.has.length === 1).join(", ")}</span></td>
                  <td className={td}><G id={r.domicile} /></td>
                  <td className={td}>{r.exaltation ? <G id={r.exaltation} /> : "–"}</td>
                  <td className={td}><span className="inline-flex gap-0.5">{r.triplicity.map((t, i) => <span key={i} className={cn((day ? i === 0 : i === 1) ? "" : "opacity-45")}><G id={t} /></span>)}</span></td>
                  <td className={td}><G id={r.term} /></td>
                  <td className={td}><G id={r.face} /></td>
                  <td className={cn(td, "text-right font-medium tabular-nums", r.score > 0 ? "text-sage-dark" : r.score < 0 ? "text-accent" : "")}>{r.score > 0 ? `+${r.score}` : r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted">Egyptian terms, Chaldean faces, Dorothean triplicities (the ruler for this chart's sect is in full color). Lilly's points: domicile 5, exaltation 4, triplicity 3, term 2, face 1; detriment −5, fall −4, peregrine −5. Hover a row for its dignities; almuten of each degree: {rows.map((r) => `${BODIES[r.id].name} → ${r.almuten.map((a) => BODIES[a].name).join("/")}`).join(", ")}.</p>
      </section>

      <section>
        <h3 className={h3}>Annual Profections</h3>
        {(() => {
          const cur = profection(p.asc, age);
          const lh = houseOf(cur.lord as BodyId);
          return (
            <div className="mb-2 rounded-lg border border-line px-3 py-2 text-[13px]">
              Age {age}: the <b className="font-medium">{ordinal(cur.house)} House</b> year, {signName(cur.sign)}. Lord of the Year: <b className="font-medium"><G id={cur.lord} /> {BODIES[cur.lord].name}</b>{lh ? `, natally in the ${ordinal(lh)} House` : ""}.
            </div>
          );
        })()}
        <div className="grid grid-cols-2 gap-x-4 text-[12px] sm:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => age - 2 + i).filter((a) => a >= 0).map((a) => {
            const pr = profection(p.asc, a);
            return (
              <p key={a} className={cn("flex justify-between border-b border-line/60 py-1", a === age && "font-semibold text-accent")}>
                <span>Age {a} · {ordinal(pr.house)}</span>
                <span>{signName(pr.sign).slice(0, 3)} <G id={pr.lord} /></span>
              </p>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={h3}>Firdaria</h3>
        {curF && (
          <div className="mb-2 rounded-lg border border-line px-3 py-2 text-[13px]">
            Now: <b className="font-medium">{BODIES[curF.lord as BodyId].name}</b> period ({fmt(curF.start)} – {fmt(curF.end)})
            {curSub && <>, <b className="font-medium">{BODIES[curSub.lord].name}</b> sub-period until {fmt(curSub.end)}</>}.
          </div>
        )}
        <ul className="text-[12px]">
          {fird.filter((f) => f.end > Date.parse(birthUtc)).slice(0, 12).map((f) => (
            <li key={f.start} className={cn("flex justify-between border-b border-line/60 py-1", f === curF && "font-semibold text-accent")}>
              <span><G id={f.lord as BodyId} /> {BODIES[f.lord as BodyId].name}</span>
              <span className="tabular-nums">{fmt(f.start)} – {fmt(f.end)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[11.5px] text-muted">{day ? "Diurnal" : "Nocturnal"} order, nodes at the end; seven sub-periods per planet in Chaldean order; 365.25-day years.</p>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-ink">Zodiacal Releasing</h3>
          <Segmented size="sm" value={lot} onChange={setLot} options={[{ value: "spirit", label: "Spirit" }, { value: "fortune", label: "Fortune" }]} />
        </div>
        <p className="mb-2 text-[12px] text-muted">Lot of {lot === "spirit" ? "Spirit" : "Fortune"} in {signName(Math.floor(lotLons[lot] / 30))}.</p>
        <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Level 1</p>
        <ul className="mb-3 text-[12px]">
          {l1.slice(0, 8).map((x) => (
            <li key={x.start} className={cn("flex justify-between border-b border-line/60 py-1", x === curL1 && "font-semibold text-accent")}>
              <span>{signName(x.sign)} {angularToFortune(x.sign) && <span className="ml-1 rounded bg-sage-50 px-1 text-[10.5px] font-medium text-sage-dark">Angular to Fortune</span>}</span>
              <span className="tabular-nums">{fmt(x.start)} – {fmt(x.end)}</span>
            </li>
          ))}
        </ul>
        {curL1 && (
          <>
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Level 2 within {signName(curL1.sign)}</p>
            <ul className="text-[12px]">
              {l2.map((x) => (
                <li key={x.start} className={cn("flex justify-between border-b border-line/60 py-1", x.start <= now && now < x.end && "font-semibold text-accent")}>
                  <span>{signName(x.sign)} {x.loosed && <span className="ml-1 rounded bg-warn-50 px-1 text-[10.5px] font-medium text-warn">Loosing of the Bond</span>}</span>
                  <span className="tabular-nums">{fmt(x.start)} – {fmt(x.end)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-1.5 text-[11.5px] text-muted">Minor years of each sign's ruler (Capricorn 27, Aquarius 30), 360-day years; level 2 in 30-day months, with Valens' loosing of the bond after twelve signs.</p>
      </section>

      <LengthOfLife view={view} birthUtc={birthUtc} lat={lat} />
    </div>
  );
}

export type { Planet7 };
