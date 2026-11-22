"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Copy, ExternalLink, ImagePlus, Plus, Trash2, Upload, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { allZones } from "@/lib/timezones";
import { squarePhoto } from "@/lib/photo";
import { SITE_URL } from "@/lib/site";
import { cn, nowLocal, uid } from "@/lib/utils";
import { DAYS, type BookingProfile, type BookingService, type Day } from "@/lib/booking/types";
import { DELIVERY_DAYS, OFFERED_FORMATS, formatLabel, isWritten } from "@/lib/booking/formats";
import { STARTER_FORMS, selectIntakeForms } from "@/lib/intake";
import type { IntakeForm } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { AddressStatus } from "@/components/settings/booking-section";

const STEPS = ["About You", "Your Services", "Intake Forms", "Your Hours", "Your Page"] as const;
const DAY_NAMES: Record<Day, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const DAY_IDS: Day[] = DAYS.map((d) => d.id);

/** Ready-made services to tick; each is suggested with the intake form that suits it. */
const SUGGESTED: (Omit<BookingService, "id" | "active"> & { key: string; form: string })[] = [
  { key: "natal", name: "Natal Chart Reading", description: "Your birth chart in depth: strengths, patterns and what you’re growing into.", durationMin: 90, price: "", format: "Video call", form: "new-client" },
  { key: "year", name: "Year Ahead Forecast", description: "The year’s turning points from transits, progressions and your solar return.", durationMin: 75, price: "", format: "Video call", form: "new-client" },
  { key: "career", name: "Career Reading", description: "Work, vocation and timing for change.", durationMin: 60, price: "", format: "Video call", form: "career" },
  { key: "relationship", name: "Relationship Reading", description: "Synastry and composite charts for you and a partner.", durationMin: 90, price: "", format: "Video call", form: "relationship" },
  { key: "horary", name: "Horary Question", description: "One clear question, answered from the moment you ask it.", durationMin: 30, price: "", format: "Audio call", form: "horary" },
  { key: "written", name: "Written Natal Report", description: "A written reading of your birth chart, delivered to your portal.", durationMin: 60, price: "", format: "Written reading", deliveryDays: 14, form: "new-client" },
];

type Picked = Omit<BookingService, "id" | "active"> & { key: string; form: string; on: boolean };

/**
 * First-run setup for a new practitioner: who they are, what they offer, the
 * questions clients answer, when they're available, and their public page.
 * Each step saves as they go, so they can stop and come back.
 */
export function SetupWizard() {
  const router = useRouter();
  const practitioner = useStore((s) => s.practitioner);
  const update = useStore((s) => s.updatePractitioner);
  const toast = useStore((s) => s.toast);
  const step = Math.min(practitioner.onboarding?.step ?? 0, STEPS.length);
  const setStep = (n: number, done = false) => update({ onboarding: { step: n, done } });
  const [profile, setProfile] = React.useState<BookingProfile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    api<{ profile: BookingProfile }>("/api/v1/booking").then((r) => setProfile(r.profile), (e: Error) => setError(e.message));
  }, []);

  // Saves the booking page; each step's changes go in one call.
  const saveProfile = async (patch: Partial<BookingProfile>) => {
    if (!profile) return false;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ profile: BookingProfile }>("/api/v1/booking", { method: "PUT", body: { ...profile, ...patch } });
      setProfile(r.profile);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const finishLater = () => router.push("/app");

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Set Up Your Practice</p>
          <h1 className="font-serif text-[30px] leading-tight text-ink">{step >= STEPS.length ? "You’re Ready" : STEPS[step]}</h1>
        </div>
        {step < STEPS.length && <Button variant="ghost" size="sm" onClick={finishLater}>Finish Later</Button>}
      </div>
      {step < STEPS.length && (
        <ol className="mb-8 grid grid-cols-5 gap-1.5" aria-label="Setup steps">
          {STEPS.map((s, i) => (
            <li key={s} className="min-w-0">
              <span className={cn("block h-1.5 rounded-full", i < step ? "bg-accent" : i === step ? "bg-accent/60" : "bg-canvas-3")} aria-hidden />
              <span className={cn("mt-1.5 hidden truncate text-[11.5px] sm:block", i === step ? "font-medium text-ink" : "text-muted")} aria-current={i === step ? "step" : undefined}>{s}</span>
            </li>
          ))}
        </ol>
      )}
      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
      {!profile ? (
        <div className="h-72 animate-pulse rounded-2xl bg-canvas-2" />
      ) : step === 0 ? (
        <AboutYou profile={profile} busy={busy} onNext={async (p, patch) => { update(p); if (await saveProfile(patch)) setStep(1); }} />
      ) : step === 1 ? (
        <Services profile={profile} busy={busy} onBack={() => setStep(0)} onNext={async (services) => { if (await saveProfile({ services })) setStep(2); }} />
      ) : step === 2 ? (
        <Forms profile={profile} busy={busy} onBack={() => setStep(1)} onNext={async (forms, services) => {
          update({ intakeForms: [...(practitioner.intakeForms ?? []), ...forms] });
          if (await saveProfile({ services })) setStep(3);
        }} />
      ) : step === 3 ? (
        <Hours profile={profile} busy={busy} onBack={() => setStep(2)} onNext={async (rules) => { if (await saveProfile({ rules })) setStep(4); }} />
      ) : step === 4 ? (
        <YourPage profile={profile} busy={busy} onBack={() => setStep(3)} onNext={async (patch) => { if (await saveProfile(patch)) { setStep(5, true); toast("Setup Complete", "Your practice is ready.", "success"); } }} />
      ) : (
        <Done profile={profile} />
      )}
    </div>
  );
}

function Nav({ onBack, busy, next = "Continue", disabled }: { onBack?: () => void; busy: boolean; next?: string; disabled?: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-2 border-t border-line pt-5">
      {onBack ? <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft /> Back</Button> : <span />}
      <Button type="submit" disabled={busy || disabled}>{busy ? "Saving…" : next} {!busy && <ArrowRight />}</Button>
    </div>
  );
}

// ——— 1. About you ———————————————————————————————————————————————

function AboutYou({ profile, busy, onNext }: { profile: BookingProfile; busy: boolean; onNext: (p: { name: string; firstName: string; practice: string; title: string; timezone: string; bio: string }, patch: Partial<BookingProfile>) => void }) {
  const pr = useStore((s) => s.practitioner);
  const toast = useStore((s) => s.toast);
  const zones = React.useMemo(() => allZones(), []);
  const [f, setF] = React.useState({ name: pr.name, practice: pr.practice, title: pr.title, timezone: pr.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, headline: profile.headline || "", bio: profile.about || pr.bio || "" });
  const [photo, setPhoto] = React.useState(profile.photo);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext({ name: f.name.trim(), firstName: f.name.trim().split(/\s+/)[0] ?? "", practice: f.practice.trim(), title: f.title.trim(), timezone: f.timezone, bio: f.bio.trim() }, { displayName: f.name.trim(), headline: f.headline.trim(), about: f.bio.trim(), photo }); }}>
      <p className="mb-5 text-[14px] text-ink-3">This is how clients will see you on your page, in emails and in their portal. You can change any of it later.</p>
      <div className="mb-5 flex items-center gap-4">
        {photo ? <img src={photo} alt="Your profile photo" className="size-20 rounded-full object-cover" /> : <span className="flex size-20 items-center justify-center rounded-full bg-canvas-2 text-[12px] text-muted">No Photo</span>}
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink hover:bg-canvas-2 focus-within:ring-2 focus-within:ring-accent/40">
          <ImagePlus className="size-4" /> {photo ? "Change Photo" : "Add a Photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Profile Photo" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { setPhoto(await squarePhoto(file)); } catch (err) { toast("Photo Not Added", (err as Error).message, "error"); } }} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your Name" htmlFor="ob-name"><Input id="ob-name" required maxLength={120} value={f.name} onChange={set("name")} /></Field>
        <Field label="Practice Name" htmlFor="ob-practice"><Input id="ob-practice" maxLength={160} value={f.practice} onChange={set("practice")} /></Field>
        <Field label="Headline" htmlFor="ob-head" optional hint="One line under your name."><Input id="ob-head" maxLength={160} value={f.headline} onChange={set("headline")} placeholder="e.g. Evolutionary astrologer · Timing & life direction" /></Field>
        <Field label="Time Zone" htmlFor="ob-tz" hint="Your hours and bookings use this."><Select id="ob-tz" value={f.timezone} onChange={set("timezone")}>{zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}</Select></Field>
        <Field label="Short Bio" htmlFor="ob-bio" optional className="sm:col-span-2" hint="A few sentences: how you work and who you work with."><Textarea id="ob-bio" rows={4} maxLength={4000} value={f.bio} onChange={set("bio")} /></Field>
      </div>
      <Nav busy={busy} disabled={!f.name.trim()} />
    </form>
  );
}

// ——— 2. Services ————————————————————————————————————————————————

function Services({ profile, busy, onBack, onNext }: { profile: BookingProfile; busy: boolean; onBack: () => void; onNext: (s: BookingService[]) => void }) {
  // Start from what's saved (coming back to this step), or from the suggestions.
  const [list, setList] = React.useState<Picked[]>(() => {
    const saved = profile.services.filter((s) => s.active);
    const fromSaved = saved.map((s) => ({ ...s, key: s.id, form: SUGGESTED.find((x) => x.name === s.name)?.form ?? "new-client", on: true }));
    return [...fromSaved, ...SUGGESTED.filter((x) => !saved.some((s) => s.name === x.name)).map((x) => ({ ...x, on: false }))];
  });
  const set = (key: string, patch: Partial<Picked>) => setList(list.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const chosen = list.filter((x) => x.on && x.name.trim());
  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(chosen.map(({ key, form, on, ...s }) => (void form, void on, { ...s, id: SUGGESTED.some((x) => x.key === key) ? key : key.startsWith("svc") ? key : uid("svc"), name: s.name.trim(), active: true }))); }}>
      <p className="mb-5 text-[14px] text-ink-3">Tick what you offer. Adjust the format, length and price, or add your own. Clients choose from these on your page.</p>
      <ul className="space-y-3">
        {list.map((x) => (
          <li key={x.key} className={cn("rounded-xl border p-4 transition-colors", x.on ? "border-accent/50 bg-surface" : "border-line bg-surface/60")}>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 size-4 accent-[rgb(var(--accent))]" checked={x.on} onChange={(e) => set(x.key, { on: e.target.checked })} aria-label={`Offer ${x.name || "this service"}`} />
              <div className="min-w-0 flex-1">
                {SUGGESTED.some((s) => s.key === x.key) ? <p className="text-[15px] font-semibold text-ink">{x.name}</p> : <Input aria-label="Service Name" value={x.name} onChange={(e) => set(x.key, { name: e.target.value })} placeholder="Service Name" maxLength={120} />}
                {x.description && <p className="mt-0.5 text-[13px] text-muted">{x.description}</p>}
                {x.on && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Format" htmlFor={`ob-f-${x.key}`}>
                      <Select id={`ob-f-${x.key}`} value={x.format} onChange={(e) => set(x.key, { format: e.target.value as BookingService["format"], ...(isWritten(e.target.value) && !x.deliveryDays ? { deliveryDays: 14 } : {}) })}>
                        {OFFERED_FORMATS.map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}
                      </Select>
                    </Field>
                    {isWritten(x.format) ? (
                      <Field label="Ready Within" htmlFor={`ob-d-${x.key}`}><Select id={`ob-d-${x.key}`} value={x.deliveryDays ?? 14} onChange={(e) => set(x.key, { deliveryDays: +e.target.value })}>{DELIVERY_DAYS.map((d) => <option key={d} value={d}>{d} days</option>)}</Select></Field>
                    ) : (
                      <Field label="Length" htmlFor={`ob-d-${x.key}`}><Select id={`ob-d-${x.key}`} value={x.durationMin} onChange={(e) => set(x.key, { durationMin: +e.target.value })}>{[30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}</Select></Field>
                    )}
                    <Field label="Price" htmlFor={`ob-p-${x.key}`} optional><Input id={`ob-p-${x.key}`} value={x.price} maxLength={40} placeholder="e.g. $150" onChange={(e) => set(x.key, { price: e.target.value })} /></Field>
                  </div>
                )}
              </div>
              {!SUGGESTED.some((s) => s.key === x.key) && <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove this service" onClick={() => setList(list.filter((y) => y.key !== x.key))}><Trash2 /></Button>}
            </div>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setList([...list, { key: uid("new"), name: "", description: "", durationMin: 60, price: "", format: "Video call", form: "new-client", on: true }])}><Plus /> Add Your Own</Button>
      <Nav onBack={onBack} busy={busy} disabled={!chosen.length} next={chosen.length ? `Continue With ${chosen.length} ${chosen.length === 1 ? "Service" : "Services"}` : "Tick at Least One"} />
    </form>
  );
}

// ——— 3. Intake forms ————————————————————————————————————————————

function Forms({ profile, busy, onBack, onNext }: { profile: BookingProfile; busy: boolean; onBack: () => void; onNext: (forms: IntakeForm[], services: BookingService[]) => void }) {
  const existing = useStore(selectIntakeForms);
  const services = profile.services.filter((s) => s.active);
  const suggest = (s: BookingService) => (s.intakeFormId && existing.some((f) => f.id === s.intakeFormId) ? `id:${s.intakeFormId}` : (SUGGESTED.find((x) => x.key === s.id || x.name === s.name)?.form ?? "new-client"));
  const [pick, setPick] = React.useState<Record<string, string>>(() => Object.fromEntries(services.map((s) => [s.id, suggest(s)])));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // One copy of each starter that's used, shared by the services that chose it.
    const made: Record<string, IntakeForm> = {};
    const next = services.map((s) => {
      const v = pick[s.id] ?? "";
      if (!v) return { ...s, intakeFormId: undefined };
      if (v.startsWith("id:")) return { ...s, intakeFormId: v.slice(3) };
      if (!made[v]) {
        const starter = STARTER_FORMS.find((f) => f.key === v)!;
        made[v] = { id: uid("form"), updatedAt: nowLocal(), ...starter.build() };
      }
      return { ...s, intakeFormId: made[v]!.id };
    });
    onNext(Object.values(made), [...next, ...profile.services.filter((s) => !s.active)]);
  };
  return (
    <form onSubmit={submit}>
      <p className="mb-5 text-[14px] text-ink-3">When someone books, they get a short form to fill in before the session: birth details, what they’d like to explore and, if you like, their life events. We’ve matched a ready-made form to each service. You can edit the questions later in Settings › Intake Forms.</p>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {services.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <ClipboardList className="size-4 shrink-0 text-muted" aria-hidden />
            <span className="min-w-0 flex-1 text-[14px] font-medium text-ink">{s.name}</span>
            <Select aria-label={`Intake form for ${s.name}`} value={pick[s.id] ?? ""} onChange={(e) => setPick({ ...pick, [s.id]: e.target.value })} className="w-full sm:w-56">
              <option value="">No Form</option>
              {existing.map((f) => <option key={f.id} value={`id:${f.id}`}>{f.title}</option>)}
              {STARTER_FORMS.map((f) => <option key={f.key} value={f.key}>{f.title}{existing.length ? " (New)" : ""}</option>)}
            </Select>
          </li>
        ))}
      </ul>
      <Nav onBack={onBack} busy={busy} />
    </form>
  );
}

// ——— 4. Hours —————————————————————————————————————————————————

function Hours({ profile, busy, onBack, onNext }: { profile: BookingProfile; busy: boolean; onBack: () => void; onNext: (r: BookingProfile["rules"]) => void }) {
  const first = DAY_IDS.map((d) => profile.rules.weekly[d][0]).find(Boolean) ?? { start: "09:00", end: "17:00" };
  const [days, setDays] = React.useState<Record<Day, boolean>>(() => Object.fromEntries(DAY_IDS.map((d) => [d, profile.rules.weekly[d].length > 0])) as Record<Day, boolean>);
  const [range, setRange] = React.useState(first);
  const [notice, setNotice] = React.useState(profile.rules.minNoticeHours);
  const written = profile.services.every((s) => !s.active || isWritten(s.format));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext({ ...profile.rules, minNoticeHours: notice, weekly: Object.fromEntries(DAY_IDS.map((d) => [d, days[d] ? [range] : []])) as BookingProfile["rules"]["weekly"] }); }}>
      <p className="mb-5 text-[14px] text-ink-3">{written ? "Your services are all written readings, so clients don’t pick a time. You can still set your hours for later." : "When can clients book sessions? Pick your days and hours. You can set different hours for each day later in Settings › Booking."}</p>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink">Days</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_IDS.map((d) => (
            <button key={d} type="button" aria-pressed={days[d]} onClick={() => setDays({ ...days, [d]: !days[d] })} className={cn("h-10 w-14 rounded-lg border text-[13px] font-medium transition-colors", days[d] ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink-3 hover:bg-canvas-2")}>{DAY_NAMES[d]}</button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 grid max-w-md gap-4 sm:grid-cols-2">
        <Field label="From" htmlFor="ob-from"><Input id="ob-from" type="time" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} /></Field>
        <Field label="Until" htmlFor="ob-to"><Input id="ob-to" type="time" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} /></Field>
        <Field label="Minimum Notice" htmlFor="ob-notice" className="sm:col-span-2" hint="How soon before a session someone can book it.">
          <Select id="ob-notice" value={notice} onChange={(e) => setNotice(+e.target.value)}>{[[2, "2 Hours"], [12, "12 Hours"], [24, "1 Day"], [48, "2 Days"], [72, "3 Days"], [168, "1 Week"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
      </div>
      <Nav onBack={onBack} busy={busy} disabled={!written && (!DAY_IDS.some((d) => days[d]) || range.end <= range.start)} />
    </form>
  );
}

// ——— 5. Your page ——————————————————————————————————————————————

function YourPage({ profile, busy, onBack, onNext }: { profile: BookingProfile; busy: boolean; onBack: () => void; onNext: (p: Partial<BookingProfile>) => void }) {
  const [slug, setSlug] = React.useState(profile.slug);
  const [links, setLinks] = React.useState(profile.links?.length ? profile.links : [{ label: "", url: "" }]);
  const [live, setLive] = React.useState(true);
  const base = SITE_URL || (typeof window !== "undefined" ? `${window.location.origin}/book` : "/book");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext({ slug, enabled: live, links: links.filter((l) => l.label.trim() && l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })) }); }}>
      <p className="mb-5 text-[14px] text-ink-3">Your page shows your photo, links, services and bio, and clients book from it. Put the link in your social bios, website and email signature.</p>
      <Field label="Your Page Address" htmlFor="ob-slug" hint="Lowercase letters, numbers and hyphens.">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-[13px] text-muted">{base.replace(/^https?:\/\//, "")}/</span>
          <Input id="ob-slug" value={slug} maxLength={40} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} aria-describedby="bk-slug-status" />
        </div>
        <AddressStatus slug={slug} saved={profile.slug} />
      </Field>
      <div className="mt-5 space-y-2">
        <p className="text-[13px] font-medium text-ink">Links <span className="font-normal text-muted">(Optional)</span></p>
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
            <Input aria-label={`Link ${i + 1} label`} placeholder="e.g. Instagram" maxLength={60} value={l.label} onChange={(e) => setLinks(links.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
            <Input aria-label={`Link ${i + 1} address`} type="url" placeholder="https://" maxLength={500} value={l.url} onChange={(e) => setLinks(links.map((x, k) => (k === i ? { ...x, url: e.target.value.trim() } : x)))} />
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks(links.filter((_, k) => k !== i))}><Trash2 /></Button>
          </div>
        ))}
        {links.length < 8 && <Button type="button" variant="secondary" size="sm" onClick={() => setLinks([...links, { label: "", url: "" }])}><Plus /> Add Link</Button>}
      </div>
      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <Checkbox checked={live} onChange={(e) => setLive(e.target.checked)} label={<span className="text-[14px]"><span className="font-medium text-ink">Start Taking Bookings Now</span><span className="block text-[12.5px] text-muted">Untick to keep your page off until you’re ready. You can turn it on in Settings › Booking.</span></span>} />
      </div>
      <Nav onBack={onBack} busy={busy} next="Finish Setup" />
    </form>
  );
}

// ——— Done —————————————————————————————————————————————————————

function Done({ profile }: { profile: BookingProfile }) {
  const toast = useStore((s) => s.toast);
  const base = SITE_URL || (typeof window !== "undefined" ? `${window.location.origin}/book` : "/book");
  const url = `${base}/${profile.slug}`;
  const next = [
    { href: "/app/clients?import=1", icon: Upload, title: "Bring In Your Clients", body: "Import from Solar Fire (AAF) or a spreadsheet, then invite them to their portal." },
    { href: "/app/clients/new", icon: UserPlus, title: "Add a Client", body: "Their record, natal chart and portal invitation in one go." },
    { href: "/app/settings?section=intake", icon: ClipboardList, title: "Fine-Tune Your Forms", body: "Edit the questions each service asks." },
  ];
  return (
    <div>
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Check className="size-6" /></span>
        <p className="mt-3 text-[15px] text-ink-3">{profile.enabled ? "Your page is live:" : "Your page is ready (bookings are off for now):"}</p>
        <p className="mt-1 break-all font-medium text-ink">{url.replace(/^https?:\/\//, "")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(url).then(() => toast("Link Copied", url, "success"))}><Copy /> Copy Link</Button>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink hover:bg-canvas-2"><ExternalLink className="size-4" /> View Your Page</a>
        </div>
      </div>
      <h2 className="mb-3 mt-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Next Steps</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {next.map((n) => (
          <li key={n.href}>
            <Link href={n.href} className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:border-accent/50">
              <n.icon className="size-5 text-accent" />
              <span className="mt-2 text-[14px] font-semibold text-ink">{n.title}</span>
              <span className="mt-1 text-[12.5px] text-muted">{n.body}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 text-center"><Link href="/app" className="text-[13.5px] font-medium text-accent hover:underline">Go to Your Dashboard</Link></div>
    </div>
  );
}
