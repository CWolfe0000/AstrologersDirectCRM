"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, RotateCcw, Plus } from "lucide-react";
import { ASPECTS, BODIES, EXTRA_POINT_IDS, HOUSE_SYSTEMS, PLANET_IDS, ZODIACS, chartTypeMeta, type AspectId, type BodyId, type ChartSettings, type HouseSystem, type ZodiacType } from "@/lib/astro";
import type { ChartRecord } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtClock, fmtDate } from "@/lib/utils";
import { relationshipLabel } from "@/components/clients/dialogs";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const ALL_ASPECTS = Object.keys(ASPECTS) as AspectId[];
const POINTS: BodyId[] = [...PLANET_IDS, ...EXTRA_POINT_IDS];

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-b border-line px-4 py-4 last:border-0", className)}>
      <p className="eyebrow mb-2.5">{title}</p>
      {children}
    </section>
  );
}

export function ChartControls({
  chart,
  settings,
  onChange,
  refDate,
  onRefDate,
  dirty,
  onReset,
  onSaveConfig,
}: {
  chart: ChartRecord;
  settings: ChartSettings;
  onChange: (patch: Partial<ChartSettings>) => void;
  refDate?: string;
  onRefDate: (d: string) => void;
  dirty: boolean;
  onReset: () => void;
  onSaveConfig: (name: string) => void;
}) {
  const router = useRouter();
  const people = useStore((s) => s.people);
  const charts = useStore((s) => s.charts);
  const meta = chartTypeMeta(chart.type);
  const subjects = chart.personIds.map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const siblings = charts.filter((c) => c.clientId === chart.clientId);
  const [cfgName, setCfgName] = React.useState(chart.savedConfig ?? "");
  const [naming, setNaming] = React.useState(false);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="text-[13px]">
      <Section title="Chart">
        <p className="font-medium text-ink">{meta.name}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">{meta.description}</p>
        <Select className="mt-3" value={chart.id} onChange={(e) => router.push(`/app/charts/${e.target.value}`)} aria-label="Switch chart">
          {siblings.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </Select>
        <Link href={`/app/charts/new?client=${chart.clientId}&type=transits`} className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline">
          <Plus className="size-3" /> New chart for this client
        </Link>
      </Section>

      {chart.type === "election" && chart.election ? (
        <Section title="Elected Moment">
          <div className="rounded-lg border border-line bg-canvas/50 p-2.5">
            <p className="font-medium text-ink">For {personName(subjects[0])}</p>
            <p className="mt-0.5 text-[12px] text-muted">{fmtDate(chart.election.at.slice(0, 10))} · {fmtClock(chart.election.at.slice(11, 16))}</p>
            <p className="text-[12px] text-muted">{chart.election.place}</p>
          </div>
        </Section>
      ) : chart.type === "horary" && chart.horary ? (
        <Section title="Question & Moment">
          <div className="rounded-lg border border-line bg-canvas/50 p-2.5">
            <p className="font-medium text-ink">Querent: {personName(subjects[0])}</p>
            <p className="mt-0.5 text-[12px] text-muted">{fmtDate(chart.horary.at.slice(0, 10))} · {fmtClock(chart.horary.at.slice(11, 16))}</p>
            <p className="text-[12px] text-muted">{chart.horary.place}</p>
          </div>
        </Section>
      ) : (
      <Section title={subjects.length > 1 ? "Subjects & Birth Data" : "Subject & Birth Data"}>
        <div className="space-y-2.5">
          {subjects.map((p, i) => (
            <div key={p!.id} className="rounded-lg border border-line bg-canvas/50 p-2.5">
              <p className="flex items-center justify-between font-medium text-ink">
                {personName(p)}
                {subjects.length > 1 && <span className="text-[10.5px] font-normal text-muted">{i === 0 ? "Inner" : "Outer"}</span>}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                {fmtDate(p!.birth.date)} · {fmtClock(p!.birth.time)}
              </p>
              <p className="text-[12px] text-muted">{p!.birth.place}</p>
              <p className={cn("mt-1 text-[11px]", p!.birth.timeAccuracy === "exact" ? "text-sage-dark" : "text-warn")}>
                Birth time: {p!.birth.timeAccuracy}
                {p!.relationship ? ` · ${relationshipLabel(p!.relationship)}` : ""}
              </p>
            </div>
          ))}
        </div>
        {meta.timing && (
          <label className="mt-3 block">
            <span className="mb-1 block text-[12px] text-muted">{chart.type === "solar-return" ? "Return date" : chart.type === "lunar-return" || chart.type === "planetary-return" ? "Next return on or after" : "Reference date"}</span>
            <Input type="date" value={refDate ?? ""} onChange={(e) => e.target.value && onRefDate(e.target.value)} />
          </label>
        )}
      </Section>
      )}

      <Section title="Houses, Zodiac & Rulership">
        <div className="space-y-2">
          <Select value={settings.houseSystem} onChange={(e) => onChange({ houseSystem: e.target.value as HouseSystem })} aria-label="House system">
            {HOUSE_SYSTEMS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
          <Select value={settings.zodiac} onChange={(e) => onChange({ zodiac: e.target.value as ZodiacType })} aria-label="Zodiac">
            {ZODIACS.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </Select>
          <Select value={settings.rulership ?? "traditional"} onChange={(e) => onChange({ rulership: e.target.value as "traditional" | "modern" })} aria-label="Rulership">
            <option value="traditional">Traditional rulers</option>
            <option value="modern">Modern rulers</option>
          </Select>
        </div>
      </Section>

      <Section title="Planets & Points">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          {POINTS.map((b) => (
            <Checkbox
              key={b}
              checked={settings.bodies.includes(b)}
              onChange={() => onChange({ bodies: toggle(settings.bodies, b) })}
              label={
                <span className="flex items-center gap-1.5 text-[12.5px]">
                  <span className={b === "vertex" ? "w-4 text-center text-[10px] font-semibold" : "glyph w-4 text-center text-[14px]"}>{BODIES[b].glyph}</span>
                  {BODIES[b].name}
                </span>
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Aspects & Orbs">
        <div className="space-y-2">
          {ALL_ASPECTS.map((a) => {
            const on = settings.aspects.includes(a);
            const orb = settings.orbs[a] ?? ASPECTS[a].defaultOrb;
            return (
              <div key={a}>
                <div className="flex items-center justify-between">
                  <Checkbox
                    checked={on}
                    onChange={() => onChange({ aspects: toggle(settings.aspects, a) })}
                    label={
                      <span className="flex items-center gap-1.5 text-[12.5px]">
                        <span className="glyph w-4 text-center">{ASPECTS[a].glyph}</span>
                        {ASPECTS[a].name}
                      </span>
                    }
                  />
                  <span className={cn("tabular-nums text-[12px]", on ? "text-ink-3" : "text-muted")}>{orb.toFixed(1)}°</span>
                </div>
                {on && (
                  <input
                    type="range"
                    min={0.5}
                    max={12}
                    step={0.5}
                    value={orb}
                    onChange={(e) => onChange({ orbs: { ...settings.orbs, [a]: parseFloat(e.target.value) } })}
                    aria-label={`${ASPECTS[a].name} orb`}
                    className="mt-1 h-1 w-full cursor-pointer accent-[#824B59]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Display">
        <div className="space-y-2.5">
          {(
            [
              ["showAspectLines", "Aspect Lines"],
              ["showHouseCusps", "House Cusps"],
              ["showDegrees", "Degree Labels"],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="flex items-center justify-between text-[12.5px]">
              {l}
              <Switch checked={settings[k]} onCheckedChange={(v) => onChange({ [k]: v })} />
            </label>
          ))}
          <label className="flex items-center justify-between gap-2 text-[12.5px]">
            Wheel Style
            <select aria-label="Wheel style" value={settings.wheelStyle ?? "detailed"} onChange={(e) => onChange({ wheelStyle: e.target.value as "detailed" | "classic" })} className="h-8 rounded-md border border-line bg-surface px-2 text-[12.5px]">
              <option value="detailed">Detailed</option>
              <option value="classic">Classic</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 text-[12.5px]">
            Wheel Colors
            <select aria-label="Wheel colors" value={settings.wheelColors ?? "color"} onChange={(e) => onChange({ wheelColors: e.target.value as "color" | "muted" })} className="h-8 rounded-md border border-line bg-surface px-2 text-[12.5px]">
              <option value="color">Color</option>
              <option value="muted">Muted</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Configuration" className="sticky bottom-0 bg-surface">
        {chart.savedConfig && !naming && (
          <p className="mb-2 flex items-center gap-1.5 text-[12px] text-sage-dark">
            <Bookmark className="size-3.5" /> Saved as “{chart.savedConfig}”
          </p>
        )}
        {naming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (cfgName.trim()) {
                onSaveConfig(cfgName.trim());
                setNaming(false);
              }
            }}
            className="space-y-2"
          >
            <Input autoFocus value={cfgName} onChange={(e) => setCfgName(e.target.value)} placeholder="e.g. Whole sign, tight orbs" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">Save</Button>
              <Button variant="secondary" size="sm" onClick={() => setNaming(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => setNaming(true)}>
              <Bookmark /> Save as Configuration
            </Button>
            <Button variant="secondary" size="icon-sm" onClick={onReset} disabled={!dirty} title="Reset to saved settings" aria-label="Reset to saved settings">
              <RotateCcw />
            </Button>
          </div>
        )}
        {dirty && !naming && <p className="mt-2 text-[11.5px] text-warn">Unsaved display changes</p>}
      </Section>
    </div>
  );
}
