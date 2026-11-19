"use client";

import { useEffect, useState } from "react";
import type { Birth } from "@/lib/astro/types";
import { PlacePicker, type Place } from "./place-picker";

/**
 * Date, time and place of birth. Renders plain form fields (date, time,
 * timeUnknown, place, lat, lon, tz) and reports the current value upward.
 */
export function BirthFields({ initial, who, onChange }: { initial?: Birth | null; who: "you" | "them"; onChange?: (b: Birth | null) => void }) {
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [unknown, setUnknown] = useState(initial ? !initial.time : false);
  const [place, setPlace] = useState<Place | null>(initial ? { place: initial.place, lat: initial.lat, lon: initial.lon, tz: initial.tz } : null);

  useEffect(() => {
    onChange?.(date && place && (unknown || time) ? { date, time: unknown ? null : time, ...place } : null);
  }, [date, time, unknown, place, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="birth-date">Date of birth</label>
          <input id="birth-date" name="date" type="date" required min="1900-01-01" max={new Date().toISOString().slice(0, 10)} className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="birth-time">Time of birth</label>
          <input id="birth-time" name="time" type="time" className="input disabled:bg-cream-2 disabled:text-muted" required={!unknown} disabled={unknown} value={unknown ? "" : time} onChange={(e) => setTime(e.target.value)} />
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" name="timeUnknown" className="h-4 w-4 accent-rose" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} />
            {who === "you" ? "I don’t know my birth time" : "I don’t know their birth time"}
          </label>
        </div>
      </div>
      <PlacePicker value={place} onChange={setPlace} />
      <input type="hidden" name="place" value={place?.place ?? ""} />
      <input type="hidden" name="lat" value={place?.lat ?? ""} />
      <input type="hidden" name="lon" value={place?.lon ?? ""} />
      <input type="hidden" name="tz" value={place?.tz ?? ""} />
      {unknown && (
        <p className="rounded-xl bg-gold-soft px-3.5 py-2.5 text-sm text-ink-2">
          {who === "you"
            ? "That’s fine. You’ll still get most of your reading. Your rising sign and the section on who you are drawn to need a birth time, so add it later if you find it (a birth certificate usually has it)."
            : "That’s fine, most people don’t know. We’ll leave out their Moon contacts and rising sign and use everything else."}
        </p>
      )}
    </div>
  );
}
