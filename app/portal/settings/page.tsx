"use client";

import * as React from "react";
import { ShieldCheck, Laptop, Smartphone, Download, Trash2 } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SimulatedBadge } from "@/components/ui/misc";
import { usePortalClientId } from "@/components/portal/portal-shell";
import { DATA_MODE } from "@/lib/utils";
import { api } from "@/lib/api";

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [on, setOn] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div>
        <p className="text-[14px] text-ink">{label}</p>
        <p className="text-[12.5px] text-muted">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} aria-label={label} />
    </div>
  );
}

export default function PortalSettings() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const me = useStore((s) => s.people.find((p) => p.id === PORTAL_CLIENT_ID));
  const client = useStore((s) => s.clients.find((c) => c.id === PORTAL_CLIENT_ID));
  const pr = useStore((s) => s.practitioner);
  const toast = useStore((s) => s.toast);
  const [first, setFirst] = React.useState(me?.firstName ?? "");
  const [last, setLast] = React.useState(me?.lastName ?? "");
  const [email, setEmail] = React.useState(client?.email ?? "");
  const [twoFA, setTwoFA] = React.useState(false);
  React.useEffect(() => {
    if (me) { setFirst(me.firstName); setLast(me.lastName); }
    if (client) setEmail(client.email);
  }, [me, client]);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    useStore.setState((s) => ({
      people: s.people.map((p) => (p.id === PORTAL_CLIENT_ID ? { ...p, firstName: first, lastName: last } : p)),
      clients: s.clients.map((c) => (c.id === PORTAL_CLIENT_ID ? { ...c, email } : c)),
    }));
    toast("Profile saved", undefined, "success");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">Account</h1>
        <p className="mt-1.5 text-[15px] text-muted">Manage your details, notifications and privacy.</p>
      </div>

      <Card>
        <CardHeader title="Your details" description={`Shared with ${pr.name}.`} />
        <CardBody>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" htmlFor="pf"><Input id="pf" value={first} onChange={(e) => setFirst(e.target.value)} className="h-11 sm:h-9" /></Field>
              <Field label="Last name" htmlFor="pl"><Input id="pl" value={last} onChange={(e) => setLast(e.target.value)} className="h-11 sm:h-9" /></Field>
            </div>
            <Field label="Email" htmlFor="pe" hint={DATA_MODE === "demo" ? "Used to sign in and to receive notifications." : `Used to sign in. To change it, ask ${pr.firstName || "your astrologer"}.`}><Input id="pe" type="email" value={email} readOnly={DATA_MODE !== "demo"} onChange={(e) => setEmail(e.target.value)} className={DATA_MODE === "demo" ? "h-11 sm:h-9" : "h-11 bg-canvas-2 text-muted sm:h-9"} /></Field>
            <p className="text-[12.5px] text-muted">Birth details are managed by your astrologer. To correct them, send {pr.firstName} a message.</p>
            <div className="flex justify-end"><Button type="submit">Save changes</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Password" />
        <CardBody>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              if (DATA_MODE === "demo") { form.reset(); toast("Password updated", "Simulated — no real credentials are stored.", "success"); return; }
              const fd = new FormData(form);
              if (fd.get("np") !== fd.get("np2")) { toast("Passwords don’t match", "Type the new password the same way twice.", "error"); return; }
              try {
                await api("/api/auth/change-password", { body: { current: fd.get("cp"), next: fd.get("np") } });
                form.reset();
                toast("Password updated", "You’ve been signed out on your other devices.", "success");
              } catch (err) {
                toast("Password not changed", (err as Error).message, "error");
              }
            }}
            className="space-y-4"
          >
            <Field label="Current password" htmlFor="cp"><Input id="cp" name="cp" type="password" required className="h-11 sm:h-9" autoComplete="current-password" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" htmlFor="np" hint="At least 10 characters."><Input id="np" name="np" type="password" minLength={10} required className="h-11 sm:h-9" autoComplete="new-password" /></Field>
              <Field label="Confirm new password" htmlFor="np2"><Input id="np2" name="np2" type="password" minLength={10} required className="h-11 sm:h-9" autoComplete="new-password" /></Field>
            </div>
            <div className="flex justify-end"><Button type="submit" variant="secondary">Update password</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" description="How we let you know about new materials and sessions." />
        <CardBody className="divide-y divide-line py-1">
          <Toggle label="New reading shared" desc="Email me when a reading or recording is shared with me." defaultChecked />
          <Toggle label="Session reminders" desc="Email a reminder 24 hours and 1 hour before a consultation." defaultChecked />
          <Toggle label="Schedule changes" desc="Email me if a session is moved or cancelled." defaultChecked />
          <Toggle label="Text message reminders" desc="SMS reminder 1 hour before a session." />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Security" action={<SimulatedBadge />} />
        <CardBody className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-sage-dark" />
              <div>
                <p className="text-[14px] text-ink">Two-factor authentication</p>
                <p className="text-[12.5px] text-muted">Require a code from an authenticator app when signing in.</p>
              </div>
            </div>
            <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast(v ? "Two-factor authentication enabled" : "Two-factor authentication disabled", "Simulated in the prototype.", "success"); }} aria-label="Two-factor authentication" />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">Active sessions</p>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {[
                { icon: Laptop, name: "Safari on macOS", where: "Portland, OR · Current session", current: true },
                { icon: Smartphone, name: "iPhone app (web)", where: "Portland, OR · 2 days ago" },
              ].map((d) => (
                <li key={d.name} className="flex items-center gap-3 px-4 py-3">
                  <d.icon className="size-5 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-ink">{d.name}</p>
                    <p className="text-[12px] text-muted">{d.where}</p>
                  </div>
                  {d.current ? <Badge tone="sage">This device</Badge> : <Button variant="ghost" size="sm" onClick={() => toast("Signed out of device", undefined, "success")}>Sign out</Button>}
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Privacy" />
        <CardBody className="space-y-4 text-[13.5px] leading-relaxed text-ink-3">
          <p>
            <span className="font-medium text-ink">What {pr.firstName} can see:</span> your contact details, birth information, the readings shared with you and whether you&apos;ve opened them, and your consultation history.
          </p>
          <p>
            <span className="font-medium text-ink">What stays private to {pr.firstName}:</span> their working notes and chart observations. These are professional records and aren&apos;t shown in your portal.
          </p>
          <p>Your materials are never shared with other clients. You can request a copy of your data or ask for your account to be deleted at any time.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" onClick={() => toast("Data export requested", "We'll email a download link. (Simulated)", "success")}><Download /> Request my data</Button>
            <Button variant="ghost" className="text-danger hover:bg-danger-50" onClick={() => toast("Deletion request sent", `${pr.firstName} will confirm before anything is deleted. (Simulated)`)}><Trash2 /> Request account deletion</Button>
          </div>
        </CardBody>
      </Card>
      <p className="pb-4 text-center text-[12px] text-muted">Signed in as {personName(me)}</p>
    </div>
  );
}
