import { describe, expect, it } from "vitest";
import { aafToTable, isAaf, parseAaf, parseAafCoord } from "@/lib/aaf";

const jdOf = (iso: string) => Date.parse(iso) / 86_400_000 + 2440587.5;

const file = [
  "#: AAF export",
  "#A93:Hart,Amelia,f,14.3.1988g,07:42,Portland,USA",
  `#B93:${jdOf("1988-03-14T15:42:00Z").toFixed(6)},45n31,122w41,8hw00,0`,
  "#A93:Example,Ulm,*,14.3.1879g,11:30,Ulm,D",
  `#B93:${jdOf("1879-03-14T10:50:00Z").toFixed(6)},48n24,10e00,0h40e,0`,
  "#A93:Nobody,Unknown,*,1.1.1990g,*,Somewhere,*",
  `#B93:*,40n00,74w00,5hw00,0`,
  "#A93:Broken,Row,*,1.1.1990g,12:00,Nowhere,*",
].join("\n");

describe("AAF import", () => {
  it("coordinates", () => {
    expect(parseAafCoord("45n31")).toBeCloseTo(45.5167, 3);
    expect(parseAafCoord("122w41")).toBeCloseTo(-122.6833, 3);
    expect(parseAafCoord("33s52:30")).toBeCloseTo(-33.875, 3);
  });
  const { charts, problems } = parseAaf(file);
  it("reads names, places and the exact moment", () => {
    expect(isAaf(file)).toBe(true);
    expect(charts[0]).toMatchObject({ first: "Amelia", last: "Hart", date: "1988-03-14", time: "07:42", tz: "America/Los_Angeles", place: "Portland, USA" });
    expect(charts[0]!.note).toBeUndefined();
  });
  it("keeps the exact moment for local mean time births, and says so", () => {
    expect(charts[1]!.tz).toBe("Europe/Berlin");
    expect(charts[1]!.time).not.toBe("11:30");
    expect(charts[1]!.note).toMatch(/adjusted/);
  });
  it("unknown times stay unknown; rows without coordinates are reported", () => {
    expect(charts[2]).toMatchObject({ first: "Unknown", time: null, date: "1990-01-01" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/Row Broken|Broken|no coordinates/);
  });
  it("converts to the CSV importer's table", () => {
    const t = aafToTable(charts);
    expect(t[0]).toContain("Birth date");
    expect(t[1]).toEqual(["Amelia", "Hart", "1988-03-14", "07:42", "Portland, USA", String(charts[0]!.lat), String(charts[0]!.lon), "America/Los_Angeles", ""]);
  });
});
