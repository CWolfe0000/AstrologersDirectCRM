"use client";

import * as React from "react";
import { Copy, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

/** Real two-factor setup (server mode): QR code → confirm code → recovery codes; turning off needs password + code. */
export function TwoFactorCard({ hint = "Recommended for practices holding client birth data." }: { hint?: string } = {}) {
  const toast = useStore((s) => s.toast);
  const user = useStore((s) => s.session.user);
  const [enabled, setEnabled] = React.useState(!!user?.twoFactor);
  const [setup, setSetup] = React.useState<{ secret: string; qr: string } | null>(null);
  const [codes, setCodes] = React.useState<string[] | null>(null);
  const [off, setOff] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      setSetup(await api<{ secret: string; qr: string }>("/api/auth/2fa/setup", { body: {} }));
    } catch (e) {
      toast("Couldn’t Start Setup", (e as Error).message, "error");
    }
  };
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ recoveryCodes: string[] }>("/api/auth/2fa/enable", { body: { code } });
      setCodes(r.recoveryCodes);
      setEnabled(true);
      setCode("");
      useStore.setState((s) => (s.session.user ? { session: { ...s.session, user: { ...s.session.user, twoFactor: true } } } : {}));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/2fa/disable", { body: { password, code } });
      setEnabled(false);
      setOff(false);
      setPassword("");
      setCode("");
      useStore.setState((s) => (s.session.user ? { session: { ...s.session, user: { ...s.session.user, twoFactor: false } } } : {}));
      toast("Two-Factor Authentication Turned Off", undefined, "success");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Two-Factor Authentication" description="Ask for a code from an authenticator app when signing in." action={enabled ? <Badge tone="sage">On</Badge> : <Badge tone="neutral">Off</Badge>} />
      <CardBody className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className={cn("size-8", enabled ? "text-sage-dark" : "text-muted")} />
          <p className="text-[12.5px] text-muted">
            {enabled ? "You’ll be asked for a code each time you sign in." : `${hint} Works with 1Password, Google Authenticator, Authy and similar apps.`}
          </p>
        </div>
        {enabled ? (
          <Button variant="secondary" size="sm" onClick={() => { setError(null); setOff(true); }}>Turn Off</Button>
        ) : (
          <Button size="sm" onClick={start}>Set Up</Button>
        )}
      </CardBody>

      <Dialog open={!!setup && !codes} onOpenChange={(o) => { if (!o) { setSetup(null); setCode(""); setError(null); } }}>
        {setup && (
          <DialogContent
            title="Set Up Two-Factor Authentication"
            description="Scan the QR code with your authenticator app, then enter the 6-digit code it shows."
            size="sm"
            footer={
              <>
                <Button variant="secondary" onClick={() => setSetup(null)}>Cancel</Button>
                <Button onClick={confirm} disabled={busy || code.replace(/\s/g, "").length !== 6}>Turn On</Button>
              </>
            }
          >
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="QR code for your authenticator app" width={200} height={200} className="rounded-lg border border-line" />
              <p className="text-center text-[12px] text-muted">
                Can’t scan? Enter this key: <span className="break-all font-mono text-[12px] text-ink">{setup.secret}</span>
              </p>
            </div>
            <Field label="Code from the App" htmlFor="tfa" className="mt-4">
              <Input id="tfa" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123 456" />
            </Field>
            {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!codes} onOpenChange={(o) => { if (!o) { setCodes(null); setSetup(null); toast("Two-Factor Authentication Is On", undefined, "success"); } }}>
        {codes && (
          <DialogContent
            title="Save Your Recovery Codes"
            description="If you lose your phone, each code lets you sign in once. Store them somewhere safe — they won’t be shown again."
            size="sm"
            footer={<Button onClick={() => { setCodes(null); setSetup(null); toast("Two-Factor Authentication Is On", undefined, "success"); }}>I’ve Saved Them</Button>}
          >
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas p-4 font-mono text-[14px]">
              {codes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => navigator.clipboard?.writeText(codes.join("\n")).then(() => toast("Copied"), () => toast("Couldn’t Copy", "Select the codes and copy them manually.", "error"))}
            >
              <Copy /> Copy Codes
            </Button>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={off} onOpenChange={setOff}>
        <DialogContent
          title="Turn Off Two-Factor Authentication?"
          description={user?.hasPassword === false ? "Enter a current code (or a recovery code)." : "Enter your password and a current code (or a recovery code)."}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOff(false)}>Cancel</Button>
              <Button variant="danger" onClick={disable} disabled={busy || (user?.hasPassword !== false && !password) || !code}>Turn Off</Button>
            </>
          }
        >
          <div className="space-y-3">
            {user?.hasPassword !== false && <Field label="Password" htmlFor="tfa-pw"><Input id="tfa-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>}
            <Field label="Code" htmlFor="tfa-code"><Input id="tfa-code" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
            {error && <p className="text-[13px] text-danger">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
