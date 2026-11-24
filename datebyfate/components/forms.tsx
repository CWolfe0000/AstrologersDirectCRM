"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";
import type { Birth } from "@/lib/astro/types";
import type { Person } from "@/lib/people";
import { BirthFields } from "./birth-fields";
import { PlacePicker, type Place } from "./place-picker";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

export function Submit({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "One moment…" : children}
    </button>
  );
}

export function Notice({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={`rounded-xl px-3.5 py-2.5 text-sm ${state.error ? "bg-rose-soft text-rose-hover" : "bg-gold-soft text-ink"}`}>
      {state.error ?? state.ok}
    </p>
  );
}

/** A simple form of text fields bound to a server action (sign in, sign up, reset). */
export function AuthForm({ action, fields, submit, hidden }: { action: Action; submit: string; hidden?: Record<string, string>; fields: { name: string; label: string; type: string; autoComplete: string; hint?: string }[] }) {
  const [state, formAction] = useActionState(action, undefined);
  // Controlled, so that a rejected attempt keeps what was typed (passwords excepted).
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={f.name}>{f.label}</label>
          <input id={f.name} name={f.name} type={f.type} autoComplete={f.autoComplete} required className="input" aria-describedby={f.hint ? `${f.name}-hint` : undefined} {...(f.type === "password" ? {} : { value: values[f.name] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [f.name]: e.target.value })) })} />
          {f.hint && <p id={`${f.name}-hint`} className="mt-1.5 text-sm text-muted">{f.hint}</p>}
        </div>
      ))}
      <Notice state={state} />
      <Submit className="btn-primary w-full">{submit}</Submit>
    </form>
  );
}

const STASH = "dbf_birth";
/** The free reading keeps the birth details in this tab so that signing up doesn't mean typing them again. */
export const stashBirth = (b: Birth) => {
  try {
    sessionStorage.setItem(STASH, JSON.stringify(b));
  } catch {}
};

/** Your own birth details. */
export function SelfForm({ action, initial, submit }: { action: Action; initial?: Birth | null; submit: string }) {
  const [state, formAction] = useActionState(action, undefined);
  const [prefill, setPrefill] = useState<Birth | null | undefined>(initial ?? undefined);
  useEffect(() => {
    if (initial) return;
    try {
      const raw = sessionStorage.getItem(STASH);
      setPrefill(raw ? (JSON.parse(raw) as Birth) : null);
    } catch {
      setPrefill(null);
    }
  }, [initial]);
  if (prefill === undefined) return <div className="h-64" aria-hidden="true" />;
  return (
    <form action={formAction} className="space-y-5">
      <BirthFields who="you" initial={prefill} />
      <Notice state={state} />
      <Submit>{submit}</Submit>
    </form>
  );
}

const YEARS = Array.from({ length: new Date().getFullYear() - 1959 }, (_, i) => new Date().getFullYear() - i);

/** A past partner, or someone new. */
export function PersonForm({ action, kind, initial, submit }: { action: Action; kind: "ex" | "match"; initial?: Person; submit: string }) {
  const [state, formAction] = useActionState(action, undefined);
  const [name, setName] = useState(initial?.name ?? "");
  const [extra, setExtra] = useState({ startYear: String(initial?.startYear ?? ""), endYear: String(initial?.endYear ?? ""), ending: initial?.ending ?? "" });
  const [met, setMet] = useState<Place | null>(initial?.met ?? null);
  const set = (k: keyof typeof extra) => (e: React.ChangeEvent<HTMLSelectElement>) => setExtra((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form action={formAction} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <label className="label" htmlFor="person-name">Name or nickname</label>
        <input id="person-name" name="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className="input" autoComplete="off" aria-describedby="person-name-hint" />
        <p id="person-name-hint" className="mt-1.5 text-sm text-muted">Only you see this. A nickname or initial is enough.</p>
      </div>
      <BirthFields who="them" initial={initial?.birth} />
      <div className="border-t border-line pt-5">
        <PlacePicker value={met} onChange={setMet} label="Where you first met in person (optional)" />
        <p className="-mt-1 text-sm text-muted">The chart of the relationship itself is cast for this place. Leave it empty if you are not sure.</p>
        <input type="hidden" name="metPlace" value={met?.place ?? ""} />
        <input type="hidden" name="metLat" value={met?.lat ?? ""} />
        <input type="hidden" name="metLon" value={met?.lon ?? ""} />
        <input type="hidden" name="metTz" value={met?.tz ?? ""} />
      </div>
      {kind === "ex" && (
        <fieldset className="space-y-4 border-t border-line pt-5">
          <legend className="text-sm font-semibold">The relationship <span className="font-normal text-muted">(optional)</span></legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["startYear", "endYear"] as const).map((n) => (
              <div key={n}>
                <label className="label" htmlFor={n}>{n === "startYear" ? "Started" : "Ended"}</label>
                <select id={n} name={n} className="input" value={extra[n]} onChange={set(n)}>
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="label" htmlFor="ending">Who ended it</label>
              <select id="ending" name="ending" className="input" value={extra.ending} onChange={set("ending")}>
                <option value="">Choose</option>
                <option value="me">I did</option>
                <option value="them">They did</option>
                <option value="mutual">Both of us</option>
              </select>
            </div>
          </div>
        </fieldset>
      )}
      <Notice state={state} />
      <Submit>{submit}</Submit>
    </form>
  );
}
