import { describe, expect, it } from "vitest";
import { computeReport, monthsCsv, periods } from "@/components/reports/report-data";
import type { Client, ClientWork, Consultation, Reading, WorkResponse } from "@/lib/data/types";

const client = (id: string, createdAt: string, status: Client["status"] = "active"): Client => ({ id, email: "", status, createdAt, tags: [], portalAccess: "none" });
const session = (id: string, clientId: string, start: string, status: Consultation["status"] = "completed", type = "Natal Reading", durationMin = 60): Consultation => ({
  id, clientId, type, start, durationMin, status, location: "Video call", chartIds: [], readingIds: [], recordingIds: [],
});
const reading = (id: string, kind: Reading["kind"], deliveredAt: string, status: Reading["status"] = "delivered") =>
  ({ id, clientId: "a", title: id, kind, status, createdAt: deliveredAt, deliveredAt }) as Reading;

const TODAY = "2026-11-17";
const data = {
  clients: [client("a", "2025-01-10"), client("b", "2026-10-30"), client("c", "2026-11-02"), client("z", "2026-11-03", "archived")],
  consultations: [
    session("k1", "a", "2025-02-01T10:00:00"), // a's first session, long ago
    session("k2", "a", "2026-11-05T10:00:00", "completed", "Transit Review", 90), // a returns
    session("k3", "b", "2026-11-06T10:00:00"), // b's first session: new, not returning
    session("k4", "c", "2026-11-08T10:00:00", "cancelled"), // cancelled: not counted
    session("k5", "c", "2026-11-20T10:00:00", "scheduled"), // future: not counted
    session("k6", "b", "2026-09-01T10:00:00", "no-show"),
  ],
  readings: [reading("r1", "pdf", "2026-11-06T12:00:00"), reading("r2", "audio", "2026-10-01T12:00:00"), reading("r3", "video", "2026-11-07T12:00:00", "draft")],
  clientWork: [
    { id: "w1", clientId: "a", kind: "journal", title: "t", instructions: "", status: "shared", sharedAt: "2026-11-05T11:00:00", createdAt: "2026-11-05T11:00:00", updatedAt: "2026-11-05T11:00:00" },
    { id: "w2", clientId: "b", kind: "goal", title: "t", instructions: "", status: "shared", sharedAt: "2026-11-06T11:00:00", createdAt: "2026-11-06T11:00:00", updatedAt: "2026-11-06T11:00:00" },
    { id: "w3", clientId: "b", kind: "goal", title: "draft", instructions: "", status: "draft", createdAt: "2026-11-06T11:00:00", updatedAt: "2026-11-06T11:00:00" },
  ] as ClientWork[],
  workResponses: [
    { id: "x1", workId: "w1", clientId: "a", type: "entry", text: "hi", createdAt: "2026-11-06T09:00:00" },
    { id: "x2", workId: "w1", clientId: "a", type: "done", createdAt: "2026-11-07T09:00:00" },
  ] as WorkResponse[],
};

describe("reports", () => {
  it("periods: last 30 days and the 30 before", () => {
    expect(periods("30d", TODAY, "2025-01-01")).toEqual({ from: "2026-10-19", to: "2026-11-18", prevFrom: "2026-09-19", prevTo: "2026-10-19" });
  });

  it("counts from real records only", () => {
    const r = computeReport(data, "30d", TODAY);
    expect(r.totals.clients).toBe(3); // archived excluded
    expect(r.totals.newClients).toBe(3); // b, c and archived z joined in the period
    expect(r.totals.consultations).toBe(2); // k2, k3 (not cancelled, not future)
    expect(r.totals.returning).toBe(1); // a had a session before
    expect(r.totals.deliveries).toBe(1); // r1; r2 is older, r3 a draft
    expect(r.deliveryTypes).toEqual([{ name: "PDF", value: 1 }]);
    expect(r.types).toEqual([
      { name: "Natal Reading", count: 1, avg: 60 },
      { name: "Transit Review", count: 1, avg: 90 },
    ]);
    expect(r.between).toEqual({ shared: 2, responded: 1, done: 1, entries: 1, clients: 2 });
  });

  it("monthly rows cover at least six months, ending this month", () => {
    const r = computeReport(data, "30d", TODAY);
    expect(r.months.map((m) => m.key)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    const nov = r.months.at(-1)!;
    expect(nov).toMatchObject({ consultations: 2, newClients: 2, returningClients: 1, deliveries: 1 });
    expect([...r.highlighted]).toEqual(["2026-10", "2026-11"]);
    expect(monthsCsv(r.months).split("\n")[0]).toBe("Month,Consultations,New clients,Returning clients,Readings delivered");
  });

  it("'all' starts at the first record", () => {
    const r = computeReport(data, "all", TODAY);
    expect(r.period.from).toBe("2025-01-10");
    expect(r.totals.consultations).toBe(3);
    expect(r.months[0]!.key).toBe("2025-01");
  });
});
