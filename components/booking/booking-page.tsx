"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Check, ChevronRight, Clock, Globe, Loader2, MapPin, Phone, Video, PenLine, Headphones, Mic } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/input";
import { PlaceLookup, type PlaceValue } from "@/components/clients/place-lookup";
import { BookingShell, TimePicker, browserZone, longWhen } from "./shared";
import { accentVars } from "@/lib/brand";
import { formatLabel, isDelivered } from "@/lib/booking/formats";
import { priceCents } from "@/lib/booking/payments";

type Service = { id: string; name: string; description: string; durationMin: number; price: string; format: "Live session" | "Recorded reading" | "Written reading" | "Video call" | "Audio call" | "Phone" | "In person"; deliveryDays?: number; recording?: "audio" | "video" };
type Profile = { slug: string; displayName: string; headline: string; about: string; location: string; practice: string; tz: string; photo: string | null; links: { label: string; url: string }[]; accent: string | null; services: Service[]; payments: { refundPolicy: string } | null };
type Booked = { start: string; service: string; durationMin: number; format: string; written?: boolean; instructions?: string; displayName: string; meetingUrl: string | null; manage: string; paid?: boolean };

const FORMAT_ICON = { "Video call": Video, Phone: Phone, "In person": MapPin, "Written reading": PenLine, "Audio call": Headphones, "Live session": Video, "Recorded reading": Mic } as const;
/** The public booking page: profile and services → time → details → booked. */
export function BookingPage({ slug }: { slug: string }) {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [service, setService] = React.useState<Service | null>(null);
  const [slots, setSlots] = React.useState<string[] | null>(null);
  const [tz, setTz] = React.useState("UTC");
  const [start, setStart] = React.useState<string | null>(null);
  const [booked, setBooked] = React.useState<Booked | null>(null);
  /** Back from Stripe: confirming the payment, or they left without paying. */
  const [returning, setReturning] = React.useState<"confirming" | "unpaid" | null>(null);
  const [payError, setPayError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const paid = q.get("paid");
    const unpaid = q.get("unpaid");
    const clean = () => window.history.replaceState(null, "", window.location.pathname);
    if (unpaid) {
      setReturning("unpaid");
      api(`/api/public/book/${encodeURIComponent(slug)}/release`, { body: { id: unpaid } }).catch(() => {});
      clean();
    }
    if (!paid) return;
    setReturning("confirming");
    let stop = false;
    (async () => {
      // Stripe usually confirms instantly; allow a little time for the bank.
      for (let i = 0; i < 20 && !stop; i++) {
        try {
          const r = await api<Booked | { pending: true }>(`/api/public/book/${encodeURIComponent(slug)}/confirm`, { body: { session: paid } });
          if (!("pending" in r)) { setBooked({ ...r, paid: true }); setReturning(null); clean(); return; }
        } catch (e) { setPayError((e as Error).message); setReturning(null); clean(); return; }
        await new Promise((res) => setTimeout(res, 1500));
      }
      setPayError("Your payment is still being confirmed. You’ll get an email as soon as it’s through.");
      setReturning(null);
    })();
    return () => { stop = true; };
  }, [slug]);

  React.useEffect(() => {
    setTz(browserZone());
    api<Profile>(`/api/public/book/${encodeURIComponent(slug)}`).then(setProfile, (e: Error) => setError(e.message));
  }, [slug]);

  React.useEffect(() => {
    if (!service) return;
    setSlots(null);
    setStart(null);
    api<{ slots: string[] }>(`/api/public/book/${encodeURIComponent(slug)}/slots?service=${encodeURIComponent(service.id)}`).then((r) => setSlots(r.slots), (e: Error) => setError(e.message));
  }, [service, slug]);

  return (
    <BookingShell profile style={accentVars(profile?.accent ?? undefined) as React.CSSProperties | undefined}>
      {error && !profile && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <p className="font-serif text-[26px] text-ink">This Booking Page Isn’t Available</p>
          <p className="mt-2 text-[14px] text-muted">The link may be mistyped, or bookings may be paused. Please check with your astrologer.</p>
        </div>
      )}
      {!profile && !error && <div className="mx-auto h-64 max-w-[520px] animate-pulse rounded-2xl bg-canvas-2" />}
      {profile && booked && <div className="mx-auto max-w-[560px]"><Confirmation booked={booked} tz={tz} /></div>}
      {profile && !booked && returning === "confirming" && (
        <div className="mx-auto max-w-[520px] rounded-2xl border border-line bg-surface px-6 py-12 text-center" role="status">
          <Loader2 className="mx-auto size-6 animate-spin text-accent" />
          <p className="mt-3 font-serif text-[22px] text-ink">Confirming Your Payment…</p>
        </div>
      )}
      {profile && !booked && payError && (
        <p role="alert" className="mx-auto mb-4 max-w-[520px] rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{payError}</p>
      )}
      {profile && !booked && returning === "unpaid" && !service && (
        <p role="status" className="mx-auto mb-4 max-w-[520px] rounded-lg bg-canvas-2 px-4 py-3 text-center text-[13.5px] text-ink-3">Your payment wasn’t completed, so nothing was booked. Choose a session to try again.</p>
      )}
      {profile && !booked && returning !== "confirming" && (
        <div className="mx-auto max-w-[520px]">
          {!service ? (
            <>
              <ProfileHeader profile={profile} />
              <section aria-labelledby="bk-services" className="mt-8">
                <h2 id="bk-services" className="mb-3 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Book a Session</h2>
                <ul className="space-y-3">
                  {profile.services.map((s) => {
                    const Icon = FORMAT_ICON[s.format];
                    return (
                      <li key={s.id}>
                        <button type="button" onClick={() => setService(s)} className="group w-full rounded-2xl border border-line bg-surface px-5 py-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md">
                          <span className="flex items-center gap-3">
                            <span className="min-w-0 flex-1">
                              <span className="block text-[16px] font-semibold text-ink">{s.name}</span>
                              <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
                                {isDelivered(s.format) ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> Ready in {s.deliveryDays ?? 7} days</span> : <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {s.durationMin} min</span>}
                                <span className="inline-flex items-center gap-1"><Icon className="size-3.5" /> {formatLabel(s.format, s.recording)}</span>
                              </span>
                            </span>
                            {s.price && <span className="shrink-0 rounded-full bg-accent-50 px-3 py-1 text-[14px] font-medium text-accent">{s.price}</span>}
                            <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                          </span>
                          {s.description && <span className="mt-2 block text-[13.5px] leading-relaxed text-ink-3">{s.description}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {profile.services.some((s) => s.price) && (
                  <p className="mt-3 text-center text-[12.5px] text-muted">
                    {profile.payments ? <>Pay securely when you book. {profile.payments.refundPolicy}</> : <>Payment is arranged directly with {profile.displayName}.</>}
                  </p>
                )}
              </section>
              {profile.about && <About text={profile.about} name={profile.displayName} />}
            </>
          ) : (
            <section aria-live="polite">
              <div className="mb-6 flex items-center gap-3">
                <Photo profile={profile} size={44} />
                <div className="min-w-0">
                  <p className="text-[13px] text-muted">{profile.displayName}</p>
                  <h1 className="font-serif text-[24px] leading-tight text-ink">{service.name}</h1>
                </div>
              </div>
              {!start && !isDelivered(service.format) ? (
                <>
                  <button type="button" onClick={() => setService(null)} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> All Sessions</button>
                  <p className="mt-2 text-[13px] text-muted">{service.durationMin} minutes · {formatLabel(service.format)}{service.price ? ` · ${service.price}` : ""}</p>
                  <div className="mt-5">
                    <TimePicker
                      slots={slots}
                      tz={tz}
                      onTz={setTz}
                      onPick={setStart}
                      empty={<p className="rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-center text-[14px] text-muted">No open times right now. Please check back soon, or contact {profile.displayName} directly.</p>}
                    />
                  </div>
                </>
              ) : (
                <Details slug={slug} profile={profile} service={service} start={start ?? ""} tz={tz} onBack={() => (isDelivered(service.format) ? setService(null) : setStart(null))} onBooked={setBooked} onTaken={() => { setStart(null); setService({ ...service }); }} />
              )}
            </section>
          )}
        </div>
      )}
    </BookingShell>
  );
}

function Photo({ profile, size }: { profile: Profile; size: number }) {
  if (profile.photo) return <img src={profile.photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover ring-4 ring-surface" style={{ width: size, height: size }} />;
  const initials = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-accent font-serif text-white ring-4 ring-surface" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>{initials}</span>;
}

const linkHost = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

/** Photo, name, headline, and the astrologer's own links: link-in-bio style. */
function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex flex-col items-center text-center">
      <Photo profile={profile} size={104} />
      <h1 className="mt-4 font-serif text-[30px] leading-tight text-ink">{profile.displayName}</h1>
      {profile.headline && <p className="mt-1 text-[15px] text-ink-3">{profile.headline}</p>}
      {(profile.practice || profile.location) && (
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 text-[13px] text-muted">
          {profile.practice && <span>{profile.practice}</span>}
          {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {profile.location}</span>}
        </p>
      )}
      {profile.links.length > 0 && (
        <ul className="mt-5 flex w-full flex-col gap-2" aria-label="Links">
          {profile.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-3 text-[14px] font-medium text-ink transition-colors hover:border-accent hover:text-accent">
                <Globe className="size-4 text-muted" aria-hidden /> {l.label}
                <span className="sr-only"> ({linkHost(l.url)}, opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** The bio: a short preview, with the rest a tap away. */
function About({ text, name }: { text: string; name: string }) {
  const long = text.length > 320;
  const [open, setOpen] = React.useState(false);
  return (
    <section aria-labelledby="bk-about" className="mt-8 rounded-2xl border border-line bg-surface px-5 py-5">
      <h2 id="bk-about" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">About {name.split(" ")[0]}</h2>
      <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-3">{long && !open ? `${text.slice(0, 300).trimEnd()}…` : text}</p>
      {long && <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-[13px] font-medium text-accent hover:underline">{open ? "Show Less" : "Read More"}</button>}
    </section>
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
  const written = isDelivered(service.format);
  const phoneCall = service.format === "Phone";
  const pays = !!profile.payments && priceCents(service.price) !== null;
  const ok = f.firstName.trim() && /\S+@\S+\.\S+/.test(f.email) && (!phoneCall || f.phone.trim()) && f.date && (unknownTime || f.time) && place && consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || !place) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<Booked | { checkout: string }>(`/api/public/book/${encodeURIComponent(slug)}`, {
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
      if ("checkout" in r) {
        window.location.assign(r.checkout); // Stripe Checkout; they come back to this page
        return;
      }
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
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> {written ? "All Sessions" : "Choose Another Time"}</button>
      <div className="mt-3 rounded-xl border border-accent-100 bg-accent-50/60 px-4 py-3">
        <p className="text-[15px] font-semibold text-ink">{service.name}</p>
        <p className="text-[13.5px] text-ink-3">{written ? `${formatLabel(service.format, service.recording)} · Ready in ${service.deliveryDays ?? 7} days` : `${longWhen(start, tz)} · ${service.durationMin} minutes · ${formatLabel(service.format)}`}</p>
      </div>
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label>Website <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="First Name" htmlFor="bk-fn"><Input id="bk-fn" autoComplete="given-name" required maxLength={100} value={f.firstName} onChange={set("firstName")} /></Field>
        <Field label="Last Name" htmlFor="bk-ln"><Input id="bk-ln" autoComplete="family-name" maxLength={100} value={f.lastName} onChange={set("lastName")} /></Field>
        <Field label="Email" htmlFor="bk-em"><Input id="bk-em" type="email" autoComplete="email" required maxLength={254} value={f.email} onChange={set("email")} /></Field>
        <Field label="Phone" htmlFor="bk-ph" optional={!phoneCall} hint={phoneCall ? `${profile.displayName} will call you on this number.` : undefined}><Input id="bk-ph" type="tel" autoComplete="tel" required={phoneCall} maxLength={60} value={f.phone} onChange={set("phone")} /></Field>
      </div>
      <p className="mb-3 mt-6 text-[14px] font-semibold text-ink">Your Birth Details</p>
      <p className="mb-3 -mt-2 text-[12.5px] text-muted">{profile.displayName} uses these to prepare your chart{written ? "." : " before the session."}</p>
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
      {pays && profile.payments && (
        <p className="mt-5 rounded-xl bg-canvas-2 px-4 py-3 text-[13px] leading-relaxed text-ink-3">
          <span className="font-medium text-ink">{service.price}, paid securely with Stripe.</span> {profile.payments.refundPolicy}
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" disabled={!ok || busy}>
        {busy ? <Loader2 className="animate-spin" /> : <CalendarCheck />} {pays ? `Continue to Payment` : `${written ? "Order" : "Book"} ${service.name}`}
      </Button>
    </form>
  );
}

function Confirmation({ booked, tz }: { booked: Booked; tz: string }) {
  const ics = React.useMemo(() => {
    const s = new Date(booked.start);
    const e = new Date(s.getTime() + booked.durationMin * 60_000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AstrologersDirect//Booking//EN", "BEGIN:VEVENT", `UID:${f(s)}-${Math.random().toString(36).slice(2)}@astrologersdirect.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${booked.service} with ${booked.displayName}`, `LOCATION:${booked.meetingUrl ?? formatLabel(booked.format)}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  }, [booked]);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date(booked.start));
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Check className="size-6" /></span>
      <h1 className="mt-4 font-serif text-[30px] text-ink">{booked.written ? "Thank You" : "You’re Booked"}</h1>
      <p className="mt-2 text-[15px] text-ink-3">{booked.service} {booked.written ? "from" : "with"} {booked.displayName}</p>
      {booked.paid && <p className="mt-1 text-[13px] font-medium text-sage-dark">Payment Received</p>}
      {booked.written ? (
        <p className="text-[15px] font-medium text-ink">Ready by {day}</p>
      ) : (
        <>
          <p className="text-[15px] font-medium text-ink">{longWhen(booked.start, tz)}</p>
          <p className="mt-1 text-[13px] text-muted">{booked.durationMin} minutes · {formatLabel(booked.format)}</p>
        </>
      )}
      {booked.instructions && <p className="mx-auto mt-5 max-w-md whitespace-pre-line rounded-xl bg-canvas-2 px-4 py-3 text-left text-[13.5px] leading-relaxed text-ink-3">{booked.instructions}</p>}
      <p className="mt-5 text-[13.5px] leading-relaxed text-muted">{booked.written ? "We’ve emailed your confirmation, with a link to cancel if you need to." : "We’ve emailed your confirmation, with a link to reschedule or cancel if you need to."}</p>
      {!booked.written && (
        <a href={ics} download="session.ics" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-medium text-ink hover:bg-canvas-2">
          <CalendarCheck className="size-4" /> Add to Calendar
        </a>
      )}
      <p className="mt-4"><a href={booked.manage} className="text-[13px] text-accent underline">Manage This Booking</a></p>
    </div>
  );
}
