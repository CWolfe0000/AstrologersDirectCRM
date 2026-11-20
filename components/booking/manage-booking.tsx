"use client";

import * as React from "react";
import { CalendarClock, Check, Loader2, Video, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { BookingShell, TimePicker, browserZone, longWhen } from "./shared";
import { IntakeFill } from "@/components/intake/intake-fill";
import type { IntakeSection } from "@/lib/data/types";
import type { BirthData } from "@/lib/astro/types";

type View = {
  service: string;
  durationMin: number;
  format: string;
  start: string;
  status: "scheduled" | "canceled" | "past" | "closed";
  displayName: string;
  clientName: string;
  meetingUrl: string | null;
  canChange: boolean;
  canReschedule: boolean;
  deadline: string;
  noticeHours: number;
  intake: { title: string; status: "sent" | "submitted" } | null;
};

/** The client's private page for a booked session: see it, reschedule or cancel. */
export function ManageBooking({ token }: { token: string }) {
  const [v, setV] = React.useState<View | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tz, setTz] = React.useState("UTC");
  const [mode, setMode] = React.useState<"view" | "reschedule" | "cancel">("view");
  const [slots, setSlots] = React.useState<string[] | null>(null);
  const [pick, setPick] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);
  const base = `/api/public/booking/${encodeURIComponent(token)}`;

  React.useEffect(() => {
    setTz(browserZone());
    api<View>(base).then(setV, (e: Error) => setError(e.message));
  }, [base]);

  const startReschedule = () => {
    setMode("reschedule");
    setSlots(null);
    setPick(null);
    setError(null);
    api<{ slots: string[] }>(`${base}/slots`).then((r) => setSlots(r.slots), (e: Error) => setError(e.message));
  };
  const act = async (path: "reschedule" | "cancel", body: Record<string, string>, message: string) => {
    setBusy(true);
    setError(null);
    try {
      setV(await api<View>(`${base}/${path}`, { body }));
      setMode("view");
      setDone(message);
    } catch (e) {
      setError((e as Error).message);
      if (path === "reschedule") startReschedule();
    } finally {
      setBusy(false);
    }
  };

  if (!v)
    return (
      <BookingShell>
        {error ? (
          <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
            <p className="font-serif text-[26px] text-ink">This Booking Link Isn’t Valid</p>
            <p className="mt-2 text-[14px] text-muted">{/isn’t valid/.test(error) ? "Check you used the full link from your confirmation email, or contact your astrologer." : error}</p>
          </div>
        ) : (
          <div className="h-48 animate-pulse rounded-2xl bg-canvas-2" />
        )}
      </BookingShell>
    );

  const first = v.clientName.split(" ")[0];
  const deadline = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(v.deadline));
  return (
    <BookingShell>
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-[30px] leading-tight text-ink">Your Booking</h1>
        <p className="mt-1 text-[14px] text-muted">Hi {first}. Here’s your session with {v.displayName}.</p>
        {done && (
          <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-[13.5px] text-sage-dark"><Check className="size-4" /> {done}</p>
        )}
        <div className={`mt-5 rounded-2xl border bg-surface p-5 ${v.status === "canceled" ? "border-line opacity-80" : "border-accent-100"}`}>
          <p className="text-[16px] font-semibold text-ink">{v.service}</p>
          <p className={`mt-1 text-[15px] ${v.status === "canceled" ? "text-muted line-through" : "text-ink"}`}>{longWhen(v.start, tz)}</p>
          <p className="mt-0.5 text-[13px] text-muted">{v.durationMin} minutes · {v.format}</p>
          {v.status === "canceled" && <p className="mt-3 text-[13.5px] font-medium text-ink">This session is canceled.</p>}
          {v.status === "past" && <p className="mt-3 text-[13.5px] text-muted">This session has taken place.</p>}
          {v.status === "scheduled" && v.meetingUrl && (
            <a href={v.meetingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-medium text-white hover:bg-accent-hover"><Video className="size-4" /> Join Video Call</a>
          )}
        </div>

        {v.status === "scheduled" && mode === "view" && (
          v.canChange ? (
            <div className="mt-5">
              <div className="flex flex-wrap gap-2">
                {v.canReschedule && <Button variant="secondary" onClick={startReschedule}><CalendarClock /> Reschedule</Button>}
                <Button variant="ghost" className="text-danger hover:bg-danger-50" onClick={() => { setMode("cancel"); setError(null); }}><XCircle /> Cancel Session</Button>
              </div>
              <p className="mt-2 text-[12.5px] text-muted">You can make changes here until {deadline}.{!v.canReschedule && ` To move it, please contact ${v.displayName}.`}</p>
            </div>
          ) : (
            <p className="mt-5 text-[13.5px] text-muted">Changes can be made online up to {v.noticeHours} hours before the session. To change it now, please reply to your confirmation email to contact {v.displayName}.</p>
          )
        )}

        {mode === "reschedule" && (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <p className="text-[15px] font-semibold text-ink">Choose a New Time</p>
            {pick ? (
              <div className="mt-4">
                <p className="text-[14px] text-ink">Move to <span className="font-medium">{longWhen(pick, tz)}</span>?</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => act("reschedule", { start: pick, tz }, "Your session has been moved. We’ve emailed you the new time.")} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Confirm New Time</Button>
                  <Button variant="ghost" onClick={() => setPick(null)}>Choose Another</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <TimePicker slots={slots} tz={tz} onTz={setTz} onPick={setPick} empty={<p className="text-[13.5px] text-muted">No other open times right now. Please contact {v.displayName}.</p>} />
              </div>
            )}
            <button type="button" className="mt-4 text-[13px] text-muted underline" onClick={() => setMode("view")}>Keep my current time</button>
          </div>
        )}

        {mode === "cancel" && (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <p className="text-[15px] font-semibold text-ink">Cancel This Session?</p>
            <label htmlFor="mb-reason" className="mt-3 block text-[13px] text-ink-3">Anything you’d like {v.displayName} to know? (optional)</label>
            <Textarea id="mb-reason" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="danger" onClick={() => act("cancel", { reason }, "Your session is canceled. We’ve let " + v.displayName + " know.")} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Cancel Session</Button>
              <Button variant="ghost" onClick={() => setMode("view")}>Keep My Session</Button>
            </div>
          </div>
        )}

        {error && v && <p role="alert" className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}

        {v.intake && v.status !== "canceled" && <BookingIntake token={token} intake={v.intake} displayName={v.displayName} />}
      </div>
    </BookingShell>
  );
}

/** The intake form that came with this booking (filled in from the booking link, no sign-in). */
function BookingIntake({ token, intake, displayName }: { token: string; intake: NonNullable<View["intake"]>; displayName: string }) {
  const [form, setForm] = React.useState<{ title: string; intro: string | null; sections: IntakeSection[]; birth: Partial<BirthData> | null } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const base = `/api/public/booking/${encodeURIComponent(token)}/intake`;
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#intake" && intake.status === "sent") setOpen(true);
  }, [intake.status]);
  React.useEffect(() => {
    if (!open || form) return;
    api<NonNullable<typeof form>>(base).then(setForm, (e: Error) => setError(e.message));
  }, [open, form, base]);
  return (
    <section id="intake" className="mt-8 scroll-mt-6">
      {intake.status === "submitted" ? (
        <p className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-[13.5px] text-sage-dark"><Check className="size-4" /> Thank you: {displayName} has your answers to “{intake.title}”.</p>
      ) : !open ? (
        <div className="rounded-2xl border border-accent-100 bg-accent-50/60 p-5">
          <p className="text-[15px] font-semibold text-ink">Before Your Session</p>
          <p className="mt-1 text-[13.5px] text-ink-3">{displayName} asked you to fill in “{intake.title}”. It takes a few minutes.</p>
          <Button className="mt-3" onClick={() => setOpen(true)}>Fill In the Form</Button>
        </div>
      ) : error ? (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>
      ) : !form ? (
        <div className="h-48 animate-pulse rounded-2xl bg-canvas-2" />
      ) : (
        <IntakeFill title={form.title} intro={form.intro} sections={form.sections} knownBirth={form.birth} placesEndpoint="/api/public/places" onSubmit={async (answers) => { await api(base, { body: { answers } }); }} />
      )}
    </section>
  );
}
