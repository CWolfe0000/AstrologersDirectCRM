import type { Client, ClientWork, Consultation, Reading, ReadingKind, WorkResponse } from "@/lib/data/types";

export type Range = "30d" | "90d" | "12m" | "all";

export type MonthRow = { key: string; label: string; consultations: number; newClients: number; returningClients: number; deliveries: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(key: string, n: number) {
  const [y, m] = key.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** [from, to) date strings for the current and previous period. "all" starts at the first record. */
export function periods(range: Range, today: string, earliest: string) {
  const to = addDays(today, 1);
  const from = range === "30d" ? addDays(to, -30) : range === "90d" ? addDays(to, -90) : range === "12m" ? addDays(to, -365) : earliest < to ? earliest : today;
  const span = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
  return { from, to, prevFrom: addDays(from, -span), prevTo: from };
}

const day = (s: string | undefined) => (s ?? "").slice(0, 10);
const inP = (s: string | undefined, from: string, to: string) => {
  const d = day(s);
  return !!d && d >= from && d < to;
};

/** Every figure on the Reports page, from the practice's own records. */
export function computeReport(
  data: { clients: Client[]; consultations: Consultation[]; readings: Reading[]; clientWork: ClientWork[]; workResponses: WorkResponse[] },
  range: Range,
  today: string,
) {
  const clients = data.clients.filter((c) => c.status !== "archived");
  // Sessions that happened: not cancelled or no-show, and not in the future.
  const held = data.consultations.filter((k) => (k.status === "completed" || k.status === "scheduled") && day(k.start) <= today).sort((a, b) => a.start.localeCompare(b.start));
  const delivered = data.readings.filter((r) => r.status === "delivered" && (r.deliveredAt || r.createdAt));
  const deliveredOn = (r: Reading) => r.deliveredAt ?? r.createdAt;

  const dates = [...data.clients.map((c) => c.createdAt), ...held.map((k) => k.start), ...delivered.map(deliveredOn)].map(day).filter(Boolean).sort();
  const p = periods(range, today, dates[0] ?? today);

  const firstSession = new Map<string, string>();
  for (const k of held) if (!firstSession.has(k.clientId)) firstSession.set(k.clientId, day(k.start));
  /** Clients seen in [from, to) who had already had a session before it. */
  const returning = (from: string, to: string) => new Set(held.filter((k) => inP(k.start, from, to) && (firstSession.get(k.clientId) ?? to) < from).map((k) => k.clientId)).size;
  const count = <T,>(xs: T[], at: (x: T) => string | undefined, from: string, to: string) => xs.filter((x) => inP(at(x), from, to)).length;

  const totals = {
    clients: clients.length,
    newClients: count(data.clients, (c) => c.createdAt, p.from, p.to),
    newClientsPrev: count(data.clients, (c) => c.createdAt, p.prevFrom, p.prevTo),
    returning: returning(p.from, p.to),
    returningPrev: returning(p.prevFrom, p.prevTo),
    consultations: count(held, (k) => k.start, p.from, p.to),
    consultationsPrev: count(held, (k) => k.start, p.prevFrom, p.prevTo),
    deliveries: count(delivered, deliveredOn, p.from, p.to),
    deliveriesPrev: count(delivered, deliveredOn, p.prevFrom, p.prevTo),
  };

  // Monthly chart: at least six months, ending this month.
  const lastKey = today.slice(0, 7);
  const firstKey = [addMonths(lastKey, -5), p.from.slice(0, 7)].sort()[0]!;
  const months: MonthRow[] = [];
  for (let key = firstKey; key <= lastKey; key = addMonths(key, 1)) {
    const from = `${key}-01`;
    const to = `${addMonths(key, 1)}-01`;
    months.push({
      key,
      label: `${MONTHS[Number(key.slice(5)) - 1]}${key.slice(0, 4) !== lastKey.slice(0, 4) ? ` ’${key.slice(2, 4)}` : ""}`,
      consultations: count(held, (k) => k.start, from, to),
      newClients: count(data.clients, (c) => c.createdAt, from, to),
      returningClients: returning(from, to),
      deliveries: count(delivered, deliveredOn, from, to),
    });
  }
  const highlighted = new Set(months.filter((m) => `${addMonths(m.key, 1)}-01` > p.from).map((m) => m.key));

  const kinds: { kind: ReadingKind | "document"; name: string }[] = [
    { kind: "pdf", name: "PDF" },
    { kind: "document", name: "Document" },
    { kind: "audio", name: "Audio" },
    { kind: "video", name: "Video" },
    { kind: "link", name: "Link" },
  ];
  const deliveredInRange = delivered.filter((r) => inP(deliveredOn(r), p.from, p.to));
  const deliveryTypes = kinds.map((k) => ({ name: k.name, value: deliveredInRange.filter((r) => r.kind === k.kind).length })).filter((k) => k.value > 0);

  const byType = new Map<string, { count: number; minutes: number }>();
  for (const k of held.filter((k) => inP(k.start, p.from, p.to))) {
    const t = byType.get(k.type) ?? { count: 0, minutes: 0 };
    t.count++;
    t.minutes += k.durationMin || 0;
    byType.set(k.type, t);
  }
  const types = [...byType.entries()].map(([name, t]) => ({ name, count: t.count, avg: Math.round(t.minutes / t.count) })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Between Sessions: work shared in the period, and how clients engaged with it.
  const shared = data.clientWork.filter((w) => w.status !== "draft" && inP(w.sharedAt ?? w.createdAt, p.from, p.to));
  const ids = new Set(shared.map((w) => w.id));
  const resp = data.workResponses.filter((r) => ids.has(r.workId));
  const lastMark = (id: string) => resp.filter((r) => r.workId === id && r.type !== "entry").sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)?.type;
  const between = {
    shared: shared.length,
    responded: shared.filter((w) => resp.some((r) => r.workId === w.id)).length,
    done: shared.filter((w) => w.status === "completed" || lastMark(w.id) === "done").length,
    entries: resp.filter((r) => r.type === "entry").length,
    clients: new Set(shared.map((w) => w.clientId)).size,
  };

  return { period: p, totals, months, highlighted, deliveryTypes, types, between };
}

/** The monthly figures as CSV. */
export function monthsCsv(months: MonthRow[]) {
  const rows = [["Month", "Consultations", "New clients", "Returning clients", "Readings delivered"], ...months.map((m) => [m.key, m.consultations, m.newClients, m.returningClients, m.deliveries])];
  return rows.map((r) => r.join(",")).join("\n") + "\n";
}
