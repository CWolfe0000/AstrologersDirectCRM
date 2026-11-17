"use client";

import * as React from "react";
import { CalendarDays, Loader2, Video } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn, DATA_MODE } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Session = { id: string; type: string; location: string; meetingUrl?: string };

/** "Join video call" (when the astrologer added a link) and "Request to reschedule". */
export function SessionActions({ k, today, who, className }: { k: Session; today: boolean; who: string; className?: string }) {
  const toast = useStore((s) => s.toast);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const preview = useStore((s) => s.session.preview);

  const send = async () => {
    if (DATA_MODE === "demo" || preview) {
      setOpen(false);
      toast("Request Sent", `${who} will be in touch to find a new time. (${preview ? "Preview: nothing was sent" : "Simulated in the demo"})`, "success");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/portal/consultations/${encodeURIComponent(k.id)}/reschedule`, { body: { message } });
      setOpen(false);
      setMessage("");
      toast("Request Sent", `${who} will reply by email to find a new time.`, "success");
    } catch (e) {
      toast("Couldn’t Send Your Request", (e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const join = k.location === "Video call" && k.meetingUrl;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {join && (
        <a
          href={k.meetingUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-medium",
            today ? "bg-accent text-white hover:bg-accent-hover" : "border border-line text-ink hover:bg-canvas-2",
          )}
        >
          <Video className="size-4" /> Join video call
        </a>
      )}
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-[13.5px] font-medium text-ink hover:bg-canvas-2">
        Request to reschedule
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <DialogContent
            size="sm"
            title="Request a New Time"
            description={`${who} will get your message by email and reply to arrange another time. Your session stays booked until they change it.`}
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={send} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Send Request</Button>
              </>
            }
          >
            <label htmlFor="resched-msg" className="mb-1.5 block text-[13px] font-medium text-ink">Message (optional)</label>
            <Textarea id="resched-msg" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Could we move to the following week? Weekday mornings work best for me." />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

/** A one-event .ics file in the astrologer's time zone (sessions are stored in their local time). */
export function sessionIcs(k: Session & { start: string; durationMin: number }, who: string, zone?: string) {
  const stamp = (d: string) => d.replace(/[-:]/g, "").slice(0, 15);
  const [date, time = "00:00:00"] = k.start.split("T");
  const startMs = Date.parse(`${date}T${time.slice(0, 8)}Z`) + k.durationMin * 60_000;
  const end = new Date(startMs).toISOString().slice(0, 19);
  const tzid = zone?.split(" ")[0];
  const tz = tzid ? `;TZID=${tzid}` : "";
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AstrologersDirect//Client portal//EN",
    "BEGIN:VEVENT",
    `UID:${k.id.replace(/[^\w~-]/g, "")}@astrologersdirect.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART${tz}:${stamp(`${date}T${time}`)}`,
    `DTEND${tz}:${stamp(end)}`,
    `SUMMARY:${esc(`${k.type} with ${who}`)}`,
    `LOCATION:${esc(k.meetingUrl ?? k.location)}`,
    ...(k.meetingUrl ? [`URL:${k.meetingUrl}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function AddToCalendar({ k, who, zone, className }: { k: Session & { start: string; durationMin: number }; who: string; zone?: string; className?: string }) {
  return (
    <Button
      variant="secondary"
      className={className}
      onClick={() => {
        const blob = new Blob([sessionIcs(k, who, zone)], { type: "text/calendar" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${k.type.replace(/[^\w ]+/g, "").trim() || "session"}.ics`;
        a.click();
        URL.revokeObjectURL(a.href);
      }}
    >
      <CalendarDays /> Add to Calendar
    </Button>
  );
}
