"use client";

import { selectIntakeForms } from "@/lib/intake";
import * as React from "react";
import { Check, Copy, ExternalLink, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { DATA_MODE, uid } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { squarePhoto } from "@/lib/photo";
import { DAYS, type BookingProfile, type BookingService, type Day } from "@/lib/booking/types";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SimulatedNote } from "@/components/ui/misc";
import { DEFAULT_INSTRUCTIONS, DELIVERY_DAYS, OFFERED_FORMATS, formatLabel, isCall, isDelivered } from "@/lib/booking/formats";

const DURATIONS = [30, 45, 60, 75, 90, 120];

/** Settings → Booking: the public booking page, services, weekly hours and rules. */
export function BookingSection() {
  const intakeForms = useStore(selectIntakeForms);
  const toast = useStore((s) => s.toast);
  const tz = useStore((s) => s.practitioner.timezone);
  const [p, setP] = React.useState<BookingProfile | null>(null);
  const [saved, setSaved] = React.useState<BookingProfile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (DATA_MODE === "demo") return;
    api<{ profile: BookingProfile }>("/api/v1/booking").then((r) => {
      setP(r.profile);
      setSaved(r.profile);
    }, (e: Error) => setError(e.message));
  }, []);

  if (DATA_MODE === "demo")
    return (
      <Card>
        <CardHeader title="Online Booking" />
        <CardBody><SimulatedNote>Online booking runs in the live app: a public page where clients choose a session and a time, and everything is filed for you.</SimulatedNote></CardBody>
      </Card>
    );
  if (!p) return <div className="h-64 animate-pulse rounded-xl bg-canvas-2">{error && <p className="p-6 text-[13px] text-danger">{error}</p>}</div>;

  // The short address on the website host (astrologersdirect.com/<address>); /book/<address> also works.
  const base = SITE_URL || (typeof window !== "undefined" ? `${window.location.origin}/book` : "/book");
  const url = `${base}/${p.slug}`;
  const dirty = JSON.stringify(p) !== JSON.stringify(saved);
  const set = (patch: Partial<BookingProfile>) => setP({ ...p, ...patch });
  const setService = (id: string, patch: Partial<BookingService>) => set({ services: p.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const setDay = (d: Day, on: boolean, range?: { start: string; end: string }) =>
    set({ rules: { ...p.rules, weekly: { ...p.rules.weekly, [d]: on ? [range ?? p.rules.weekly[d][0] ?? { start: "09:00", end: "17:00" }] : [] } } });

  const save = async (patch: Partial<BookingProfile> = {}) => {
    const next = { ...p, ...patch };
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ profile: BookingProfile }>("/api/v1/booking", { method: "PUT", body: next });
      setP(r.profile);
      setSaved(r.profile);
      toast("Booking Settings Saved", next.enabled ? "Your booking page is live." : "Your booking page is off.", "success");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Booking Page" description="Share this link wherever clients find you: your website, email signature or social profiles." />
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-ink">Accept Online Bookings</p>
              <p className="text-[12.5px] text-muted">{p.enabled ? "Your page is live." : "Your page is off: the link shows “not available”."}</p>
            </div>
            <Switch checked={p.enabled} onCheckedChange={(v) => void save({ enabled: v })} aria-label="Accept Online Bookings" disabled={busy} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-ink">Let Search Engines List My Page</p>
              <p className="text-[12.5px] text-muted">{p.searchable ? "Google and others can show your page in search results." : "Off: only people with the link can find your page."}</p>
            </div>
            <Switch checked={!!p.searchable} onCheckedChange={(v) => set({ searchable: v })} aria-label="Let Search Engines List My Page" />
          </div>
          <Field label="Page Address" htmlFor="bk-slug" hint="Lowercase letters, numbers and hyphens. Save to apply.">
            <div className="flex items-center gap-1.5">
              <span className="hidden shrink-0 text-[13px] text-muted sm:inline">{base.replace(/^https?:\/\//, "")}/</span>
              <Input id="bk-slug" value={p.slug} maxLength={40} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} aria-describedby="bk-slug-status" />
            </div>
            <AddressStatus slug={p.slug} saved={saved?.slug} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(url).then(() => toast("Link Copied", url, "success"))}><Copy /> Copy Link</Button>
            <a href={`${base}/${saved?.slug ?? p.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink hover:bg-canvas-2"><ExternalLink className="size-4" /> Open Page</a>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Public Profile" description="Your link-in-bio page: photo, name, links, your services as a menu, and a short bio." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            {p.photo ? <img src={p.photo} alt="Your profile photo" className="size-20 rounded-full object-cover" /> : <span className="flex size-20 items-center justify-center rounded-full bg-canvas-2 text-[12px] text-muted">No Photo</span>}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink hover:bg-canvas-2 focus-within:ring-2 focus-within:ring-accent/40">
                <ImagePlus className="size-4" /> {p.photo ? "Change Photo" : "Add Photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Profile Photo" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try { set({ photo: await squarePhoto(f) }); } catch (err) { toast("Photo Not Added", (err as Error).message, "error"); }
                }} />
              </label>
              {p.photo && <Button variant="ghost" size="sm" onClick={() => set({ photo: undefined })}><Trash2 /> Remove</Button>}
              <p className="w-full text-[12px] text-muted">A square crop from the middle of the photo, resized for the page. Remember to save.</p>
            </div>
          </div>
          <Field label="Name" htmlFor="bk-name"><Input id="bk-name" maxLength={120} value={p.displayName} onChange={(e) => set({ displayName: e.target.value })} /></Field>
          <Field label="Headline" htmlFor="bk-head" optional><Input id="bk-head" maxLength={160} value={p.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="e.g. Evolutionary astrologer" /></Field>
          <Field label="About" htmlFor="bk-about" optional className="sm:col-span-2"><Textarea id="bk-about" rows={4} maxLength={4000} value={p.about} onChange={(e) => set({ about: e.target.value })} /></Field>
          <Field label="In-Person Location" htmlFor="bk-loc" optional hint="Shown for in-person sessions."><Input id="bk-loc" maxLength={200} value={p.location} onChange={(e) => set({ location: e.target.value })} /></Field>
          <Field label="Call Link" htmlFor="bk-meet" optional hint="Your Zoom or Meet room, sent with video and audio call bookings."><Input id="bk-meet" type="url" placeholder="https://" maxLength={500} value={p.meetingUrl} onChange={(e) => set({ meetingUrl: e.target.value.trim() })} /></Field>
          <div className="space-y-2 sm:col-span-2">
            <p className="text-[13px] font-medium text-ink">Links</p>
            <p className="-mt-1 text-[12px] text-muted">Your website, Instagram, newsletter, podcast: shown as buttons under your name.</p>
            {(p.links ?? []).map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                <Input aria-label={`Link ${i + 1} label`} placeholder="e.g. Instagram" maxLength={60} value={l.label} onChange={(e) => set({ links: (p.links ?? []).map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                <Input aria-label={`Link ${i + 1} address`} type="url" placeholder="https://" maxLength={500} value={l.url} onChange={(e) => set({ links: (p.links ?? []).map((x, k) => (k === i ? { ...x, url: e.target.value.trim() } : x)) })} />
                <Button variant="ghost" size="icon-sm" aria-label={`Remove link ${i + 1}`} onClick={() => set({ links: (p.links ?? []).filter((_, k) => k !== i) })}><Trash2 /></Button>
              </div>
            ))}
            {(p.links ?? []).length < 8 && <Button variant="secondary" size="sm" onClick={() => set({ links: [...(p.links ?? []), { label: "", url: "" }] })}><Plus /> Add Link</Button>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Client Instructions" description="What clients need to know for each kind of session. Sent with their booking confirmation and shown on their booking page." />
        <CardBody className="space-y-4">
          {OFFERED_FORMATS.map((f) => {
            const key = f as keyof typeof DEFAULT_INSTRUCTIONS;
            return (
              <Field key={f} label={formatLabel(f)} htmlFor={`bk-in-${f}`} hint={isCall(f) ? "Your call link is added automatically." : f === "Recorded reading" ? "Recorded readings have no time slot: clients get a ready-by date. You record and deliver them from the Recording Studio." : "Written readings have no time slot: clients get a ready-by date instead."}>
                <Textarea id={`bk-in-${f}`} rows={2} maxLength={2000} value={p.instructions?.[key] ?? DEFAULT_INSTRUCTIONS[key]} onChange={(e) => set({ instructions: { ...(p.instructions ?? {}), [key]: e.target.value } })} />
              </Field>
            );
          })}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Services" description="Each one is a bookable session. Prices are shown as written; payment is arranged directly for now." action={<Button size="sm" variant="secondary" onClick={() => set({ services: [...p.services, { id: uid("svc"), name: "", description: "", durationMin: 60, price: "", format: "Live session", active: true }] })}><Plus /> Add Service</Button>} />
        <CardBody className="space-y-3">
          {p.services.length === 0 && <p className="text-[13px] text-muted">No services yet. Add one to start taking bookings.</p>}
          {p.services.map((s, i) => (
            <fieldset key={s.id} className="rounded-lg border border-line p-3">
              <legend className="sr-only">Service {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_140px]">
                <Field label="Service Name" htmlFor={`sv-n-${s.id}`}><Input id={`sv-n-${s.id}`} maxLength={120} value={s.name} onChange={(e) => setService(s.id, { name: e.target.value })} /></Field>
                {isDelivered(s.format) ? (
                  <Field label="Ready Within" htmlFor={`sv-d-${s.id}`}>
                    <Select id={`sv-d-${s.id}`} value={s.deliveryDays ?? 7} onChange={(e) => setService(s.id, { deliveryDays: +e.target.value })}>
                      {Array.from(new Set([...DELIVERY_DAYS, s.deliveryDays ?? 7])).sort((a, b) => a - b).map((d) => <option key={d} value={d}>{d} days</option>)}
                    </Select>
                  </Field>
                ) : (
                  <Field label="Length" htmlFor={`sv-d-${s.id}`}>
                    <Select id={`sv-d-${s.id}`} value={s.durationMin} onChange={(e) => setService(s.id, { durationMin: +e.target.value })}>
                      {Array.from(new Set([...DURATIONS, s.durationMin])).sort((a, b) => a - b).map((d) => <option key={d} value={d}>{d} min</option>)}
                    </Select>
                  </Field>
                )}
                <Field label="Format" htmlFor={`sv-f-${s.id}`}>
                  <Select id={`sv-f-${s.id}`} value={s.format} onChange={(e) => setService(s.id, { format: e.target.value as BookingService["format"] })}>
                    {[...OFFERED_FORMATS, ...(OFFERED_FORMATS.includes(s.format) ? [] : [s.format])].map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}
                  </Select>
                </Field>
                {s.format === "Recorded reading" && (
                  <Field label="Recording" htmlFor={`sv-r-${s.id}`}>
                    <Select id={`sv-r-${s.id}`} value={s.recording ?? "audio"} onChange={(e) => setService(s.id, { recording: e.target.value as "audio" | "video" })}>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                    </Select>
                  </Field>
                )}
                <Field label="Description" htmlFor={`sv-ds-${s.id}`} optional className="sm:col-span-2"><Input id={`sv-ds-${s.id}`} maxLength={1000} value={s.description} onChange={(e) => setService(s.id, { description: e.target.value })} /></Field>
                <Field label="Price" htmlFor={`sv-p-${s.id}`} optional><Input id={`sv-p-${s.id}`} maxLength={40} placeholder="e.g. $150" value={s.price} onChange={(e) => setService(s.id, { price: e.target.value })} /></Field>
                <Field label="Intake Form" htmlFor={`sv-i-${s.id}`} optional className="sm:col-span-3" hint={intakeForms.length ? "Sent automatically when someone books this service. They fill it in from their booking link, no sign-in needed." : "You don’t have any intake forms yet. Save your booking settings first, then create one."}>
                  {intakeForms.length || s.intakeFormId ? (
                    <Select id={`sv-i-${s.id}`} value={s.intakeFormId ?? ""} onChange={(e) => setService(s.id, { intakeFormId: e.target.value || undefined })}>
                      <option value="">No Form</option>
                      {intakeForms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                      {s.intakeFormId && !intakeForms.some((f) => f.id === s.intakeFormId) && <option value={s.intakeFormId}>(Deleted Form)</option>}
                    </Select>
                  ) : (
                    <a id={`sv-i-${s.id}`} href="/app/settings?section=intake" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink hover:bg-canvas-2"><Plus className="size-4" /> Create an Intake Form</a>
                  )}
                </Field>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Checkbox label={<span className="text-[13px]">Bookable</span>} checked={s.active} onChange={(e) => setService(s.id, { active: e.target.checked })} />
                <Button variant="ghost" size="sm" onClick={() => set({ services: p.services.filter((x) => x.id !== s.id) })}><Trash2 /> Remove</Button>
              </div>
            </fieldset>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Availability" description={`Weekly hours in your practice time zone (${(tz || "UTC").split(" ")[0]}). Existing sessions are always kept free.`} />
        <CardBody className="space-y-2">
          {DAYS.map((d) => {
            const r = p.rules.weekly[d.id][0];
            return (
              <div key={d.id} className="flex flex-wrap items-center gap-3">
                <span className="w-32"><Checkbox label={<span className="text-[13.5px]">{d.label}</span>} checked={!!r} onChange={(e) => setDay(d.id, e.target.checked)} /></span>
                {r ? (
                  <span className="flex items-center gap-2">
                    <Input aria-label={`${d.label} from`} type="time" value={r.start} onChange={(e) => setDay(d.id, true, { ...r, start: e.target.value })} className="w-32" />
                    <span className="text-muted">to</span>
                    <Input aria-label={`${d.label} until`} type="time" value={r.end} onChange={(e) => setDay(d.id, true, { ...r, end: e.target.value })} className="w-32" />
                  </span>
                ) : (
                  <span className="text-[13px] text-muted">Unavailable</span>
                )}
              </div>
            );
          })}
          <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <Field label="Gap Between Sessions" htmlFor="bk-buf">
              <Select id="bk-buf" value={p.rules.bufferMin} onChange={(e) => set({ rules: { ...p.rules, bufferMin: +e.target.value } })}>
                {[0, 10, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m ? `${m} minutes` : "None"}</option>)}
              </Select>
            </Field>
            <Field label="Minimum Notice" htmlFor="bk-not">
              <Select id="bk-not" value={p.rules.minNoticeHours} onChange={(e) => set({ rules: { ...p.rules, minNoticeHours: +e.target.value } })}>
                {[2, 4, 12, 24, 48, 72, 168].map((h) => <option key={h} value={h}>{h < 24 ? `${h} hours` : h === 168 ? "1 week" : `${h / 24} day${h === 24 ? "" : "s"}`}</option>)}
              </Select>
            </Field>
            <Field label="Book Up To" htmlFor="bk-adv">
              <Select id="bk-adv" value={p.rules.maxAdvanceDays} onChange={(e) => set({ rules: { ...p.rules, maxAdvanceDays: +e.target.value } })}>
                {[14, 30, 60, 90, 180].map((d) => <option key={d} value={d}>{d} days ahead</option>)}
              </Select>
            </Field>
            <Field label="Start Times Every" htmlFor="bk-step">
              <Select id="bk-step" value={p.rules.stepMin} onChange={(e) => set({ rules: { ...p.rules, stepMin: +e.target.value as 15 | 30 | 60 } })}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>Hour</option>
              </Select>
            </Field>
            <Field label="Online Changes" htmlFor="bk-chg" hint="Clients get a link to reschedule or cancel. After this, they contact you instead.">
              <Select id="bk-chg" value={p.rules.changeNoticeHours} onChange={(e) => set({ rules: { ...p.rules, changeNoticeHours: +e.target.value } })}>
                {[0, 2, 12, 24, 48, 72, 168].map((h) => <option key={h} value={h}>{h === 0 ? "Any time before the session" : `Up to ${h < 24 ? `${h} hours` : h === 168 ? "1 week" : `${h / 24} day${h === 24 ? "" : "s"}`} before`}</option>)}
              </Select>
            </Field>
          </div>
          <div className="pt-2">
            <Checkbox label={<span className="text-[13px]">Invite new clients to their client portal when they book</span>} checked={p.autoInvite} onChange={(e) => set({ autoInvite: e.target.checked })} />
          </div>
        </CardBody>
        <CardFooter className="flex items-center justify-between gap-3">
          {error ? <p role="alert" className="text-[13px] text-danger">{error}</p> : <span className="text-[12.5px] text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>}
          <Button onClick={() => void save()} disabled={busy || !dirty}>{busy && <Loader2 className="animate-spin" />} Save Booking Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}


/** Whether the typed address is free, checked shortly after typing stops. */
export function AddressStatus({ slug, saved }: { slug: string; saved?: string }) {
  const [state, setState] = React.useState<{ slug: string; available: boolean; reason?: string } | null>(null);
  React.useEffect(() => {
    if (DATA_MODE !== "server" || !slug || slug === saved) return setState(null);
    let live = true;
    const t = setTimeout(() => {
      api<{ available: boolean; reason?: string }>(`/api/v1/booking/address?slug=${encodeURIComponent(slug)}`)
        .then((r) => live && setState({ slug, ...r }))
        .catch(() => live && setState(null));
    }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [slug, saved]);
  if (!state || state.slug !== slug) return <p id="bk-slug-status" className="sr-only" aria-live="polite" />;
  return (
    <p id="bk-slug-status" aria-live="polite" className={`mt-1 inline-flex items-center gap-1 text-[12.5px] ${state.available ? "text-sage-dark" : "text-danger"}`}>
      {state.available ? <><Check className="size-3.5" /> Available</> : state.reason}
    </p>
  );
}
