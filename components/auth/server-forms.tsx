"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Loader2, Lock, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { AuthHeading } from "@/components/marketing/auth-ui";
import { api, ApiError } from "@/lib/api";

const MIN_PW = 10;

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#F0D3D1] bg-danger-50 px-3 py-2.5 text-[13px] text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function useSubmit() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, run, setError };
}

/** Only same-origin paths are allowed after sign-in (blocks //evil.com, /\\evil.com, etc.). */
function safeNext(next: string | null, fallback: string) {
  if (!next || !next.startsWith("/") || /[\\\s\u0000-\u001f]/.test(next)) return fallback;
  try {
    const u = new URL(next, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}

/** Two-factor step shared by every sign-in route. */
function TwoFactorStep({ ticket, next, onCancel }: { ticket: string; next: string | null; onCancel: () => void }) {
  const router = useRouter();
  const { loading, error, run } = useSubmit();
  const [code, setCode] = React.useState("");
  return (
    <>
      <AuthHeading title="Enter your code" body="Open your authenticator app and enter the 6-digit code for AstrologersDirect. Lost your phone? Use one of your recovery codes." />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await api<{ redirect: string }>("/api/auth/login/2fa", { body: { ticket, code } });
            router.replace(safeNext(next, r.redirect));
            router.refresh();
          });
        }}
      >
        <ErrorNote message={error} />
        <Field label="Code" htmlFor="code">
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="123 456" required />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Verify and sign in</Button>
      </form>
      <button className="mt-6 text-[13.5px] text-muted hover:text-ink" onClick={onCancel}>Use a different account</button>
    </>
  );
}

type SignInResult = { redirect?: string; twoFactor?: boolean; ticket?: string };

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const reset = params.get("reset");
  const { loading, error, run, setError } = useSubmit();
  const [mode, setMode] = React.useState<"email" | "sent" | "password">(reset || params.get("method") === "password" ? "password" : "email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [ticket, setTicket] = React.useState<string | null>(null);
  const [resent, setResent] = React.useState(false);

  const done = (r: SignInResult) => {
    if (r.twoFactor && r.ticket) return setTicket(r.ticket);
    router.replace(safeNext(next, r.redirect ?? "/app"));
    router.refresh();
  };
  const sendLink = () => api("/api/auth/email-link", { body: { email } });

  if (ticket) return <TwoFactorStep ticket={ticket} next={next} onCancel={() => { setTicket(null); setMode("email"); setCode(""); }} />;

  if (mode === "sent")
    return (
      <>
        <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent"><MailCheck className="size-6" /></span>
        <AuthHeading title="Check your email" body={<>If there’s an account for <span className="font-medium text-ink">{email}</span>, we’ve sent a sign-in link and a 6-digit code. Click the link, or enter the code here.</>} />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => done(await api<SignInResult>("/api/auth/email-code", { body: { email, code } })));
          }}
        >
          <ErrorNote message={error} />
          <Field label="Code from the email" htmlFor="ecode">
            <Input id="ecode" inputMode="numeric" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="123 456" required />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Sign in</Button>
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[13.5px]">
          <button
            className="text-accent hover:underline disabled:text-muted disabled:no-underline"
            disabled={resent}
            onClick={() => run(async () => { await sendLink(); setResent(true); })}
          >
            {resent ? "New email sent" : "Send a new email"}
          </button>
          <button className="text-muted hover:text-ink" onClick={() => { setMode("email"); setCode(""); setError(null); }}>Use a different email</button>
        </div>
        <p className="mt-6 text-[12.5px] text-muted">The link and code expire in 15 minutes. Nothing arrived? Check your spam folder.</p>
      </>
    );

  if (mode === "password")
    return (
      <>
        <AuthHeading title="Sign in with your password" body={reset ? "Your password was changed. Sign in with your new password." : "Your clients, charts, observations and the work between sessions, together in one place."} />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => done(await api<SignInResult>("/api/auth/login", { body: { email, password } })));
          }}
        >
          <ErrorNote message={error} />
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          <Field
            label={
              <span className="flex items-center justify-between">
                Password
                <Link href="/auth/reset" className="text-[12.5px] font-normal text-accent hover:underline">Forgot password?</Link>
              </span>
            }
            htmlFor="password"
          >
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />} Sign in
          </Button>
        </form>
        <button className="mt-5 text-[13.5px] text-accent hover:underline" onClick={() => { setMode("email"); setError(null); }}>Email me a sign-in link instead</button>
      </>
    );

  return (
    <>
      <AuthHeading title="Welcome back to your practice." body="Enter your email and we’ll send you a sign-in link. No password needed." />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await sendLink();
            setMode("sent");
          });
        }}
      >
        <ErrorNote message={error} />
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus required />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Send />} Email me a sign-in link
        </Button>
      </form>
      <button className="mt-5 text-[13.5px] text-muted hover:text-ink" onClick={() => { setMode("password"); setError(null); }}>Sign in with a password instead</button>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        New to AstrologersDirect? <Link href="/auth/signup" className="font-medium text-accent hover:underline">Create an account</Link>
      </p>
      <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-[13px] text-muted">
        <span className="font-medium text-ink">Are you a client?</span> Enter the email your astrologer invited, and we’ll send you a link to your portal.
      </p>
    </>
  );
}

/** Landing page for an emailed sign-in link. Signs in on a click, so email scanners that open links can't use it up. */
function LinkSignIn() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { loading, error, run } = useSubmit();
  const [ticket, setTicket] = React.useState<string | null>(null);
  if (ticket) return <TwoFactorStep ticket={ticket} next={null} onCancel={() => router.replace("/auth/login")} />;
  return (
    <>
      <AuthHeading title="Sign in to AstrologersDirect" body="Continue to your practice or client portal." />
      <ErrorNote message={error} />
      <Button
        size="lg"
        className="mt-4 w-full"
        disabled={loading || !token}
        onClick={() =>
          run(async () => {
            const r = await api<SignInResult>("/api/auth/email-link/verify", { body: { token } });
            if (r.twoFactor && r.ticket) return setTicket(r.ticket);
            router.replace(r.redirect ?? "/app");
            router.refresh();
          })
        }
      >
        {loading && <Loader2 className="animate-spin" />} Sign in
      </Button>
      {error && (
        <Link href="/auth/login" className="mt-5 inline-block text-[13.5px] text-accent hover:underline">
          Get a new sign-in link
        </Link>
      )}
    </>
  );
}

function Signup() {
  const router = useRouter();
  const { loading, error, run } = useSubmit();
  const [f, setF] = React.useState({ first: "", last: "", email: "", practice: "", password: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <>
      <AuthHeading title="Build stronger client relationships." body="Create your practice and join the early practitioner community shaping AstrologersDirect. It takes a few minutes." />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const name = `${f.first.trim()} ${f.last.trim()}`.trim();
            await api("/api/auth/signup", { body: { name, practice: f.practice.trim() || `${name}'s practice`, email: f.email, password: f.password || undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } });
            router.replace(`/auth/verify?sent=1&email=${encodeURIComponent(f.email)}`);
          });
        }}
      >
        <ErrorNote message={error} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="fn"><Input id="fn" required autoComplete="given-name" value={f.first} onChange={set("first")} /></Field>
          <Field label="Last name" htmlFor="ln"><Input id="ln" autoComplete="family-name" value={f.last} onChange={set("last")} /></Field>
        </div>
        <Field label="Email" htmlFor="em"><Input id="em" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /></Field>
        <Field label="Practice name" htmlFor="pn" optional><Input id="pn" placeholder="e.g. Morrow Astrological Consulting" value={f.practice} onChange={set("practice")} /></Field>
        <Field label="Password" htmlFor="pw" optional hint={`Leave blank to sign in with emailed links instead. Otherwise at least ${MIN_PW} characters.`}>
          <Input id="pw" type="password" minLength={MIN_PW} autoComplete="new-password" value={f.password} onChange={set("password")} />
        </Field>
        <Checkbox required label={<span className="text-[13px] text-muted">I agree to the <Link href="/legal/terms" className="text-accent underline">Terms</Link> and <Link href="/legal/privacy" className="text-accent underline">Privacy Policy</Link>.</span>} />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        Already have an account? <Link href="/auth/login" className="font-medium text-accent hover:underline">Sign in</Link>
      </p>
    </>
  );
}

function Verify() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const [state, setState] = React.useState<"idle" | "checking" | "ok" | "error">(token ? "checking" : "idle");
  const [message, setMessage] = React.useState("");
  const [resent, setResent] = React.useState(false);
  React.useEffect(() => {
    if (!token) return;
    api("/api/auth/verify", { body: { token } })
      .then(() => setState("ok"))
      .catch((e: ApiError) => {
        setState("error");
        setMessage(e.message);
      });
  }, [token]);

  if (state === "checking") return <AuthHeading title="Confirming your email…" />;
  if (state === "ok")
    return (
      <>
        <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><CheckCircle2 className="size-6" /></span>
        <AuthHeading title="Email confirmed" body="Thanks — your email address is verified." />
        <Link href="/app" className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-[15px] font-medium text-white hover:bg-accent-hover">Open my workspace</Link>
      </>
    );
  return (
    <>
      <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent"><MailCheck className="size-6" /></span>
      <AuthHeading
        title={state === "error" ? "That link didn’t work" : "Check your email"}
        body={state === "error" ? message : <>We sent a confirmation link to <span className="font-medium text-ink">{email ?? "your email address"}</span>. You can start using your workspace now; confirm when it suits you.</>}
      />
      <Link href="/app" className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-[15px] font-medium text-white hover:bg-accent-hover">Continue to my workspace</Link>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        {resent ? (
          "A new link is on its way."
        ) : (
          <button className="font-medium text-accent hover:underline" onClick={() => api("/api/auth/resend-verification", { body: {} }).then(() => setResent(true)).catch(() => setResent(true))}>
            Send the link again
          </button>
        )}
      </p>
    </>
  );
}

function Reset() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const { loading, error, run, setError } = useSubmit();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [pw, setPw] = React.useState({ a: "", b: "" });

  if (token)
    return (
      <>
        <AuthHeading title="Choose a new password" body={`Use at least ${MIN_PW} characters. You’ll be signed out of your other devices.`} />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (pw.a !== pw.b) return setError("The two passwords don’t match.");
            run(async () => {
              const r = await api<{ redirect: string }>("/api/auth/reset", { body: { token, password: pw.a } });
              router.replace(r.redirect);
            });
          }}
        >
          <ErrorNote message={error} />
          <Field label="New password" htmlFor="np"><Input id="np" type="password" required minLength={MIN_PW} autoComplete="new-password" value={pw.a} onChange={(e) => setPw((x) => ({ ...x, a: e.target.value }))} /></Field>
          <Field label="Confirm new password" htmlFor="cp"><Input id="cp" type="password" required minLength={MIN_PW} autoComplete="new-password" value={pw.b} onChange={(e) => setPw((x) => ({ ...x, b: e.target.value }))} /></Field>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Update password</Button>
        </form>
      </>
    );
  if (sent)
    return (
      <>
        <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-sage-50 text-sage-dark"><Send className="size-5" /></span>
        <AuthHeading title="Check your inbox" body={<>If an account exists for <span className="font-medium text-ink">{email}</span>, a reset link is on its way. It expires in one hour.</>} />
        <button className="text-[13.5px] text-accent hover:underline" onClick={() => setSent(false)}>Try a different email</button>
      </>
    );
  return (
    <>
      <Link href="/auth/login" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
      <AuthHeading title="Reset your password" body="Enter the email you use for AstrologersDirect and we’ll send you a reset link." />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await api("/api/auth/request-reset", { body: { email } });
            setSent(true);
          });
        }}
      >
        <ErrorNote message={error} />
        <Field label="Email" htmlFor="email"><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Send reset link</Button>
      </form>
    </>
  );
}

function Invite() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { loading, error, run } = useSubmit();
  const [info, setInfo] = React.useState<{ email: string; name: string; practitioner: string; practice: string } | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  React.useEffect(() => {
    api<{ email: string; name: string; practitioner: string; practice: string }>(`/api/auth/invite?token=${encodeURIComponent(token)}`)
      .then(setInfo)
      .catch((e: ApiError) => setLoadError(e.message));
  }, [token]);
  if (loadError) return <AuthHeading title="This invitation can’t be used" body={loadError} />;
  if (!info) return <AuthHeading title="Opening your invitation…" />;
  return (
    <>
      <div className="mb-7 flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
        <Avatar name={info.practitioner || "A D"} size="lg" />
        <div className="min-w-0">
          <p className="text-[12px] text-muted">Invitation from</p>
          <p className="truncate text-[15px] font-semibold text-ink">{info.practitioner}</p>
          <p className="truncate text-[12.5px] text-muted">{info.practice}</p>
        </div>
      </div>
      <AuthHeading title="Accept your invitation" body="Your astrologer has set up a private client portal for your readings, recordings, sessions and the work you do between them." />
      <ul className="mb-7 space-y-2.5 text-[13.5px] text-ink-3">
        <li className="flex items-center gap-2.5"><BookOpen className="size-4 text-accent" /> Read, listen to and watch your readings</li>
        <li className="flex items-center gap-2.5"><CalendarDays className="size-4 text-accent" /> See upcoming and past consultations</li>
        <li className="flex items-center gap-2.5"><Lock className="size-4 text-accent" /> Private to you and your astrologer</li>
      </ul>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await api<{ redirect: string }>("/api/auth/invite/accept", { body: { token, password: password || undefined } });
            router.replace(r.redirect);
          });
        }}
      >
        <ErrorNote message={error} />
        <Field label="Email" htmlFor="em"><Input id="em" type="email" value={info.email} readOnly className="bg-canvas-2 text-muted" /></Field>
        <Field label="Create a password" htmlFor="pw" optional hint="No password needed: next time, we’ll email you a sign-in link. Add one if you’d rather.">
          <Input id="pw" type="password" minLength={MIN_PW} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Open my portal</Button>
      </form>
      <p className="mt-6 text-center text-[12px] text-muted">Your astrologer’s private notes are never visible in the portal.</p>
    </>
  );
}

const wrap = (C: React.ComponentType) =>
  function Wrapped() {
    return (
      <React.Suspense>
        <C />
      </React.Suspense>
    );
  };

export const ServerLogin = wrap(Login);
export const ServerSignup = wrap(Signup);
export const ServerVerify = wrap(Verify);
export const ServerReset = wrap(Reset);
export const ServerInvite = wrap(Invite);
export const ServerLinkSignIn = wrap(LinkSignIn);
