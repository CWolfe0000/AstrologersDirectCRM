"use client";

import { ASPECTS, BODIES, SIGNS, degInSign, norm, type AspectId, type BodyId, type ChartPoints } from "@/lib/astro";

/**
 * Shareable cards for social media, drawn on a canvas so they use the app's
 * own fonts and export straight to PNG at Instagram sizes.
 */
export type CardSize = "square" | "portrait" | "story";
export type CardTheme = "night" | "dusk" | "paper";
export const SIZES: Record<CardSize, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "Square (Feed)" },
  portrait: { w: 1080, h: 1350, label: "Portrait (Feed)" },
  story: { w: 1080, h: 1920, label: "Story" },
};
export const THEMES: Record<CardTheme, { label: string; bg: [string, string]; ink: string; soft: string; accent: string }> = {
  night: { label: "Night", bg: ["#141634", "#2C2148"], ink: "#F4EEDF", soft: "#B9B3CF", accent: "#E7C98A" },
  dusk: { label: "Dusk", bg: ["#4A2A3B", "#824B59"], ink: "#FBF2EE", soft: "#E8CBD2", accent: "#F6D7A7" },
  paper: { label: "Paper", bg: ["#F6F1E8", "#EADFCB"], ink: "#29272B", soft: "#6B6560", accent: "#824B59" },
};

export type CardContent =
  | { kind: "bigThree"; name?: string; sun: number; moon: number; asc: number | null }
  | { kind: "wheel"; name?: string; image: HTMLImageElement; sun: number; moon: number; asc: number | null }
  | { kind: "moon"; date: Date; phase: string; moonLon: number; illumination: number; waxing: boolean }
  | { kind: "transits"; from: Date; items: { text: string; glyphs: string; date: Date }[] };

const SERIF = '"DM Serif Display", Georgia, serif';
const SANS = '"Inter Variable", Inter, system-ui, sans-serif';
const GLYPH = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif';

const signName = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)]!.name;
const signGlyph = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)]!.glyph;
const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Draw one card. `footer` is the astrologer's name and link, so every post leads back to their page. */
export function drawCard(canvas: HTMLCanvasElement, content: CardContent, size: CardSize, theme: CardTheme, footer: { name: string; link: string }) {
  const { w, h } = SIZES[size];
  const t = THEMES[theme];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(1, t.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // A few stars on dark themes.
  if (theme !== "paper") {
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 70; i++) ctx.fillRect(rnd() * w, rnd() * h, rnd() < 0.15 ? 3 : 2, rnd() < 0.15 ? 3 : 2);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const cx = w / 2;
  const text = (s: string, y: number, font: string, color: string) => { ctx.font = font; ctx.fillStyle = color; ctx.fillText(s, cx, y); };
  const tall = h / w;
  // Content sits in the middle band; stories get more room above and below.
  const top = size === "story" ? 330 : size === "portrait" ? 170 : 120;

  if (content.kind === "bigThree" || content.kind === "wheel") {
    text(content.kind === "bigThree" ? "THE BIG THREE" : "BIRTH CHART", top, `600 30px ${SANS}`, t.accent);
    if (content.name) text(content.name, top + 74, `64px ${SERIF}`, t.ink);
    let y = top + (content.name ? 120 : 60);
    if (content.kind === "wheel") {
      const side = Math.min(w - 160, h - y - (size === "square" ? 300 : 380));
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, y + side / 2, side / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.drawImage(content.image, cx - side / 2, y, side, side);
      ctx.restore();
      y += side + 70;
      const parts = [`☉ ${signName(content.sun)}`, `☽ ${signName(content.moon)}`, ...(content.asc !== null ? [`AC ${signName(content.asc)}`] : [])];
      text(parts.join("   ·   "), y, `500 34px ${SANS}`, t.ink);
    } else {
      const rows: [string, string, number][] = [["☉", "Sun", content.sun], ["☽", "Moon", content.moon], ...(content.asc !== null ? [["AC", "Rising", content.asc] as [string, string, number]] : [])];
      const gap = size === "square" ? 230 : 290;
      y += size === "square" ? 110 : 150;
      for (const [g1, label, lon] of rows) {
        // Square cards are tighter: a smaller sign symbol so rows don't touch.
        const sq = size === "square";
        ctx.font = `${sq ? 88 : 120}px ${GLYPH}`;
        ctx.fillStyle = t.accent;
        ctx.fillText(signGlyph(lon), cx, y + (sq ? 5 : 20));
        text(`${label} in ${signName(lon)}`, y + (sq ? 75 : 100), `${sq ? 52 : 56}px ${SERIF}`, t.ink);
        text(`${Math.floor(degInSign(lon))}° ${signName(lon)}${g1 === "AC" ? " Ascendant" : ""}`, y + (sq ? 115 : 145), `400 26px ${SANS}`, t.soft);
        y += gap;
      }
    }
  } else if (content.kind === "moon") {
    text("MOON PHASE", top, `600 30px ${SANS}`, t.accent);
    text(fmtDay(content.date), top + 50, `400 28px ${SANS}`, t.soft);
    // The Moon, lit from the right while waxing.
    const r = Math.min(w, h * 0.6) * 0.27;
    const my = top + 110 + r + (tall > 1.3 ? 120 : 0);
    ctx.fillStyle = theme === "paper" ? "#D8D1C4" : "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.arc(cx, my, r, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, my, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = theme === "paper" ? "#FFFDF7" : "#F4EEDF";
    const k = content.illumination; // 0..1
    const dir = content.waxing ? 1 : -1;
    ctx.beginPath();
    ctx.arc(cx, my, r, -Math.PI / 2, Math.PI / 2, dir < 0);
    ctx.ellipse(cx, my, Math.abs(1 - 2 * k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0.5) === (dir > 0));
    ctx.fill();
    ctx.restore();
    let y = my + r + 110;
    text(content.phase, y, `72px ${SERIF}`, t.ink);
    y += 70;
    text(`Moon in ${signName(content.moonLon)} ${signGlyph(content.moonLon)}`, y, `500 36px ${SANS}`, t.accent);
    y += 50;
    text(`${Math.round(content.illumination * 100)}% Illuminated`, y, `400 28px ${SANS}`, t.soft);
  } else {
    text("THIS WEEK IN THE SKY", top, `600 30px ${SANS}`, t.accent);
    const to = new Date(content.from.getTime() + 6 * 86_400_000);
    text(`${content.from.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`, top + 50, `400 28px ${SANS}`, t.soft);
    let y = top + (size === "square" ? 160 : 230);
    const step = size === "square" ? 150 : 190;
    const shown = content.items.slice(0, size === "square" ? 4 : 6);
    if (!shown.length) text("A quiet week: no major exact aspects.", y + 60, `44px ${SERIF}`, t.ink);
    for (const it of shown) {
      ctx.font = `64px ${GLYPH}`;
      ctx.fillStyle = t.accent;
      ctx.fillText(it.glyphs, cx, y);
      text(it.text, y + 58, `46px ${SERIF}`, t.ink);
      text(it.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }), y + 98, `400 26px ${SANS}`, t.soft);
      y += step;
    }
  }

  // Footer: who made it and where to book.
  ctx.strokeStyle = t.soft;
  ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(cx - 60, h - (size === "story" ? 250 : 150)); ctx.lineTo(cx + 60, h - (size === "story" ? 250 : 150)); ctx.stroke();
  ctx.globalAlpha = 1;
  text(footer.name, h - (size === "story" ? 190 : 95), `40px ${SERIF}`, t.ink);
  if (footer.link) text(footer.link, h - (size === "story" ? 140 : 52), `500 28px ${SANS}`, t.accent);
}

// ——— Sky helpers ——————————————————————————————————————————————————

const PHASES = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
/** Phase from the Sun–Moon elongation. */
export function moonPhase(sun: number, moon: number) {
  const e = norm(moon - sun);
  const idx = Math.floor(norm(e + 22.5) / 45) % 8;
  return { phase: PHASES[idx]!, illumination: (1 - Math.cos((e * Math.PI) / 180)) / 2, waxing: e < 180 };
}

const MAJOR: AspectId[] = ["conjunction", "sextile", "square", "trine", "opposition"];
const SLOWISH: BodyId[] = ["sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

/**
 * Aspects between the planets (not the Moon) that perfect in the week: the
 * separation crosses the exact angle between the two sampled days.
 */
export function weekAspects(days: { date: Date; pts: ChartPoints }[]) {
  const out: { text: string; glyphs: string; date: Date }[] = [];
  const lon = (p: ChartPoints, id: BodyId) => p.bodies.find((b) => b.id === id)?.lon;
  for (let d = 0; d < days.length - 1; d++) {
    const a = days[d]!, b = days[d + 1]!;
    for (let i = 0; i < SLOWISH.length; i++) for (let j = i + 1; j < SLOWISH.length; j++) {
      const p = SLOWISH[i]!, q = SLOWISH[j]!;
      const a1 = lon(a.pts, p), b1 = lon(a.pts, q), a2 = lon(b.pts, p), b2 = lon(b.pts, q);
      if ([a1, b1, a2, b2].some((x) => x === undefined)) continue;
      const sep1 = Math.abs(((a1! - b1! + 540) % 360) - 180), sep2 = Math.abs(((a2! - b2! + 540) % 360) - 180);
      for (const asp of MAJOR) {
        const ang = ASPECTS[asp].angle;
        if ((sep1 - ang) * (sep2 - ang) <= 0 && Math.abs(sep1 - sep2) < 30) {
          const f = sep1 === sep2 ? 0.5 : (ang - sep1) / (sep2 - sep1);
          const date = new Date(a.date.getTime() + Math.max(0, Math.min(1, f)) * (b.date.getTime() - a.date.getTime()));
          out.push({ text: `${BODIES[p].name} ${ASPECTS[asp].name} ${BODIES[q].name}`, glyphs: `${BODIES[p].glyph} ${ASPECTS[asp].glyph} ${BODIES[q].glyph}`, date });
        }
      }
    }
  }
  return out.sort((x, y) => x.date.getTime() - y.date.getTime());
}
