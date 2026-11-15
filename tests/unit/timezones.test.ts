import { describe, expect, it } from "vitest";
import { ianaZone, zonedToUtc } from "@/lib/timezones";

describe("practice time zones", () => {
  it("reads IANA names, including older labelled values", () => {
    expect(ianaZone("America/Los_Angeles (Pacific Time)")).toBe("America/Los_Angeles");
    expect(ianaZone("Europe/London")).toBe("Europe/London");
    expect(ianaZone("America/Argentina/Buenos_Aires")).toBe("America/Argentina/Buenos_Aires");
    expect(ianaZone("Mars/Olympus")).toBe("UTC");
    expect(ianaZone("")).toBe("UTC");
  });
  it("converts local consultation times to UTC across DST", () => {
    expect(zonedToUtc("2026-11-14T10:00:00", "America/Los_Angeles").toISOString()).toBe("2026-11-14T18:00:00.000Z"); // PST
    expect(zonedToUtc("2026-07-14T10:00:00", "America/Los_Angeles").toISOString()).toBe("2026-07-14T17:00:00.000Z"); // PDT
    expect(zonedToUtc("2026-03-29T09:30:00", "Europe/London").toISOString()).toBe("2026-03-29T08:30:00.000Z"); // BST starts that day
    expect(zonedToUtc("2026-11-14T10:00:00", "UTC").toISOString()).toBe("2026-11-14T10:00:00.000Z");
  });
});
