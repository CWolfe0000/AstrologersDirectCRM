"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Download, ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useStore, personName } from "@/lib/store";
import type { ChartPoints } from "@/lib/astro";
import { SITE_URL } from "@/lib/site";
import { DATA_MODE, cn } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { ChartWheel } from "@/components/chart/chart-wheel";
import { SIZES, THEMES, drawCard, moonPhase, weekAspects, type CardContent, type CardSize, type CardTheme } from "./draw-card";

type Template = "bigThree" | "wheel" | "moon" | "transits";
const TEMPLATES: { id: Template; label: string; needsChart: boolean }[] = [
  { id: "bigThree", label: "Big Three", needsChart: true },
  { id: "wheel", label: "Chart Wheel", needsChart: true },
  { id: "moon", label: "Moon Phase", needsChart: false },
  { id: "transits", label: "This Week", needsChart: false },
];

const skyAt = (d: Date) =>
  api<{ points: ChartPoints }>("/api/v1/astro/natal", {
    body: { birth: { date: d.toISOString().slice(0, 10), time: "12:00", timeAccuracy: "exact", place: "Greenwich", lat: 51.48, lon: 0, tz: "UTC" }, settings: { ...useStore.getState().defaults, bodies: ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] } },
  }).then((r) => r.points);

/** Load an SVG element as an image for the canvas (system symbol fonts for the glyphs). */
function svgImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1000");
  clone.setAttribute("height", "1000");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `.glyph{font-family:"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols","DejaVu Sans",sans-serif} text{font-family:Inter,system-ui,sans-serif}`;
  clone.insertBefore(style, clone.firstChild);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The wheel couldn’t be drawn."));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  });
}

/**
 * Share Cards: images for Instagram, Facebook and stories from a client's
 * chart (Big Three, chart wheel) or today's sky (Moon phase, this week's
 * aspects). Every card carries the astrologer's name and booking link.
 */
export function ShareCards() {
  const params = useSearchParams();
  const charts = useStore((s) => s.charts);
  const people = useStore((s) => s.people);
  const defaults = useStore((s) => s.defaults);
  const practitioner = useStore((s) => s.practitioner);
  const toast = useStore((s) => s.toast);
  const natalCharts = React.useMemo(() => charts.filter((c) => c.type === "natal" && people.find((p) => p.id === c.personIds[0])?.birth?.date), [charts, people]);
  const [chartId, setChartId] = React.useState(params.get("chart") ?? natalCharts[0]?.id ?? "");
  const [template, setTemplate] = React.useState<Template>(params.get("chart") ? "bigThree" : "moon");
  const [size, setSize] = React.useState<CardSize>("square");
  const [theme, setTheme] = React.useState<CardTheme>("night");
  const [showName, setShowName] = React.useState(false);
  const [points, setPoints] = React.useState<ChartPoints | null>(null);
  const [sky, setSky] = React.useState<{ date: Date; pts: ChartPoints }[] | null>(null);
  const [link, setLink] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const wheelBox = React.useRef<HTMLDivElement>(null);
  const chart = natalCharts.find((c) => c.id === chartId);
  const person = chart ? people.find((p) => p.id === chart.personIds[0]) : undefined;
  const timeKnown = person?.birth.timeAccuracy !== "unknown";

  // The astrologer's page, for the footer.
  React.useEffect(() => {
    if (DATA_MODE !== "server") return;
    api<{ profile: { slug: string; enabled: boolean } }>("/api/v1/booking").then((r) => setLink(r.profile.enabled ? `${(SITE_URL || window.location.origin + "/book").replace(/^https?:\/\//, "")}/${r.profile.slug}` : (practitioner.website || "").replace(/^https?:\/\//, "")), () => {});
  }, [practitioner.website]);

  // The client's chart.
  React.useEffect(() => {
    if (!person?.birth || DATA_MODE !== "server") return setPoints(null);
    let live = true;
    api<{ points: ChartPoints }>("/api/v1/astro/natal", { body: { birth: person.birth, settings: defaults } }).then((r) => live && setPoints(r.points), (e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [person?.birth, defaults]);

  // Today's sky and the week ahead (daily, at noon UTC).
  React.useEffect(() => {
    if (DATA_MODE !== "server" || (template !== "moon" && template !== "transits") || sky) return;
    const start = new Date();
    start.setUTCHours(12, 0, 0, 0);
    Promise.all(Array.from({ length: 8 }, (_, i) => new Date(start.getTime() + i * 86_400_000)).map((d) => skyAt(d).then((pts) => ({ date: d, pts })))).then(setSky, (e: Error) => setError(e.message));
  }, [template, sky]);

  const draw = React.useCallback(async () => {
    const c = canvas.current;
    if (!c) return;
    await document.fonts.ready;
    const footer = { name: practitioner.name || practitioner.practice || "", link };
    const lon = (p: ChartPoints, id: string) => p.bodies.find((b) => b.id === id)?.lon ?? 0;
    let content: CardContent | null = null;
    if ((template === "bigThree" || template === "wheel") && points) {
      const base = { name: showName && person ? person.firstName : undefined, sun: lon(points, "sun"), moon: lon(points, "moon"), asc: timeKnown ? points.asc : null };
      if (template === "bigThree") content = { kind: "bigThree", ...base };
      else {
        const svg = wheelBox.current?.querySelector("svg");
        if (!svg) return;
        content = { kind: "wheel", ...base, image: await svgImage(svg) };
      }
    } else if (template === "moon" && sky) {
      const today = sky[0]!;
      const m = moonPhase(lon(today.pts, "sun"), lon(today.pts, "moon"));
      content = { kind: "moon", date: new Date(), moonLon: lon(today.pts, "moon"), ...m };
    } else if (template === "transits" && sky) {
      content = { kind: "transits", from: sky[0]!.date, items: weekAspects(sky) };
    }
    if (content) drawCard(c, content, size, theme, footer);
  }, [template, points, sky, size, theme, showName, person, timeKnown, practitioner.name, practitioner.practice, link]);

  React.useEffect(() => { void draw(); }, [draw]);

  const download = () => {
    const c = canvas.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${template}-${size}.png`;
    a.click();
    toast("Card Downloaded", "Ready to post.", "success");
  };

  const tpl = TEMPLATES.find((x) => x.id === template)!;
  const ready = tpl.needsChart ? !!points : !!sky;
  if (DATA_MODE !== "server") return (<div><PageHeader title="Share Cards" /><Card><EmptyState icon={<ImageIcon />} title="Share Cards Are in the Live App" body="Make Instagram-ready images from your clients’ charts and today’s sky." /></Card></div>);

  return (
    <div>
      <PageHeader title="Share Cards" description="Images for Instagram, Facebook and stories, from a chart or today’s sky. Each card carries your name and booking link." />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardBody className="space-y-4">
            <Field label="Card" htmlFor="sc-tpl">
              <Select id="sc-tpl" value={template} onChange={(e) => setTemplate(e.target.value as Template)}>
                {TEMPLATES.map((x) => <option key={x.id} value={x.id}>{x.label}{x.needsChart ? " (From a Chart)" : " (Today’s Sky)"}</option>)}
              </Select>
            </Field>
            {tpl.needsChart && (
              <>
                <Field label="Chart" htmlFor="sc-chart">
                  <Select id="sc-chart" value={chartId} onChange={(e) => setChartId(e.target.value)}>
                    {natalCharts.length === 0 && <option value="">No natal charts yet</option>}
                    {natalCharts.map((c) => { const p = people.find((x) => x.id === c.personIds[0]); return <option key={c.id} value={c.id}>{p ? personName(p) : c.title}</option>; })}
                  </Select>
                </Field>
                <Checkbox checked={showName} onChange={(e) => setShowName(e.target.checked)} label={<span className="text-[13px]">Show their first name <span className="text-muted">(only with their permission)</span></span>} />
                {!timeKnown && <p className="text-[12px] text-muted">The birth time is unknown, so the rising sign is left off.</p>}
              </>
            )}
            <Field label="Size" htmlFor="sc-size">
              <Select id="sc-size" value={size} onChange={(e) => setSize(e.target.value as CardSize)}>
                {(Object.keys(SIZES) as CardSize[]).map((k) => <option key={k} value={k}>{SIZES[k].label} · {SIZES[k].w}×{SIZES[k].h}</option>)}
              </Select>
            </Field>
            <Field label="Colors" htmlFor="sc-theme">
              <Segmented value={theme} onChange={setTheme} options={(Object.keys(THEMES) as CardTheme[]).map((k) => ({ value: k, label: THEMES[k].label }))} />
            </Field>
            <p className="text-[12px] text-muted">Footer: {practitioner.name || "your name"}{link ? ` · ${link}` : " (turn on your booking page to add its link)"}</p>
            {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
            <Button onClick={download} disabled={!ready} className="w-full"><Download /> Download PNG</Button>
          </CardBody>
        </Card>
        <div className="flex items-start justify-center rounded-xl border border-line bg-canvas-2 p-4">
          <canvas ref={canvas} role="img" aria-label={`${tpl.label} card preview`} className={cn("h-auto max-h-[78vh] w-auto max-w-full rounded-lg shadow-card", !ready && "opacity-40")} />
        </div>
      </div>
      {/* The wheel is drawn here (off screen) and copied onto the card. */}
      <div ref={wheelBox} aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 w-[600px]">
        {template === "wheel" && points && <ChartWheel view={{ engine: { id: "swiss", name: "Swiss Ephemeris", verified: false, description: "" }, type: "natal", inner: points, aspects: [] } as never} wheelStyle="detailed" compact />}
      </div>
    </div>
  );
}
