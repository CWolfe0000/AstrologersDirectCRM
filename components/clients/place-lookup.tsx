"use client";

import * as React from "react";
import { Loader2, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { DATA_MODE } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PLACES, fmtCoord } from "./helpers";

export type PlaceValue = { place: string; lat: number; lon: number; tz: string };
type Result = PlaceValue & { population?: number };

const remoteCache = new Map<string, Result[]>();

function localMatches(q: string): Result[] {
  const s = q.trim().toLowerCase();
  return PLACES.filter((p) => p.place.toLowerCase().includes(s)).slice(0, 6);
}

/**
 * Birthplace search. Server mode: GeoNames (any town worldwide, with its time
 * zone), falling back to the built-in list if the service is unavailable.
 * Demo mode: the built-in list only.
 */
export function PlaceLookup({ value, onChange, id }: { value: PlaceValue | null; onChange: (v: PlaceValue) => void; id?: string }) {
  const [q, setQ] = React.useState(value?.place ?? "");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [remote, setRemote] = React.useState<{ q: string; results: Result[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [remoteDown, setRemoteDown] = React.useState(DATA_MODE !== "server");
  const listId = React.useId();

  const query = q.trim();
  React.useEffect(() => {
    if (remoteDown || query.length < 2 || query === value?.place) return;
    const hit = remoteCache.get(query.toLowerCase());
    if (hit) {
      setRemote({ q: query, results: hit });
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api<{ results: Result[] }>(`/api/v1/places?q=${encodeURIComponent(query)}`)
        .then((r) => {
          remoteCache.set(query.toLowerCase(), r.results);
          if (!cancelled) setRemote({ q: query, results: r.results });
        })
        .catch(() => !cancelled && setRemoteDown(true))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setLoading(false);
    };
  }, [query, remoteDown, value?.place]);

  const matches: Result[] = remoteDown ? localMatches(query) : remote && remote.q === query ? remote.results : [];
  React.useEffect(() => setActive(0), [query, matches.length]);

  const choose = (m: Result) => {
    onChange({ place: m.place, lat: m.lat, lon: m.lon, tz: m.tz });
    setQ(m.place);
    setOpen(false);
  };
  const showList = open && query.length >= (remoteDown ? 1 : 2) && query !== value?.place;

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input
        id={id}
        className="pl-9 pr-9"
        value={q}
        placeholder="Start typing a town or city…"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && matches[active] ? `${listId}-${active}` : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showList || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(matches[active]!);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" aria-label="Searching" />}
      {showList && (matches.length > 0 || (!loading && !remoteDown && remote?.q === query)) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          <ul id={listId} role="listbox" aria-label="Places">
            {matches.map((m, i) => (
              <li key={`${m.place}|${m.lat}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(m)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] ${i === active ? "bg-canvas-2" : ""}`}
                >
                  <span className="truncate">{m.place}</span>
                  <span className="shrink-0 text-[11.5px] text-muted">{m.tz}</span>
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && <p className="px-3 py-2 text-[13px] text-muted">No towns or cities found. Try a different spelling, or add the country.</p>}
          <p className="border-t border-line bg-canvas px-3 py-1.5 text-[11px] text-muted">
            {remoteDown
              ? DATA_MODE === "server"
                ? "Place search is unavailable, showing a short built-in list."
                : "Simulated place lookup: a short built-in list of cities."
              : "Places and time zones from GeoNames."}
          </p>
        </div>
      )}
      {value && <p className="mt-1.5 text-xs text-muted">{fmtCoord(value.lat, value.lon)} · {value.tz}</p>}
    </div>
  );
}
