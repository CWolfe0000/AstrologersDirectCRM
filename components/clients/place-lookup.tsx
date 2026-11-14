"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PLACES, fmtCoord } from "./helpers";

export type PlaceValue = { place: string; lat: number; lon: number; tz: string };

/** Simulated geocoder — searches a small built-in list of cities. */
export function PlaceLookup({ value, onChange, id }: { value: PlaceValue | null; onChange: (v: PlaceValue) => void; id?: string }) {
  const [q, setQ] = React.useState(value?.place ?? "");
  const [open, setOpen] = React.useState(false);
  const matches = PLACES.filter((p) => p.place.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6);
  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input
        id={id}
        className="pl-9"
        value={q}
        placeholder="Start typing a city…"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          {matches.map((m) => (
            <button
              key={m.place}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(m);
                setQ(m.place);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-canvas-2"
            >
              <span className="truncate">{m.place}</span>
              <span className="shrink-0 text-[11.5px] text-muted">{m.tz}</span>
            </button>
          ))}
          <p className="border-t border-line bg-canvas px-3 py-1.5 text-[11px] text-muted">Simulated place lookup — a production build would use a geocoding service.</p>
        </div>
      )}
      {value && <p className="mt-1.5 text-xs text-muted">{fmtCoord(value.lat, value.lon)} · {value.tz}</p>}
    </div>
  );
}
