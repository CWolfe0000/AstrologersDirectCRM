"use client";

import { useEffect, useId, useRef, useState } from "react";

export type Place = { place: string; lat: number; lon: number; tz: string };

/** Birthplace search. The chosen place carries its coordinates and time zone. */
export function PlacePicker({ value, onChange, label = "Birthplace" }: { value: Place | null; onChange: (p: Place | null) => void; label?: string }) {
  const id = useId();
  const [text, setText] = useState(value?.place ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "none" | "error">("idle");
  const seq = useRef(0);

  useEffect(() => setText(value?.place ?? ""), [value]);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2 || q === value?.place) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const mine = ++seq.current;
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { results: Place[] };
        if (mine !== seq.current) return;
        setResults(data.results);
        setActive(0);
        setStatus(data.results.length ? "idle" : "none");
        setOpen(true);
      } catch {
        if (mine === seq.current) setStatus("error");
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [text, value]);

  const choose = (p: Place) => {
    onChange(p);
    setText(p.place);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
        autoComplete="off"
        placeholder="Start typing a city"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => (a + 1) % results.length));
          else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => (a - 1 + results.length) % results.length));
          else if (e.key === "Enter") (e.preventDefault(), choose(results[active]!));
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line-strong bg-white py-1 shadow-card">
          {results.map((r, i) => (
            <li
              key={r.place}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`cursor-pointer px-3.5 py-2 text-[15px] ${i === active ? "bg-rose-soft" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => (e.preventDefault(), choose(r))}
            >
              {r.place}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 min-h-5 text-sm text-muted" aria-live="polite">
        {status === "none" && "No place found. Try the nearest larger city."}
        {status === "error" && "Search isn’t working right now. Try again in a moment."}
        {value && `Time zone: ${value.tz.replace(/_/g, " ")}`}
      </p>
    </div>
  );
}
