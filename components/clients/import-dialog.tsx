"use client";

import * as React from "react";
import tzlookup from "tz-lookup";
import { AlertTriangle, CheckCircle2, FileUp, MapPin, Users } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { IMPORT_FIELDS, guessMapping, parseCoord, parseCsv, parseDate, parseTime, type ImportField } from "@/lib/csv";
import { aafToTable, isAaf, parseAaf } from "@/lib/aaf";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { flushNow } from "@/lib/sync";
import { cn, DATA_MODE } from "@/lib/utils";
import { sendIntakeForm } from "@/components/intake/send";
import { Badge } from "@/components/ui/badge";
import { PlaceLookup, type PlaceValue } from "./place-lookup";
import { PLACES } from "./helpers";

type Row = {
  index: number;
  first: string;
  last: string;
  email: string;
  phone?: string;
  date: string | null;
  time: string | null;
  timeRaw: string;
  place: PlaceValue | null;
  placeText: string;
  tags: string[];
  notes?: string;
  problem: string | null;
  duplicate: boolean;
};

const LIMIT = 2000;

function locate(placeText: string, lat: string, lon: string, tz: string): PlaceValue | null {
  const la = lat ? parseCoord(lat, "lat") : null;
  const lo = lon ? parseCoord(lon, "lon") : null;
  if (la !== null && lo !== null) {
    let zone = tz.trim();
    try {
      if (zone) new Intl.DateTimeFormat("en-US", { timeZone: zone });
      else zone = tzlookup(la, lo);
    } catch {
      zone = tzlookup(la, lo);
    }
    return { place: placeText || `${la.toFixed(2)}, ${lo.toFixed(2)}`, lat: la, lon: lo, tz: zone };
  }
  const t = placeText.trim().toLowerCase();
  if (!t) return null;
  // Match the built-in city list by the city name (first part), e.g. "Portland, OR" → Portland, Oregon, USA.
  const city = t.split(",")[0]!.trim();
  return PLACES.find((p) => p.place.toLowerCase() === t || p.place.toLowerCase().split(",")[0] === city) ?? null;
}

/** Real CSV import: parse → match columns → review/fix rows → create clients and natal charts. */
export function ImportClientsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useStore();
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [table, setTable] = React.useState<string[][] | null>(null);
  const [mapping, setMapping] = React.useState<Partial<Record<ImportField, number>>>({});
  const [order, setOrder] = React.useState<"us" | "intl">("us");
  const [fixes, setFixes] = React.useState<Record<number, PlaceValue>>({});
  const [step, setStep] = React.useState<"file" | "map" | "review" | "invite">("file");
  const [imported, setImported] = React.useState<Imported[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [aafProblems, setAafProblems] = React.useState<string[]>([]);

  const reset = () => {
    setFileName(null);
    setTable(null);
    setMapping({});
    setFixes({});
    setStep("file");
    setError(null);
    setAafProblems([]);
    setImported([]);
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setError(null);
    if (f.size > 5 * 1024 * 1024) return setError("That file is larger than 5 MB. Split it into smaller files.");
    const text = await f.text();
    if (isAaf(text)) {
      // Chart files from Solar Fire, Astrodienst and other astrology programs.
      const { charts, problems } = parseAaf(text);
      if (charts.length === 0) return setError(problems[0] ?? "We couldn’t find any charts in that file.");
      if (charts.length > LIMIT) return setError(`Import up to ${LIMIT} clients at a time.`);
      const t = aafToTable(charts);
      setFileName(f.name);
      setTable(t);
      setMapping(guessMapping(t[0]!));
      setAafProblems(problems);
      setStep("review");
      return;
    }
    const rows = parseCsv(text);
    if (rows.length < 2) return setError("We couldn’t find any rows. Check that the first row has column names.");
    if (rows.length - 1 > LIMIT) return setError(`Import up to ${LIMIT} clients at a time.`);
    setFileName(f.name);
    setTable(rows);
    setMapping(guessMapping(rows[0]!));
    // Guess the date order from the data: a first number above 12 means day-first.
    const dateCol = guessMapping(rows[0]!).birthDate;
    if (dateCol !== undefined && rows.slice(1).some((r) => Number((r[dateCol] ?? "").split(/[/.-]/)[0]) > 12 && !/^\d{4}/.test(r[dateCol] ?? ""))) setOrder("intl");
    setStep("map");
  };

  const headers = table?.[0] ?? [];
  const existingEmails = React.useMemo(() => new Set(s.clients.map((c) => c.email.trim().toLowerCase()).filter(Boolean)), [s.clients]);

  const rows: Row[] = React.useMemo(() => {
    if (!table) return [];
    const cell = (r: string[], f: ImportField) => (mapping[f] === undefined ? "" : (r[mapping[f]!] ?? "").trim());
    return table.slice(1).map((r, i) => {
      let first = cell(r, "firstName");
      let last = cell(r, "lastName");
      if (!first && cell(r, "fullName")) {
        const parts = cell(r, "fullName").split(/\s+/);
        last = parts.length > 1 ? parts.pop()! : "";
        first = parts.join(" ");
      }
      const dateRaw = cell(r, "birthDate");
      const date = dateRaw ? parseDate(dateRaw, order) : null;
      const timeRaw = cell(r, "birthTime");
      const time = timeRaw ? parseTime(timeRaw) : null;
      const placeText = cell(r, "birthPlace");
      const place = fixes[i] ?? locate(placeText, cell(r, "latitude"), cell(r, "longitude"), cell(r, "timezone"));
      const email = cell(r, "email");
      const problem = !first ? "No name" : !dateRaw ? "No birth date" : !date ? `Can’t read the date “${dateRaw}”` : timeRaw && !time ? `Can’t read the time “${timeRaw}”` : null;
      return {
        index: i, first, last, email, phone: cell(r, "phone") || undefined, date, time, timeRaw, place, placeText,
        tags: cell(r, "tags").split(/[,;|]/).map((t) => t.trim()).filter(Boolean),
        notes: cell(r, "notes") || undefined,
        problem,
        duplicate: !!email && existingEmails.has(email.toLowerCase()),
      };
    });
  }, [table, mapping, order, fixes, existingEmails]);

  const ready = rows.filter((r) => !r.problem && !r.duplicate && r.place);
  const needsPlace = rows.filter((r) => !r.problem && !r.duplicate && !r.place);
  const skipped = rows.filter((r) => r.problem || r.duplicate);

  const doImport = () => {
    const made: Imported[] = [];
    for (const r of ready) {
      const client = s.addClient(
        { email: r.email, phone: r.phone, status: "new", source: `Import: ${fileName}`, tags: r.tags, portalAccess: "none", summary: r.notes },
        {
          firstName: r.first,
          lastName: r.last,
          birth: { date: r.date!, time: r.time ?? "12:00", timeAccuracy: r.time ? "exact" : "unknown", place: r.place!.place, lat: r.place!.lat, lon: r.place!.lon, tz: r.place!.tz },
        },
      );
      s.addChart({
        title: `${personName({ firstName: r.first, lastName: r.last })} — Natal${r.time ? "" : " (noon, whole sign)"}`,
        type: "natal",
        personIds: [client.id],
        clientId: client.id,
        settings: r.time ? undefined : { houseSystem: "whole-sign" },
      });
      made.push({ id: client.id, name: personName({ firstName: r.first, lastName: r.last }), email: r.email, pick: !!r.email });
    }
    s.toast(`Imported ${ready.length} ${ready.length === 1 ? "client" : "clients"}`, skipped.length || needsPlace.length ? `${skipped.length + needsPlace.length} rows were left out.` : "Each has a natal chart.", "success");
    // Next: invite them to their portals (optional).
    setImported(made);
    setStep("invite");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent
        size="xl"
        title="Import Clients"
        description="From a spreadsheet saved as CSV, or charts exported from an astrology program as AAF. Each imported client gets a natal chart."
        footer={
          step === "invite" ? null : step === "file" ? (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          ) : step === "map" ? (
            <>
              <Button variant="ghost" onClick={reset} className="mr-auto">Choose Another File</Button>
              <Button onClick={() => setStep("review")} disabled={mapping.birthDate === undefined || (mapping.firstName === undefined && mapping.fullName === undefined)}>Review Rows</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("map")} className="mr-auto">Back</Button>
              <Button onClick={doImport} disabled={ready.length === 0}><Users /> Import {ready.length} {ready.length === 1 ? "client" : "clients"}</Button>
            </>
          )
        }
      >
        {step === "file" && (
          <>
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-canvas/60 px-6 py-10 text-center hover:border-accent-200"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void onFile(e.dataTransfer.files[0]); }}
            >
              <FileUp className="mb-2 size-6 text-muted" />
              <p className="font-medium">Drop a spreadsheet (CSV) or chart file (AAF) here, or click to choose one</p>
              <p className="mt-1 text-[12.5px] text-muted">From Excel, Numbers or Google Sheets: File → Download / Export → CSV, with column names in the first row.</p>
              <p className="mt-1 text-[12.5px] text-muted">From Solar Fire, Astrodienst or another astrology program: export your charts in AAF (Astrological Exchange Format).</p>
              <input type="file" accept=".csv,text/csv,.aaf,.txt" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
            {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
            <p className="mt-4 text-[12.5px] text-muted">Useful columns: name (or first and last name), email, phone, birth date, birth time, birth place — or latitude and longitude, which are the most precise. Tags and notes are optional.</p>
          </>
        )}

        {step === "map" && table && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted">{fileName} · {table.length - 1} rows. Check which column holds each detail.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {IMPORT_FIELDS.map((f) => (
                <label key={f.id} className="block text-[12.5px]">
                  <span className="mb-1 block text-muted">{f.label}{(f.id === "birthDate") && " (required)"}</span>
                  <Select value={mapping[f.id] === undefined ? "" : String(mapping[f.id])} onChange={(e) => setMapping((m) => ({ ...m, [f.id]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
                    <option value="">— Not in This File —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </Select>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <span className="text-muted">Dates like 03/04/1988 mean</span>
              <Segmented size="sm" value={order} onChange={setOrder} options={[{ value: "us", label: "March 4 (US)" }, { value: "intl", label: "3 April (International)" }]} />
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-[12.5px]">
              <Badge tone="sage"><CheckCircle2 className="size-3" /> {ready.length} ready</Badge>
              {needsPlace.length > 0 && <Badge tone="warn"><MapPin className="size-3" /> {needsPlace.length} need a birthplace</Badge>}
              {skipped.length > 0 && <Badge tone="neutral"><AlertTriangle className="size-3" /> {skipped.length} will be left out</Badge>}
            </div>
            {aafProblems.length > 0 && (
              <div className="rounded-lg border border-line bg-canvas/60 p-3 text-[12.5px]">
                <p className="font-medium text-ink">{aafProblems.length} {aafProblems.length === 1 ? "chart" : "charts"} in the file couldn’t be read:</p>
                <ul className="mt-1 list-disc pl-5 text-muted">{aafProblems.slice(0, 8).map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            {rows.some((r) => r.notes?.includes("Local time adjusted")) && (
              <p className="text-[12.5px] text-muted">For births before standard time zones (or in years with unusual clock rules), the local time was adjusted so the exact moment from the file is kept. The original time is saved in each client’s notes.</p>
            )}
            {needsPlace.length > 0 && (
              <div className="rounded-xl border border-[#F1E0C2] bg-warn-50/60 p-3">
                <p className="mb-2 text-[13px] font-medium">Choose a birthplace for these clients, or leave them out</p>
                <ul className="space-y-2">
                  {needsPlace.slice(0, 50).map((r) => (
                    <li key={r.index} className="grid items-center gap-2 sm:grid-cols-[1fr_1.4fr]">
                      <span className="truncate text-[13px]">{r.first} {r.last} <span className="text-muted">— “{r.placeText || "no place given"}”</span></span>
                      <PlaceLookup value={null} onChange={(v) => setFixes((x) => ({ ...x, [r.index]: v }))} />
                    </li>
                  ))}
                </ul>
                {needsPlace.length > 50 && <p className="mt-2 text-[12px] text-muted">Showing the first 50. Add latitude and longitude columns to place everyone automatically.</p>}
              </div>
            )}
            <div className="max-h-[42vh] overflow-auto rounded-xl border border-line">
              <table className="w-full text-left text-[12.5px]">
                <thead className="sticky top-0 bg-canvas text-muted">
                  <tr><th className="px-3 py-2 font-medium">Client</th><th className="px-3 py-2 font-medium">Born</th><th className="px-3 py-2 font-medium">Place</th><th className="px-3 py-2 font-medium">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.index}>
                      <td className="px-3 py-2"><span className="font-medium">{r.first} {r.last}</span>{r.email && <span className="block text-muted">{r.email}</span>}</td>
                      <td className="px-3 py-2 tabular-nums">{r.date ?? "—"} {r.time ?? (r.timeRaw ? "" : <span className="text-muted">time unknown</span>)}</td>
                      <td className="px-3 py-2">{r.place?.place ?? <span className="text-muted">{r.placeText || "—"}</span>}</td>
                      <td className="px-3 py-2">
                        {r.problem ? <span className="text-danger">{r.problem}</span> : r.duplicate ? <span className="text-muted">Already a client (same email)</span> : r.place ? <span className="text-sage-dark">Ready</span> : <span className="text-warn">Needs birthplace</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-muted">Clients without a birth time are imported with “time unknown”: their natal chart uses a noon reference and whole-sign houses until you add a time.</p>
          </div>
        )}

        {step === "invite" && <InviteImported clients={imported} onChange={setImported} onDone={() => { onOpenChange(false); reset(); }} />}
      </DialogContent>
    </Dialog>
  );
}

type Imported = { id: string; name: string; email: string; pick: boolean; result?: string; ok?: boolean };
const EMAIL_RE = /[^\s<>,;]+@[^\s<>,;]+\.[^\s<>,;]+/;

/**
 * After an import: add any missing email addresses (typed, or pasted as a
 * list of "Name, email" lines), pick who to invite, and send each a portal
 * invitation, with an intake form if chosen.
 */
function InviteImported({ clients, onChange, onDone }: { clients: Imported[]; onChange: (c: Imported[]) => void; onDone: () => void }) {
  const s = useStore();
  const forms = s.practitioner.intakeForms ?? [];
  const [formId, setFormId] = React.useState("");
  const [paste, setPaste] = React.useState("");
  const [busy, setBusy] = React.useState<{ done: number; of: number } | null>(null);
  const finished = clients.some((c) => c.result);
  const set = (id: string, patch: Partial<Imported>) => onChange(clients.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, "");

  const matchPaste = () => {
    let n = 0;
    const next = clients.map((c) => {
      const line = paste.split("\n").find((l) => norm(l.replace(EMAIL_RE, "")) === norm(c.name) || (norm(l.replace(EMAIL_RE, "")).includes(norm(c.name)) && norm(c.name).length > 5));
      const email = line?.match(EMAIL_RE)?.[0];
      if (!email) return c;
      n++;
      return { ...c, email, pick: true };
    });
    onChange(next);
    s.toast(n ? `Matched ${n} ${n === 1 ? "Email" : "Emails"}` : "No Names Matched", n ? undefined : "Use one line per client: their name as imported, then their email.", n ? "success" : "error");
  };

  const send = async () => {
    const list = clients.filter((c) => c.pick && EMAIL_RE.test(c.email));
    if (!list.length) return;
    const form = forms.find((f) => f.id === formId);
    // Save any emails added here first.
    for (const c of list) if (s.clients.find((x) => x.id === c.id)?.email !== c.email.trim()) s.updateClient(c.id, { email: c.email.trim() });
    setBusy({ done: 0, of: list.length });
    const results: Record<string, { ok: boolean; result: string }> = {};
    if (DATA_MODE === "server") await flushNow().catch(() => {});
    for (const [i, c] of list.entries()) {
      try {
        if (form) await sendIntakeForm(form, c.id);
        else if (DATA_MODE === "server") await api("/api/v1/portal/invite", { body: { clientId: c.id } });
        useStore.setState((st) => ({ clients: st.clients.map((x) => (x.id === c.id && x.portalAccess === "none" ? { ...x, portalAccess: "invited" } : x)) }));
        results[c.id] = { ok: true, result: form ? "Invited, with the form" : "Invited" };
      } catch (e) {
        results[c.id] = { ok: false, result: (e as Error).message };
      }
      setBusy({ done: i + 1, of: list.length });
    }
    onChange(clients.map((c) => (results[c.id] ? { ...c, ...results[c.id] } : c)));
    setBusy(null);
    const ok = Object.values(results).filter((r) => r.ok).length;
    s.toast(`${ok} ${ok === 1 ? "Invitation" : "Invitations"} Sent`, ok < list.length ? `${list.length - ok} couldn’t be sent: see the list.` : undefined, ok ? "success" : "error");
  };

  const chosen = clients.filter((c) => c.pick && EMAIL_RE.test(c.email)).length;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[15px] font-semibold text-ink">Invite Them to Their Portal</p>
        <p className="text-[13px] text-muted">Optional. Each person gets an email with a link to their private portal{forms.length ? ", and the intake form if you choose one" : ""}. Files from astrology programs don’t include email addresses: type them in or paste a list.</p>
      </div>
      {!finished && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-ink-3">Paste Emails</span>
            <textarea aria-label="Paste emails" value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px]" placeholder={"Amelia Hart, amelia@example.com\nTheo Brandt <theo@example.com>"} />
            <Button size="sm" variant="secondary" onClick={matchPaste} disabled={!paste.trim()}>Match to Names</Button>
          </div>
          {forms.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-medium text-ink-3">Intake Form to Include</span>
              <Select value={formId} onChange={(e) => setFormId(e.target.value)}>
                <option value="">No Form</option>
                {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
              </Select>
            </label>
          )}
        </div>
      )}
      <div className="max-h-[40vh] overflow-auto rounded-xl border border-line">
        <table className="w-full text-left text-[12.5px]">
          <thead className="sticky top-0 bg-canvas text-muted"><tr><th className="w-10 px-3 py-2"><span className="sr-only">Invite</span></th><th className="px-3 py-2 font-medium">Client</th><th className="px-3 py-2 font-medium">Email</th>{finished && <th className="px-3 py-2 font-medium">Result</th>}</tr></thead>
          <tbody className="divide-y divide-line">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-1.5"><input type="checkbox" aria-label={`Invite ${c.name}`} checked={c.pick} disabled={finished || !EMAIL_RE.test(c.email)} onChange={(e) => set(c.id, { pick: e.target.checked })} /></td>
                <td className="px-3 py-1.5 font-medium">{c.name}</td>
                <td className="px-3 py-1.5"><input type="email" aria-label={`Email for ${c.name}`} value={c.email} disabled={finished} onChange={(e) => set(c.id, { email: e.target.value, pick: EMAIL_RE.test(e.target.value) })} className="h-8 w-full min-w-[200px] rounded-md border border-line bg-surface px-2" placeholder="Add email" /></td>
                {finished && <td className={cn("px-3 py-1.5", c.ok ? "text-sage-dark" : c.result ? "text-danger" : "text-muted")}>{c.result ?? "Not invited"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {busy && <span className="mr-auto text-[12.5px] text-muted">Sending {busy.done} of {busy.of}…</span>}
        {finished ? (
          <Button onClick={onDone}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onDone} disabled={!!busy}>Skip for Now</Button>
            <Button onClick={send} disabled={!!busy || chosen === 0}>Invite {chosen} {chosen === 1 ? "Client" : "Clients"}</Button>
          </>
        )}
      </div>
    </div>
  );
}
