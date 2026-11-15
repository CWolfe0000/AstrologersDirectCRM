/** Practice time zones are stored as IANA names (older records may carry a label after the name). */
export function ianaZone(value: string | undefined | null): string {
  const m = String(value ?? "").match(/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+/);
  if (!m) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: m[0] });
    return m[0];
  } catch {
    return "UTC";
  }
}

/** Offset (ms) of `zone` from UTC at instant `at`. */
function offsetMs(zone: string, at: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(at))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  return Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!) - Math.floor(at / 1000) * 1000;
}

/** A stored local wall time ("2026-11-14T10:00:00") in the practice's zone → the real instant. */
export function zonedToUtc(local: string, zone: string): Date {
  const [d, t = "00:00:00"] = local.split("T");
  const [y, mo, da] = d!.split("-").map(Number);
  const [h, mi, se = 0] = t.split(":").map(Number);
  const wall = Date.UTC(y!, mo! - 1, da!, h!, mi!, se!);
  let utc = wall - offsetMs(zone, wall);
  utc = wall - offsetMs(zone, utc); // second pass settles DST edges
  return new Date(utc);
}

/** All IANA zones this browser/runtime knows, for pickers. */
export function allZones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Europe/London", "Europe/Lisbon", "Europe/Madrid", "Australia/Sydney"];
  }
}
