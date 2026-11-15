import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";

/**
 * Compares the techniques with reference charts from trusted software.
 * Runs once both exist: tests/fixtures/reference-charts.json (you fill it in,
 * from the template) and the Sky ephemeris adapter (lib/astro/sky-ephemeris.ts).
 */
const fixture = path.join(__dirname, "fixtures/reference-charts.json");
const adapter = path.join(__dirname, "../lib/astro/sky-ephemeris.ts");
const ready = existsSync(fixture) && existsSync(adapter);

describe.skipIf(!ready)("reference charts (needs fixtures + Sky adapter)", () => {
  it("matches the reference software within tolerance", () => {
    const data = JSON.parse(readFileSync(fixture, "utf8"));
    if (!data.charts?.length) throw new Error("No reference charts in the fixture file.");
    // Filled in when the Sky adapter lands: build each chart through the adapter and
    // compare planets (±1′) and angles (±2′) for natal, progressions, solar arc,
    // solar return, synastry aspects and composite.
    throw new Error("Reference comparison not implemented until the Sky adapter exists.");
  });
});
