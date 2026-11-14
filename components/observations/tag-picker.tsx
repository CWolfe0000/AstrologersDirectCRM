"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { ASPECTS, BODIES, PLANET_IDS, type AspectId, type BodyId } from "@/lib/astro";
import { cn } from "@/lib/utils";

const MAJOR: AspectId[] = ["conjunction", "opposition", "trine", "square", "sextile", "quincunx"];
const POINTS: BodyId[] = [...PLANET_IDS, "asc", "mc"];

function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-md border px-1.5 text-[12px] transition-colors",
        on ? "border-accent bg-accent-50 text-accent" : "border-line bg-surface text-ink-3 hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

export function TagPicker({
  planets,
  aspects,
  houses,
  tags,
  onChange,
  compact,
}: {
  planets: BodyId[];
  aspects: AspectId[];
  houses: number[];
  tags: string[];
  onChange: (p: { planets?: BodyId[]; aspects?: AspectId[]; houses?: number[]; tags?: string[] }) => void;
  compact?: boolean;
}) {
  const [tag, setTag] = React.useState("");
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const addTag = () => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange({ tags: [...tags, t] });
    setTag("");
  };
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11.5px] font-medium text-muted">Planets & points</p>
        <div className="flex flex-wrap gap-1">
          {POINTS.map((p) => (
            <Chip key={p} on={planets.includes(p)} onClick={() => onChange({ planets: toggle(planets, p) })} title={BODIES[p].name}>
              <span className={cn(p !== "asc" && p !== "mc" && "glyph text-[14px]")}>{BODIES[p].glyph}</span>
              {!compact && p !== "asc" && p !== "mc" && <span className="hidden sm:inline">{BODIES[p].short}</span>}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11.5px] font-medium text-muted">Aspects</p>
        <div className="flex flex-wrap gap-1">
          {MAJOR.map((a) => (
            <Chip key={a} on={aspects.includes(a)} onClick={() => onChange({ aspects: toggle(aspects, a) })} title={ASPECTS[a].name}>
              <span className="glyph text-[13px]">{ASPECTS[a].glyph}</span> {ASPECTS[a].name}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11.5px] font-medium text-muted">Houses</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <Chip key={h} on={houses.includes(h)} onClick={() => onChange({ houses: toggle(houses, h).sort((a, b) => a - b) })}>
              {h}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11.5px] font-medium text-muted">Tags</p>
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((t) => (
            <span key={t} className="inline-flex h-7 items-center gap-1 rounded-md bg-canvas-2 pl-2 pr-1 text-[12px] text-ink-3">
              #{t}
              <button type="button" onClick={() => onChange({ tags: tags.filter((x) => x !== t) })} className="rounded p-0.5 hover:bg-canvas-3" aria-label={`Remove ${t}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <span className="inline-flex h-7 items-center rounded-md border border-dashed border-line-strong pl-2">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag"
              className="w-20 bg-transparent text-[12px] outline-none placeholder:text-muted/70"
            />
            <button type="button" onClick={addTag} className="px-1.5 text-muted hover:text-ink" aria-label="Add tag">
              <Plus className="size-3.5" />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
