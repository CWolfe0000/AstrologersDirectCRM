import { describe, expect, it } from "vitest";
import { guessMapping, parseCoord, parseCsv, parseDate, parseTime } from "@/lib/csv";

describe("CSV import", () => {
  it("parses quotes, embedded commas/newlines, CRLF, BOM and semicolons", () => {
    expect(parseCsv('﻿Name,Notes\r\n"Hart, Amelia","Line 1\nLine ""2"""\r\n')).toEqual([["Name", "Notes"], ["Hart, Amelia", 'Line 1\nLine "2"']]);
    expect(parseCsv("a;b\n1;2\n")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("guesses columns from common headers", () => {
    expect(guessMapping(["First Name", "Surname", "E-mail", "DOB", "Time of birth", "Place of Birth", "Lat", "Lng"])).toEqual({
      firstName: 0, lastName: 1, email: 2, birthDate: 3, birthTime: 4, birthPlace: 5, latitude: 6, longitude: 7,
    });
  });
  it("reads dates in either order and rejects impossible ones", () => {
    expect(parseDate("1988-03-14", "us")).toBe("1988-03-14");
    expect(parseDate("03/14/1988", "us")).toBe("1988-03-14");
    expect(parseDate("14/03/1988", "intl")).toBe("1988-03-14");
    expect(parseDate("14/03/1988", "us")).toBeNull();
    expect(parseDate("March 14, 1988", "us")).toBe("1988-03-14");
    expect(parseDate("1988-02-30", "us")).toBeNull();
  });
  it("reads times in 12- and 24-hour forms", () => {
    expect(parseTime("07:42")).toBe("07:42");
    expect(parseTime("7:42 AM")).toBe("07:42");
    expect(parseTime("12:05 am")).toBe("00:05");
    expect(parseTime("2pm")).toBe("14:00");
    expect(parseTime("1405")).toBe("14:05");
    expect(parseTime("25:00")).toBeNull();
  });
  it("reads coordinates with hemispheres", () => {
    expect(parseCoord("45.52", "lat")).toBe(45.52);
    expect(parseCoord("122.68W", "lon")).toBe(-122.68);
    expect(parseCoord("95", "lat")).toBeNull();
  });
});
