"use client";

import * as React from "react";
import { CalendarDays, Copy, Link2, RefreshCw, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

/** Reminder emails to clients before consultations (stored in practice settings; sent by the scheduled job). */
export function RemindersCard() {
  const practitioner = useStore((s) => s.practitioner);
  const update = useStore((s) => s.updatePractitioner);
  const toast = useStore((s) => s.toast);
  const r = practitioner.reminders ?? { clients: false, hoursBefore: 24 };
  const set = (patch: Partial<typeof r>, msg: string) => {
    update({ reminders: { ...r, ...patch } });
    toast(msg, undefined, "success");
  };
  return (
    <Card>
      <CardHeader title="Consultation Reminders" description="An email to the client before each scheduled consultation." action={r.clients ? <Badge tone="sage">On</Badge> : <Badge tone="neutral">Off</Badge>} />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-medium">Email Clients a Reminder</p>
            <p className="text-[12.5px] text-muted">Includes the date, time in your time zone, length and how you’re meeting. Never includes notes or chart details.</p>
          </div>
          <Switch checked={r.clients} onCheckedChange={(v) => set({ clients: v }, v ? "Client reminders on" : "Client reminders off")} aria-label="Email Clients a Reminder" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13.5px]">Send it</p>
          <Select value={String(r.hoursBefore)} onChange={(e) => set({ hoursBefore: Number(e.target.value) }, "Reminder timing updated")} className="w-48" aria-label="When to Send Reminders">
            <option value="3">3 Hours Before</option>
            <option value="24">24 Hours Before</option>
            <option value="48">48 Hours Before</option>
          </Select>
        </div>
        <p className="text-[12px] text-muted">Clients with an active portal also see the reminder there. Reminders are sent by an hourly scheduled job once the app is deployed.</p>
      </CardBody>
    </Card>
  );
}

/** Private calendar subscription link for Google / Apple / Outlook calendars. */
export function CalendarFeedCard() {
  const toast = useStore((s) => s.toast);
  const [active, setActive] = React.useState<boolean | null>(null);
  const [link, setLink] = React.useState<{ url: string; webcal: string } | null>(null);
  React.useEffect(() => {
    api<{ active: boolean }>("/api/v1/calendar-feed").then((r) => setActive(r.active), () => setActive(false));
  }, []);
  const create = async () => {
    try {
      const r = await api<{ url: string; webcal: string }>("/api/v1/calendar-feed", { body: {} });
      setLink(r);
      setActive(true);
    } catch (e) {
      toast("Couldn’t Create the Link", (e as Error).message, "error");
    }
  };
  const remove = async () => {
    await api("/api/v1/calendar-feed", { method: "DELETE" }).catch(() => {});
    setLink(null);
    setActive(false);
    toast("Calendar Link Turned Off", "Calendars subscribed to it will stop updating.", "success");
  };
  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => toast("Link Copied"), () => toast("Couldn’t Copy", "Select the link and copy it.", "error"));
  return (
    <Card>
      <CardHeader title="Calendar Subscription" description="See your consultations in Google Calendar, Apple Calendar or Outlook." icon={<CalendarDays />} />
      <CardBody className="space-y-3">
        {link ? (
          <>
            <p className="text-[12.5px] text-muted">Copy this private link into your calendar app (“Subscribe to calendar” / “From URL”). It’s shown only now — anyone with it can see your schedule, so keep it to yourself.</p>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas p-2">
              <code className="min-w-0 flex-1 truncate text-[12px]">{link.url}</code>
              <Button size="xs" variant="secondary" onClick={() => copy(link.url)}><Copy /> Copy</Button>
            </div>
            <a href={link.webcal} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"><Link2 className="size-3.5" /> Open in my calendar app</a>
          </>
        ) : (
          <p className="text-[12.5px] text-muted">
            {active ? "A calendar link is active. For security it can’t be shown again — create a new one to get a fresh link (the old one stops working)." : "Your calendar will show each consultation with the client’s first name and last initial, the session type and how you’re meeting. Notes and birth details are never included."}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={create}>{active ? <><RefreshCw /> Create a new link</> : <><Link2 /> Create calendar link</>}</Button>
          {active && <Button size="sm" variant="ghost" onClick={remove}><Trash2 /> Turn Off</Button>}
        </div>
      </CardBody>
    </Card>
  );
}

/** News and offers from AstrologersDirect: agreed to at sign-up, switch off any time. */
export function NewsEmailsCard() {
  const toast = useStore((s) => s.toast);
  const [d, setD] = React.useState<{ on: boolean; consentAt: string | null } | null>(null);
  React.useEffect(() => { api<{ on: boolean; consentAt: string | null }>("/api/v1/account/email").then(setD, () => {}); }, []);
  if (!d) return null;
  const set = async (on: boolean) => {
    try {
      setD(await api<{ on: boolean; consentAt: string | null }>("/api/v1/account/email", { method: "PUT", body: { on } }));
      toast(on ? "Subscribed" : "Unsubscribed", on ? "You’ll hear about new features, tips and offers." : "You won’t get news, tips or offers. Account emails still arrive.", "success");
    } catch (e) {
      toast("Couldn’t Update", (e as Error).message, "error");
    }
  };
  return (
    <Card>
      <CardHeader title="Emails From AstrologersDirect" description="Optional news, tips and offers. Emails about your account and the service, like sign-in links, always arrive." />
      <CardBody>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-medium">News, Tips and Offers</p>
            <p className="text-[12.5px] text-muted">{d.on && d.consentAt ? `On since ${new Date(d.consentAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Every one has an unsubscribe link.` : "Off. Turn on to hear about new features, tips and offers."}</p>
          </div>
          <Switch checked={d.on} onCheckedChange={(v) => void set(v)} aria-label="News, Tips and Offers" />
        </div>
      </CardBody>
    </Card>
  );
}
