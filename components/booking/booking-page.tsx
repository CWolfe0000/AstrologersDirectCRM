"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Check, Clock, Globe2, Loader2, MapPin, Phone, Video } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Wordmark } from "@/components/ui/misc";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";

type Service = { id: string; name: string; description: string; durationMin: number; price: string; format: "Video call" | "Phone" | "In person" };
type Profile = { slug: string; displayName: string; headline: string; about: string; location: string; practice: string; tz: string; services: Service[] };
type Booked = { start: string; service: string; durationMin: number; format: string; displayName: string; meetingUrl: string | null };

const FORMAT_ICON = { "Video call": Video, Phone: Phone, "In person": MapPin } as const;
const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const timeLabel = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const dayLabel = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const longWhen = (iso: string, tz: string) =>
  `${new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso))} at ${new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso))}`;

function browserZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** The public booking page: profile and services → time → details → booked. */
export function BookingPage({ slug }: { slug: string }) {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [service, setService] = React.useState<Service | null>(null);
  const [slots, setSlots] = React.useState<string[] | null>(null);
  const [tz, setTz] = React.useState("UTC");
  const [day, setDay] = React.useState<string | null>(null);
  const [start, setStart] = React.useState<string | null>(null);
  const [booked, setBooked] = React.useState<Booked | null>(null);

  React.useEffect(() => {
    setTz(browserZone());
    api<Profile>(`/api/public/book/${encodeURIComponent(slug)}`).then(setProfile, (e: Error) => setError(e.message));
  }, [slug]);

  React.useEffect(() => {
    if (!service) return;
    setSlots(null);
    setDay(null);
    setStart(null);
    api<{ slots: string[] }>(`/api/public/book/${encodeURIComponent(slug)}/slots?service=${encodeURIComponent(service.id)}`).then((r) => setSlots(r.slots), (e: Error) => setError(e.message));
  }, [service, slug]);

  const byDay = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots ?? []) {
      const k = dayKey(s, tz);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots, tz]);
  React.useEffect(() => {
    if (slots && !day) setDay([...byDay.keys()][0] ?? null);
  }, [slots, byDay, day]);

  const zones = React.useMemo(() => {
    try {
      return Array.from(new Set([tz, ...(Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone")]));
    } catch {
      return [tz];
    }
  }, [tz]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="text-[13px] text-muted">Online booking</span>
          <Link href="/" className="opacity-80 hover:opacity-100" aria-label="AstrologersDirect"><Wordmark compact /></Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {error && !profile && (
          <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
            <p className="font-serif text-[26px] text-ink">This booking page isn’t available</p>
            <p className="mt-2 text-[14px] text-muted">The link may be mistyped, or bookings may be paused. Please check with your astrologer.</p>
          </div>
        )}
        {!profile && !error && <div className="h-64 animate-pulse rounded-2xl bg-canvas-2" />}
        {profile && booked && <Confirmation booked={booked} tz={tz} />}
        {profile && !booked && (
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            <aside>
              <Avatar name={profile.displayName} size="lg" />
              <h1 className="mt-4 font-serif text-[30px] leading-tight text-ink">{profile.displayName}</h1>
              {profile.headline && <p className="mt-1 text-[14px] text-ink-3">{profile.headline}</p>}
              {profile.practice && <p className="mt-0.5 text-[13px] text-muted">{profile.practice}</p>}
              {profile.about && <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-muted">{profile.about}</p>}
              {profile.location && (
                <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-3"><MapPin className="mt-0.5 size-4 shrink-0 text-muted" /> {profile.location}</p>
              )}
            </aside>

            <section aria-live="polite">
              {!service ? (
                <>
                  <h2 className="font-serif text-[24px] text-ink">Choose a Session</h2>
                  <ul className="mt-4 space-y-3">
                    {profile.services.map((s) => {
                      const Icon = FORMAT_ICON[s.format];
                      return (
                        <li key={s.id}>
                          <button type="button" onClick={() => setService(s)} className="w-full rounded-2xl border border-line bg-surface p-5 text-left transition-colors hover:border-accent/50">
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-[16px] font-semibold text-ink">{s.name}</span>
                              {s.price && <span className="text-[15px] text-ink">{s.price}</span>}
                            </span>
                            {s.description && <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">{s.description}</span>}
                            <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
                              <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5 text-muted" /> {s.durationMin} minutes</span>
                              <span className="inline-flex items-center gap-1.5"><Icon className="size-3.5 text-muted" /> {s.format}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {profile.services.some((s) => s.price) && <p className="mt-4 text-[12.5px] text-muted">Payment is arranged directly with {profile.displayName}.</p>}
                </>
              ) : !start ? (
                <>
                  <button type="button" onClick={() => setService(null)} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> All sessions</button>
                  <h2 className="mt-3 font-serif text-[24px] text-ink">{service.name}</h2>
                  <p className="text-[13px] text-muted">{service.durationMin} minutes · {service.format}{service.price ? ` · ${service.price}` : ""}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                    <Globe2 className="size-4" />
                    <label htmlFor="bk-tz">Times shown in</label>
                    <Select id="bk-tz" value={tz} onChange={(e) => setTz(e.target.value)} className="h-8 w-auto max-w-[240px] text-[12.5px]">
                      {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
                    </Select>
                  </div>
                  {!slots ? (
                    <div className="mt-6 flex items-center gap-2 text-[13px] text-muted"><Loader2 className="size-4 animate-spin" /> Finding open times…</div>
                  ) : byDay.size === 0 ? (
                    <p className="mt-6 rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-center text-[14px] text-muted">No open times right now. Please check back soon, or contact {profile.displayName} directly.</p>
                  ) : (
                    <>
                      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Days">
                        {[...byDay.keys()].map((k) => (
                          <button key={k} type="button" aria-pressed={day === k} onClick={() => setDay(k)} className={cn("shrink-0 rounded-xl border px-3 py-2 text-[13px]", day === k ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-line-strong")}>
                            {dayLabel(k)}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Times">
                        {(day ? byDay.get(day) ?? [] : []).map((s) => (
                          <button key={s} type="button" onClick={() => setStart(s)} className="rounded-lg border border-line bg-surface px-2 py-2.5 text-[14px] font-medium text-ink hover:border-accent hover:text-accent">
                            {timeLabel(s, tz)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Details slug={slug} profile={profile} service={service} start={start} tz={tz} onBack={() => setStart(null)} onBooked={setBooked} onTaken={() => { setStart(null); setService({ ...service }); }} />
              )}
            </section>
          </div>
        )}
      </main>
      <footer className="mx-auto max-w-4xl px-4 pb-10 text-center text-[12px] text-muted">
        Booking by AstrologersDirect · <Link href="/legal/privacy" className="underline">Privacy</Link>
      </footer>
    </div>
  );
}

function Details({ slug, profile, service, start, tz, onBack, onBooked, onTaken }: { slug: string; profile: Profile; service: Service; start: string; tz: string; onBack: () => void; onBooked: (b: Booked) => void; onTaken: () => void }) {
  const [f, setF] = React.useState({ firstName: "", lastName: "", email: "", phone: "", date: "", time: "", notes: "", website: "" });
  const [unknownTime, setUnknownTime] = React.useState(false);
  const [place, setPlace] = React.useState<PlaceValue | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ok = f.firstName.trim() && /\S+@\S+\.\S+/.test(f.email) && f.date && (unknownTime || f.time) && place && consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || !place) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<Booked>(`/api/public/book/${encodeURIComponent(slug)}`, {
        body: {
          serviceId: service.id,
          start,
          firstName: f.firstName,
          lastName: f.lastName,
          email: f.email,
          phone: f.phone,
          birth: { date: f.date, time: unknownTime ? "12:00" : f.time, timeAccuracy: unknownTime ? "unknown" : "exact", place: place.place, lat: place.lat, lon: place.lon, tz: place.tz },
          notes: f.notes,
          tz,
          website: f.website,
        },
      });
      onBooked(r);
    } catch (err) {
      const m = (err as Error & { status?: number }).message;
      setError(m);
      if ((err as { status?: number }).status === 409) setTimeout(onTaken, 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="relative">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Choose another time</button>
      <div className="mt-3 rounded-xl border border-accent-100 bg-accent-50/60 px-4 py-3">
        <p className="text-[15px] font-semibold text-ink">{service.name}</p>
        <p className="text-[13.5px] text-ink-3">{longWhen(start, tz)} · {service.durationMin} minutes · {service.format}</p>
      </div>
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label>Website <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="First Name" htmlFor="bk-fn"><Input id="bk-fn" autoComplete="given-name" required maxLength={100} value={f.firstName} onChange={set("firstName")} /></Field>
        <Field label="Last Name" htmlFor="bk-ln"><Input id="bk-ln" autoComplete="family-name" maxLength={100} value={f.lastName} onChange={set("lastName")} /></Field>
        <Field label="Email" htmlFor="bk-em"><Input id="bk-em" type="email" autoComplete="email" required maxLength={254} value={f.email} onChange={set("email")} /></Field>
        <Field label="Phone" htmlFor="bk-ph" optional><Input id="bk-ph" type="tel" autoComplete="tel" maxLength={60} value={f.phone} onChange={set("phone")} /></Field>
      </div>
      <p className="mb-3 mt-6 text-[14px] font-semibold text-ink">Your Birth Details</p>
      <p className="mb-3 -mt-2 text-[12.5px] text-muted">{profile.displayName} uses these to prepare your chart before the session.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of Birth" htmlFor="bk-bd"><Input id="bk-bd" type="date" required value={f.date} onChange={set("date")} /></Field>
        <Field label="Time of Birth" htmlFor="bk-bt" hint={unknownTime ? "That’s fine: your astrologer will work with what you know." : "As exact as you can, ideally from a birth certificate."}>
          <Input id="bk-bt" type="time" disabled={unknownTime} value={f.time} onChange={set("time")} />
        </Field>
        <div className="sm:col-span-2 -mt-2"><Checkbox label={<span className="text-[13px]">I don’t know my birth time</span>} checked={unknownTime} onChange={(e) => setUnknownTime(e.target.checked)} /></div>
        <Field label="Place of Birth" htmlFor="bk-bp" className="sm:col-span-2"><PlaceLookup id="bk-bp" value={place} onChange={setPlace} endpoint="/api/public/places" /></Field>
        <Field label="Anything You’d Like to Focus On?" htmlFor="bk-nt" optional className="sm:col-span-2">
          <Textarea id="bk-nt" rows={3} maxLength={2000} value={f.notes} onChange={set("notes")} placeholder="Questions, themes or what’s happening for you right now." />
        </Field>
      </div>
      <div className="mt-5">
        <Checkbox
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          label={<span className="text-[13px] text-ink-3">I agree that {profile.displayName} will keep my details and birth information to prepare and follow up on my session. <Link href="/legal/privacy" className="underline" target="_blank">Privacy</Link></span>}
        />
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" disabled={!ok || busy}>
        {busy ? <Loader2 className="animate-spin" /> : <CalendarCheck />} Book {service.name}
      </Button>
    </form>
  );
}

function Confirmation({ booked, tz }: { booked: Booked; tz: string }) {
  const ics = React.useMemo(() => {
    const s = new Date(booked.start);
    const e = new Date(s.getTime() + booked.durationMin * 60_000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AstrologersDirect//Booking//EN", "BEGIN:VEVENT", `UID:${f(s)}-${Math.random().toString(36).slice(2)}@astrologersdirect.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${booked.service} with ${booked.displayName}`, `LOCATION:${booked.meetingUrl ?? booked.format}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  }, [booked]);
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Check className="size-6" /></span>
      <h1 className="mt-4 font-serif text-[30px] text-ink">You’re Booked</h1>
      <p className="mt-2 text-[15px] text-ink-3">{booked.service} with {booked.displayName}</p>
      <p className="text-[15px] font-medium text-ink">{longWhen(booked.start, tz)}</p>
      <p className="mt-1 text-[13px] text-muted">{booked.durationMin} minutes · {booked.format}</p>
      <p className="mt-5 text-[13.5px] leading-relaxed text-muted">We’ve emailed your confirmation. To change or cancel, reply to that email.</p>
      <a href={ics} download="session.ics" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-medium text-ink hover:bg-canvas-2">
        <CalendarCheck className="size-4" /> Add to Calendar
      </a>
    </div>
  );
}
