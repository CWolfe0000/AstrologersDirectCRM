"use client";

import * as React from "react";
import { ShieldCheck, Download, Trash2 } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PasswordCard, SessionsCard } from "@/components/settings/sections";
import { TwoFactorCard } from "@/components/settings/two-factor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SimulatedBadge } from "@/components/ui/misc";
import { usePortalClientId } from "@/components/portal/portal-shell";
import { joinNames, usePortalPractices } from "@/components/portal/portal-data";
import { DATA_MODE } from "@/lib/utils";
import { api } from "@/lib/api";

export default function PortalSettings() {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const me = useStore((s) => s.people.find((p) => p.id === PORTAL_CLIENT_ID));
  const client = useStore((s) => s.clients.find((c) => c.id === PORTAL_CLIENT_ID));
  const practices = usePortalPractices();
  const names = joinNames(practices.map((p) => p.name)) || "your astrologer";
  const firsts = joinNames(practices.map((p) => p.firstName)) || "your astrologer";
  const one = practices.length <= 1;
  const toast = useStore((s) => s.toast);
  const [first, setFirst] = React.useState(me?.firstName ?? "");
  const [last, setLast] = React.useState(me?.lastName ?? "");
  const [email, setEmail] = React.useState(client?.email ?? "");
  const [twoFA, setTwoFA] = React.useState(false);
  const preview = useStore((s) => !!s.session.preview);
  const [closing, setClosing] = React.useState(false);
  const [closingBusy, setClosingBusy] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleteRecords, setDeleteRecords] = React.useState(false);

  const downloadData = () => {
    const st = useStore.getState();
    const mine = <T extends { clientId?: string }>(xs: T[]) => xs.filter((x) => !x.clientId || x.clientId === PORTAL_CLIENT_ID);
    const data = {
      exportedAt: new Date().toISOString(),
      astrologers: practices.map(({ name, practice, email, website }) => ({ name, practice, email, website })),
      profile: { ...me, email: client?.email },
      readings: mine(st.readings).filter((r) => r.status === "delivered").map(({ fileKey, ...r }) => (void fileKey, r)),
      consultations: mine(st.consultations).map(({ id, type, start, durationMin, status, location, sharedSummary }) => ({ id, type, start, durationMin, status, location, sharedSummary })),
      files: mine(st.files).filter((f) => !f.private).map(({ fileKey, ...f }) => (void fileKey, f)),
      betweenSessions: mine(st.clientWork).map((w) => ({ ...w, responses: st.workResponses.filter((r) => r.workId === w.id) })),
      notifications: mine(st.portalNotifications),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-astrologersdirect-portal.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Download Ready", "A copy of everything in your portal. Readings and files themselves can be downloaded from each one, where your astrologer allows it.", "success");
  };

  const closeAccount = async () => {
    if (DATA_MODE === "demo") { setClosing(false); toast("Account Closed", "Simulated in the demo.", "success"); return; }
    setClosingBusy(true);
    try {
      await api("/api/v1/portal/account", { method: "DELETE", body: { confirm: "CLOSE", deleteRecords } });
      window.location.href = "/?closed=1";
    } catch (e) {
      toast("Couldn’t Close Your Account", (e as Error).message, "error");
      setClosingBusy(false);
    }
  };
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
    toast("Profile Saved", undefined, "success");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">Account</h1>
        <p className="mt-1.5 text-[15px] text-muted">Manage your details, notifications and privacy.</p>
      </div>

      <Card>
        <CardHeader title="Your Details" description={`Shared with ${names}.`} />
        <CardBody>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" htmlFor="pf"><Input id="pf" value={first} onChange={(e) => setFirst(e.target.value)} className="h-11 sm:h-9" /></Field>
              <Field label="Last Name" htmlFor="pl"><Input id="pl" value={last} onChange={(e) => setLast(e.target.value)} className="h-11 sm:h-9" /></Field>
            </div>
            <Field label="Email" htmlFor="pe" hint={DATA_MODE === "demo" ? "Used to sign in and to receive notifications." : `Used to sign in. To change it, ask ${one ? firsts : "one of your astrologers"}.`}><Input id="pe" type="email" value={email} readOnly={DATA_MODE !== "demo"} onChange={(e) => setEmail(e.target.value)} className={DATA_MODE === "demo" ? "h-11 sm:h-9" : "h-11 bg-canvas-2 text-muted sm:h-9"} /></Field>
            <p className="text-[12.5px] text-muted">Birth details are managed by your astrologer. To correct them, send {one ? firsts : "your astrologer"} a message.</p>
            <div className="flex justify-end"><Button type="submit">Save Changes</Button></div>
          </form>
        </CardBody>
      </Card>

      {(DATA_MODE === "demo" || !preview) && <PasswordCard />}

      <Card>
        <CardHeader title="Emails We Send You" />
        <CardBody className="space-y-2 text-[13.5px] leading-relaxed text-ink-3">
          <p>We email you when {one ? firsts : "an astrologer"} shares a reading, recording or something to work on between sessions, and for any session reminders or gentle reminders they’ve set up for you.</p>
          <p className="text-muted">These go to {client?.email || "your email address"}. They only ever come from your astrologer’s activity: there’s no newsletter or marketing.</p>
        </CardBody>
      </Card>

      {DATA_MODE === "demo" ? (
        <Card>
          <CardHeader title="Security" action={<SimulatedBadge />} />
          <CardBody>
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
          </CardBody>
        </Card>
      ) : (
        !preview && (
          <>
            <TwoFactorCard hint="Optional: an extra step that keeps your readings private even if someone gets into your email." />
            <SessionsCard />
          </>
        )
      )}

      <Card>
        <CardHeader title="Privacy" />
        <CardBody className="space-y-4 text-[13.5px] leading-relaxed text-ink-3">
          <p>
            <span className="font-medium text-ink">What {one ? firsts : "each astrologer"} can see:</span> your contact details, birth information, the readings {one ? "" : "they’ve "}shared with you and whether you&apos;ve opened them, your consultation history{one ? "" : " with them"}, and what you write in Between Sessions{one ? "" : " for them"}.{!one && " Your astrologers can’t see each other’s records."}
          </p>
          <p>
            <span className="font-medium text-ink">What stays private to {one ? firsts : "each astrologer"}:</span> their working notes and chart observations. These are professional records and aren&apos;t shown in your portal.
          </p>
          <p>Your materials are never shared with other clients. You can download a copy of everything in your portal, or close your account, at any time.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" onClick={downloadData}><Download /> Download My Data</Button>
            {!preview && <Button variant="ghost" className="text-danger hover:bg-danger-50" onClick={() => setClosing(true)}><Trash2 /> Close My Portal Account</Button>}
          </div>
          <Dialog open={closing} onOpenChange={setClosing}>
            {closing && (
              <DialogContent
                size="sm"
                title="Close Your Portal Account?"
                description={`You’ll be signed out and your portal login deleted. ${one ? firsts : "Each of your astrologers"} will be told by email.`}
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setClosing(false)}>Cancel</Button>
                    <Button variant="danger" disabled={confirmText !== "CLOSE" || closingBusy} onClick={closeAccount}>Close My Account</Button>
                  </>
                }
              >
                <div className="space-y-4 text-[13.5px] text-ink-3">
                  <p>{one ? firsts : "Your astrologers"} keep{one ? "s" : ""} their professional records (your details, sessions and notes). If you’d like those deleted too, tick the box and we’ll pass that on.</p>
                  <Checkbox label={`Ask ${one ? firsts : "them"} to delete my records too`} checked={deleteRecords} onChange={(e) => setDeleteRecords(e.target.checked)} />
                  <Field label="Type CLOSE to Confirm" htmlFor="close-confirm">
                    <Input id="close-confirm" autoComplete="off" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} />
                  </Field>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </CardBody>
      </Card>
      <p className="pb-4 text-center text-[12px] text-muted">Signed in as {personName(me)}</p>
    </div>
  );
}
