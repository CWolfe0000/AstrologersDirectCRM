/**
 * Seeded demonstration history for Reports & Insights.
 * Represents a mid-sized independent practice; NOT derived from real data.
 */
export interface MonthPoint {
  key: string; // YYYY-MM
  label: string; // "Nov"
  consultations: number;
  newClients: number;
  returningClients: number;
  deliveries: { pdf: number; audio: number; video: number; link: number };
  types: Record<string, number>;
}

export const CONSULT_TYPES = [
  { name: "Natal Reading", avg: 90 },
  { name: "Transit Review", avg: 60 },
  { name: "Relationship Synastry", avg: 90 },
  { name: "Career Timing", avg: 60 },
  { name: "Solar Return Reading", avg: 60 },
  { name: "Annual Review", avg: 75 },
  { name: "Follow-up", avg: 30 },
  { name: "Rectification", avg: 90 },
];
const TYPE_WEIGHTS = [0.2, 0.24, 0.12, 0.13, 0.1, 0.08, 0.09, 0.04];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function demoSeries(): MonthPoint[] {
  const r = rng(20261114);
  const out: MonthPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(2026, 10 - i, 1);
    const m = d.getMonth();
    const growth = 1 + (23 - i) * 0.018;
    const season = 1 + 0.18 * Math.cos(((m - 0) / 12) * Math.PI * 2) + (m === 11 ? 0.12 : 0);
    const partial = i === 0 ? 0.48 : 1; // November is in progress
    const consultations = Math.round((20 + r() * 7) * growth * season * partial);
    const newClients = Math.max(1, Math.round((3 + r() * 4) * growth * (m === 0 ? 1.4 : 1) * partial));
    const returningClients = Math.round(consultations * (0.55 + r() * 0.12));
    const del = Math.round(consultations * (0.62 + r() * 0.15));
    const video = Math.round(del * (0.12 + (23 - i) * 0.008));
    const audio = Math.round(del * 0.28);
    const link = Math.round(del * 0.07);
    const types: Record<string, number> = {};
    let left = consultations;
    CONSULT_TYPES.forEach((t, j) => {
      const n = j === CONSULT_TYPES.length - 1 ? left : Math.min(left, Math.round(consultations * TYPE_WEIGHTS[j]! * (0.8 + r() * 0.4)));
      types[t.name] = Math.max(0, n);
      left -= types[t.name]!;
    });
    out.push({
      key: `${d.getFullYear()}-${String(m + 1).padStart(2, "0")}`,
      label: `${MONTHS[m]}${m === 0 || i === 23 ? ` ’${String(d.getFullYear()).slice(2)}` : ""}`,
      consultations,
      newClients,
      returningClients,
      deliveries: { pdf: Math.max(0, del - video - audio - link), audio, video, link },
      types,
    });
  }
  return out;
}

export const BASE_CLIENTS = 58; // active clients before the 24-month window
