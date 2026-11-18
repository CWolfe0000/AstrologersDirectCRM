import { describe, expect, it } from "vitest";
import { availableSlots } from "@/lib/booking/slots";
import { DEFAULT_RULES, type BookingRules } from "@/lib/booking/types";

// Monday 2026-11-16 08:00 in New York (13:00 UTC).
const NOW = Date.parse("2026-11-16T13:00:00Z");
const rules: BookingRules = { ...DEFAULT_RULES, minNoticeHours: 24, maxAdvanceDays: 7, bufferMin: 15, stepMin: 30 };
const base = { rules, tz: "America/New_York", durationMin: 60, busy: [], now: NOW };

describe("booking availability", () => {
  it("offers weekday slots in the astrologer's hours, after the notice period", () => {
    const s = availableSlots(base);
    expect(s[0]).toBe("2026-11-17T14:00:00.000Z"); // Tue 09:00 New York (Mon 08:00 + 24h notice = Tue 08:00, hours start 09:00)
    expect(s).not.toContain("2026-11-17T21:30:00.000Z"); // 16:30 + 60 min runs past 17:00
    expect(s).toContain("2026-11-17T21:00:00.000Z"); // 16:00–17:00 fits
    expect(s.some((x) => x.startsWith("2026-11-21") || x.startsWith("2026-11-22"))).toBe(false); // weekend off
    expect(s.every((x) => Date.parse(x) <= NOW + 7 * 86_400_000)).toBe(true);
  });

  it("keeps a buffer around existing sessions", () => {
    const busy = [{ start: Date.parse("2026-11-17T16:00:00Z"), end: Date.parse("2026-11-17T17:00:00Z") }]; // 11:00–12:00 NY
    const s = availableSlots({ ...base, busy });
    expect(s).not.toContain("2026-11-17T15:00:00.000Z"); // 10:00–11:00 ends inside the 15-minute buffer
    expect(s).not.toContain("2026-11-17T16:30:00.000Z");
    expect(s).toContain("2026-11-17T14:30:00.000Z"); // 09:30–10:30 is clear
    expect(s).toContain("2026-11-17T17:30:00.000Z"); // 12:30 starts after the buffer
  });

  it("handles daylight-saving changes in the astrologer's zone", () => {
    const march = availableSlots({ ...base, now: Date.parse("2027-03-12T13:00:00Z"), rules: { ...rules, minNoticeHours: 0 } });
    // Monday 15 March 2027, after the US change on the 14th: 09:00 EDT = 13:00 UTC.
    expect(march).toContain("2027-03-15T13:00:00.000Z");
  });
});
