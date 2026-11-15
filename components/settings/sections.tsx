"use client";

import * as React from "react";
import { Camera, Monitor, Smartphone, ShieldCheck, Download, Upload, Trash2, RotateCcw, Check, Palette, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ASPECTS, BODIES, HOUSE_SYSTEMS, PLANET_IDS, ZODIACS, type AspectId, type BodyId, type HouseSystem, type ZodiacType } from "@/lib/astro";
import { cn, DATA_MODE, fmtDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { TwoFactorCard } from "./two-factor";
import { CalendarFeedCard, RemindersCard } from "./practice-tools";
import { allZones } from "@/lib/timezones";
import { bootstrap, loadSampleData } from "@/lib/sync";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SimulatedBadge, SimulatedNote } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div>
        <p className="text-[13.5px] font-medium">{title}</p>
        {desc && <p className="text-[12.5px] text-muted">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function useSaved() {
  const toast = useStore((s) => s.toast);
  return (what: string) => toast("Changes saved", what, "success");
}

// ——— Profile ——————————————————————————————————————————————————————————
export function ProfileSection() {
  const p = useStore((s) => s.practitioner);
  const update = useStore((s) => s.updatePractitioner);
  const saved = useSaved();
  const [f, setF] = React.useState(p);
  React.useEffect(() => setF(p), [p]);
  return (
    <Card>
      <CardHeader title="Profile" description="How you appear to clients in the portal and in delivered readings." />
      <CardBody className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={f.name} size="xl" />
          <div>
            <Button variant="secondary" size="sm" onClick={() => saved("Photo upload is simulated in the prototype.")}><Camera /> Upload photo</Button>
            <p className="mt-1.5 text-[12px] text-muted">Square image, at least 400 × 400px.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, firstName: e.target.value.split(" ")[0] ?? "" })} /></Field>
          <Field label="Professional title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Professional biography" hint="Shown on your client portal." className="sm:col-span-2"><Textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        </div>
      </CardBody>
      <CardFooter>
        <Button variant="ghost" onClick={() => setF(p)}>Cancel</Button>
        <Button onClick={() => { update(f); saved("Your profile has been updated."); }}>Save profile</Button>
      </CardFooter>
    </Card>
  );
}

// ——— Practice ————————————————————————————————————————————————————————
const BRAND = ["#824B59", "#5E7266", "#4D5A70", "#7A6145", "#29272B"];
export function PracticeSection() {
  const p = useStore((s) => s.practitioner);
  const update = useStore((s) => s.updatePractitioner);
  const saved = useSaved();
  const [f, setF] = React.useState(p);
  const [color, setColor] = React.useState(BRAND[0]);
  React.useEffect(() => setF(p), [p]);
  return (
    <Card>
      <CardHeader title="Practice" description="Your practice identity, used in the client portal and notifications." />
      <CardBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Practice name" className="sm:col-span-2"><Input value={f.practice} onChange={(e) => setF({ ...f, practice: e.target.value })} /></Field>
          <Field label="Website"><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
          <Field label="Public contact email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Time zone" className="sm:col-span-2">
            <Select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>
              {(DATA_MODE === "demo"
                ? ["America/Los_Angeles (Pacific Time)", "America/Denver (Mountain Time)", "America/Chicago (Central Time)", "America/New_York (Eastern Time)", "Europe/London (UK)", "Europe/Lisbon", "Europe/Madrid (Central European)", "Australia/Sydney"]
                : Array.from(new Set([f.timezone, ...allZones()]))
              ).map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2"><Palette className="size-4 text-muted" /><p className="text-[13.5px] font-medium">Portal branding</p><SimulatedBadge /></div>
          <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              <p className="text-[12.5px] text-muted">Accent colour</p>
              <div className="flex gap-2">
                {BRAND.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={cn("flex size-8 items-center justify-center rounded-full ring-offset-2", color === c && "ring-2 ring-ink/30")} style={{ background: c }} aria-label={`Accent ${c}`}>
                    {color === c && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={() => saved("Logo upload is simulated.")}><Upload /> Upload logo</Button>
            </div>
            <div className="rounded-lg border border-line bg-canvas p-3">
              <p className="eyebrow mb-2">Preview</p>
              <div className="rounded-md bg-surface p-3 shadow-card">
                <p className="font-serif text-[16px]">{f.practice}</p>
                <p className="text-[11px] text-muted">Client portal</p>
                <div className="mt-3 h-7 w-28 rounded-md" style={{ background: color }} />
              </div>
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <Button onClick={() => { update(f); saved("Practice details updated."); }}>Save practice</Button>
      </CardFooter>
    </Card>
  );
}

// ——— Astrology defaults ——————————————————————————————————————————————
const CORE_ASPECTS: AspectId[] = ["conjunction", "opposition", "trine", "square", "sextile", "quincunx", "semisextile", "semisquare", "sesquiquadrate"];

export function AstrologySection() {
  const d = useStore((s) => s.defaults);
  const update = useStore((s) => s.updateDefaults);
  const toast = useStore((s) => s.toast);
  const set = (patch: Parameters<typeof update>[0], msg = "Chart defaults updated") => {
    update(patch);
    toast(msg, "Applies to charts without their own saved settings.", "success");
  };
  const toggleBody = (b: BodyId) => set({ bodies: d.bodies.includes(b) ? d.bodies.filter((x) => x !== b) : [...d.bodies, b] });
  const toggleAspect = (a: AspectId) => set({ aspects: d.aspects.includes(a) ? d.aspects.filter((x) => x !== a) : [...d.aspects, a] });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Astrology defaults" description="Defaults for new charts across your practice. Each chart can override them in the workspace." />
        <CardBody className="divide-y divide-line py-1">
          <Row title="House system" desc="Whole sign is always used automatically when a birth time is unknown.">
            <Select value={d.houseSystem} onChange={(e) => set({ houseSystem: e.target.value as HouseSystem })} className="w-56">
              {HOUSE_SYSTEMS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Row>
          <Row title="Zodiac" desc="Tropical or sidereal (with ayanamsa).">
            <Select value={d.zodiac} onChange={(e) => set({ zodiac: e.target.value as ZodiacType })} className="w-56">
              {ZODIACS.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
          </Row>
          <Row title="Show aspect lines"><Switch checked={d.showAspectLines} onCheckedChange={(v) => set({ showAspectLines: v })} /></Row>
          <Row title="Show house cusps"><Switch checked={d.showHouseCusps} onCheckedChange={(v) => set({ showHouseCusps: v })} /></Row>
          <Row title="Show degrees on the wheel"><Switch checked={d.showDegrees} onCheckedChange={(v) => set({ showDegrees: v })} /></Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Aspects & orbs" description="Which aspects are calculated and the maximum orb for each." />
        <div className="divide-y divide-line">
          {CORE_ASPECTS.map((a) => {
            const on = d.aspects.includes(a);
            const orb = d.orbs[a] ?? ASPECTS[a].defaultOrb;
            return (
              <div key={a} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                <Checkbox checked={on} onChange={() => toggleAspect(a)} aria-label={ASPECTS[a].name} />
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="glyph w-5 text-center text-[16px]">{ASPECTS[a].glyph}</span>
                  <span className="text-[13.5px]">{ASPECTS[a].name}</span>
                  <span className="text-[12px] text-muted">{ASPECTS[a].angle}°</span>
                  {ASPECTS[a].nature === "minor" && <Badge tone="outline">Minor</Badge>}
                </div>
                <div className={cn("flex items-center gap-3", !on && "opacity-40")}>
                  <input type="range" min={0.5} max={12} step={0.5} value={orb} disabled={!on} onChange={(e) => update({ orbs: { [a]: Number(e.target.value) } })} className="w-20 accent-[#824B59] sm:w-40" aria-label={`${ASPECTS[a].name} orb`} />
                  <span className="w-9 text-right text-[12.5px] tabular-nums">{orb}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Planet & point visibility" description="Bodies shown on new charts and included in aspect calculations." />
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PLANET_IDS.map((b) => (
            <label key={b} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition-colors", d.bodies.includes(b) ? "border-accent-200 bg-accent-50/50" : "border-line")}>
              <Checkbox checked={d.bodies.includes(b)} onChange={() => toggleBody(b)} />
              <span className="glyph w-4 text-center text-[15px]">{BODIES[b].glyph}</span>
              {BODIES[b].name}
            </label>
          ))}
        </CardBody>
        <CardFooter className="justify-between">
          <SimulatedNote className="py-1.5">Calculations use the prototype&apos;s demonstration engine.</SimulatedNote>
          <Button variant="ghost" size="sm" onClick={() => set({ bodies: [...PLANET_IDS], aspects: ["conjunction", "opposition", "trine", "square", "sextile", "quincunx"], orbs: { conjunction: 8, opposition: 8, trine: 7, square: 7, sextile: 5, quincunx: 3, semisextile: 2, semisquare: 2, sesquiquadrate: 2 } }, "Defaults restored")}>
            <RotateCcw /> Restore defaults
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ——— Notifications ——————————————————————————————————————————————————
export function NotificationsSection() {
  if (DATA_MODE !== "demo") return <ServerNotifications />;
  return <DemoNotifications />;
}

function ServerNotifications() {
  return (
    <div className="space-y-6">
      <RemindersCard />
      <CalendarFeedCard />
      <DemoNotifications />
    </div>
  );
}

function DemoNotifications() {
  const saved = useSaved();
  const [v, setV] = React.useState({ emailDigest: true, emailConsult: true, emailDelivery: false, inApp: true, clientReminders: true, reminderHours: "24", digestTime: "07:00" });
  const t = (k: keyof typeof v) => (c: boolean) => { setV({ ...v, [k]: c }); saved("Notification setting updated."); };
  return (
    <Card>
      <CardHeader title={DATA_MODE === "demo" ? "Notifications" : "Your notifications"} description={DATA_MODE === "demo" ? "Email, in-app notifications and automatic reminders." : "Emails and reminders for you (coming soon)."} action={<SimulatedBadge />} />
      <CardBody className="divide-y divide-line py-1">
        <p className="eyebrow pb-1 pt-3">Email</p>
        <Row title="Daily digest" desc="Today's consultations, overdue tasks and pending deliveries."><Switch checked={v.emailDigest} onCheckedChange={t("emailDigest")} /></Row>
        <Row title="Consultation changes" desc="Bookings, reschedules and cancellations."><Switch checked={v.emailConsult} onCheckedChange={t("emailConsult")} /></Row>
        <Row title="Reading opened by client"><Switch checked={v.emailDelivery} onCheckedChange={t("emailDelivery")} /></Row>
        <p className="eyebrow pb-1 pt-5">In-app</p>
        <Row title="Show in-app notifications"><Switch checked={v.inApp} onCheckedChange={t("inApp")} /></Row>
        <Row title="Digest time">
          <Input type="time" value={v.digestTime} onChange={(e) => setV({ ...v, digestTime: e.target.value })} className="w-32" />
        </Row>
        <p className="eyebrow pb-1 pt-5">Reminders</p>
        {DATA_MODE === "demo" && <Row title="Send clients consultation reminders" desc="Email reminder with joining details."><Switch checked={v.clientReminders} onCheckedChange={t("clientReminders")} /></Row>}
        <Row title="Remind me before consultations">
          <Select value={v.reminderHours} onChange={(e) => { setV({ ...v, reminderHours: e.target.value }); saved("Reminder timing updated."); }} className="w-44">
            <option value="1">1 hour before</option>
            <option value="3">3 hours before</option>
            <option value="24">24 hours before</option>
            <option value="48">48 hours before</option>
          </Select>
        </Row>
      </CardBody>
    </Card>
  );
}

/** Rough, readable device name from a user-agent string. */
function describeAgent(ua: string | null) {
  if (!ua) return { name: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return { name: os ? `${browser} on ${os}` : browser, mobile: /iPhone|Android|Mobile/.test(ua) };
}

// ——— Security ————————————————————————————————————————————————————————
export function SecuritySection() {
  const toast = useStore((s) => s.toast);
  const [twofa, setTwofa] = React.useState(false);
  const [pw, setPw] = React.useState({ cur: "", next: "", confirm: "" });
  const [sessions, setSessions] = React.useState<{ id: string; icon: typeof Monitor; name: string; where: string; when: string; current: boolean }[]>(
    DATA_MODE === "demo"
      ? [
          { id: "1", icon: Monitor, name: "Chrome on macOS", where: "Portland, OR · this device", when: "Active now", current: true },
          { id: "2", icon: Smartphone, name: "Safari on iPhone", where: "Portland, OR", when: "2 hours ago", current: false },
          { id: "3", icon: Monitor, name: "Firefox on Windows", where: "Lisbon, Portugal", when: "Oct 30, 2026", current: false },
        ]
      : [],
  );
  const loadSessions = React.useCallback(() => {
    if (DATA_MODE === "demo") return;
    api<{ sessions: { id: string; userAgent: string | null; createdAt: string; current: boolean }[] }>("/api/auth/sessions")
      .then((r) =>
        setSessions(
          r.sessions.map((x) => {
            const d = describeAgent(x.userAgent);
            return { id: x.id, icon: d.mobile ? Smartphone : Monitor, name: d.name, where: x.current ? "This device" : "Signed in", when: `Since ${fmtDate(x.createdAt)}`, current: x.current };
          }),
        ),
      )
      .catch(() => {});
  }, []);
  React.useEffect(loadSessions, [loadSessions]);
  const endSession = async (body: { id?: string; others?: boolean }) => {
    if (DATA_MODE === "demo") {
      setSessions((x) => (body.others ? x.filter((s) => s.current) : x.filter((s) => s.id !== body.id)));
      if (body.others) toast("Signed out of other sessions");
      return;
    }
    try {
      await api("/api/auth/sessions", { method: "DELETE", body });
      toast(body.others ? "Signed out of other sessions" : "Session signed out", undefined, "success");
      loadSessions();
    } catch (e) {
      toast("Couldn’t sign out that session", (e as Error).message, "error");
    }
  };
  const ok = pw.cur && pw.next.length >= 10 && pw.next === pw.confirm;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Password" />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password"><Input type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></Field>
          <Field label="New password" hint="At least 10 characters."><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Confirm new password"><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </CardBody>
        <CardFooter>
          <Button
            disabled={!ok}
            onClick={async () => {
              if (DATA_MODE === "demo") { setPw({ cur: "", next: "", confirm: "" }); toast("Password updated (simulated)", undefined, "success"); return; }
              try {
                await api("/api/auth/change-password", { body: { current: pw.cur, next: pw.next } });
                setPw({ cur: "", next: "", confirm: "" });
                toast("Password updated", "You’ve been signed out on your other devices.", "success");
              } catch (e) {
                toast("Password not changed", (e as Error).message, "error");
              }
            }}
          >
            Update password
          </Button>
        </CardFooter>
      </Card>
      {DATA_MODE === "demo" ? (
      <Card>
          <CardHeader title="Two-factor authentication" description="Protect client records with an authenticator app." action={<SimulatedBadge />} />
          <CardBody className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className={cn("size-8", twofa ? "text-sage-dark" : "text-muted")} />
              <div>
                <p className="text-[13.5px] font-medium">{twofa ? "Enabled" : "Not enabled"}</p>
                <p className="text-[12.5px] text-muted">{twofa ? "You'll be asked for a code on new devices." : "Recommended for practices holding client birth data."}</p>
              </div>
            </div>
            <Switch checked={twofa} onCheckedChange={(v) => { setTwofa(v); toast(v ? "Two-factor authentication enabled" : "Two-factor authentication disabled", "Simulated — no authenticator was configured.", "success"); }} />
          </CardBody>
        </Card>
      ) : (
        <TwoFactorCard />
      )}
      <Card>
        <CardHeader title="Active sessions" action={<Button variant="secondary" size="xs" onClick={() => void endSession({ others: true })}>Sign out all others</Button>} />
        <ul className="divide-y divide-line">
          {sessions.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-5 py-3">
              <x.icon className="size-5 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{x.name} {x.current && <Badge tone="sage" className="ml-1">This device</Badge>}</p>
                <p className="text-[12px] text-muted">{x.where} · {x.when}</p>
              </div>
              {!x.current && <Button variant="ghost" size="xs" onClick={() => void endSession({ id: x.id })}>Sign out</Button>}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Data access" description="Who and what can access your practice data." />
        <CardBody className="divide-y divide-line py-1">
          <Row title="Client portal" desc="Clients see only readings, files and consultation summaries you share. Private observations are never shown."><Badge tone="sage">Enforced</Badge></Row>
          <Row title="AI assistance" desc="Chart questions are answered from your own records; data is not used to train models."><Badge tone="info">Practice-only</Badge></Row>
          <Row title="Connected integrations"><span className="text-[12.5px] text-muted">None connected</span></Row>
        </CardBody>
      </Card>
    </div>
  );
}

// ——— Subscription ————————————————————————————————————————————————————
export function SubscriptionSection() {
  const router = useRouter();
  const counts = { clients: useStore((s) => s.clients.length), charts: useStore((s) => s.charts.length) };
  const usage = [
    { label: "Storage", used: "19 GB", of: "50 GB", pct: 38 },
    { label: "Active clients", used: String(counts.clients), of: "Unlimited", pct: 0 },
    { label: "Saved charts", used: String(counts.charts), of: "Unlimited", pct: 0 },
    { label: "Recording minutes this month", used: "212 min", of: "600 min", pct: 35 },
    { label: "AI assistant requests this month", used: "86", of: "500", pct: 17 },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Current plan" action={<SimulatedBadge label="Placeholder plan" />} />
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-[26px]">Professional</p>
            <p className="text-[13px] text-muted">Pricing and plan limits are not yet finalised. Figures shown are placeholders.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push("/pricing")}>Compare plans</Button>
            <Button size="sm" disabled>Change plan</Button>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Usage" description="Demonstration allowances." />
        <CardBody className="space-y-4">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span>{u.label}</span>
                <span className="text-muted">{u.used} / {u.of}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${u.pct || 4}%`, opacity: u.pct ? 1 : 0.35 }} />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Billing information" />
        <CardBody>
          <SimulatedNote>No payment integration exists in the prototype. Billing details, invoices and payment methods will appear here once a payment provider is connected.</SimulatedNote>
        </CardBody>
      </Card>
    </div>
  );
}

// ——— Data ————————————————————————————————————————————————————————————
export function DataSection() {
  const router = useRouter();
  const s = useStore();
  const [del, setDel] = React.useState(false);
  const [clear, setClear] = React.useState(false);
  const [delPassword, setDelPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [privacy, setPrivacy] = React.useState({ anonymised: false, retention: "indefinite" });

  const exportAll = () => {
    const { toasts, session, sync, portalClientId, ...rest } = useStore.getState();
    void toasts; void session; void sync; void portalClientId;
    const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "astrologersdirect-practice-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
    s.toast("Export ready", "Your full practice data was downloaded as JSON.", "success");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Import & export" />
        <CardBody className="divide-y divide-line py-1">
          <Row title="Export all practice data" desc="Clients, people, charts, observations, consultations, tasks and delivery records (JSON).">
            <Button variant="secondary" size="sm" onClick={exportAll}><Download /> Export</Button>
          </Row>
          <Row title="Import clients" desc="CSV or exports from other astrology software.">
            <Button variant="secondary" size="sm" onClick={() => router.push("/app/clients")}><Upload /> Go to import</Button>
          </Row>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Privacy" />
        <CardBody className="divide-y divide-line py-1">
          <Row title="Contribute anonymised patterns to research" desc="Future feature: anonymised configuration statistics. Never includes names or notes.">
            <Switch checked={privacy.anonymised} onCheckedChange={(v) => { setPrivacy({ ...privacy, anonymised: v }); s.toast("Privacy preference saved"); }} />
          </Row>
          <Row title="Archived client retention">
            <Select value={privacy.retention} onChange={(e) => { setPrivacy({ ...privacy, retention: e.target.value }); s.toast("Retention updated"); }} className="w-48">
              <option value="indefinite">Keep indefinitely</option>
              <option value="7y">Delete after 7 years</option>
              <option value="3y">Delete after 3 years</option>
            </Select>
          </Row>
        </CardBody>
      </Card>
      {DATA_MODE === "demo" ? (
        <Card>
          <CardHeader title="Prototype data" description="Restore the original demonstration dataset." />
          <CardBody className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-muted">Removes clients, charts, observations and deliveries you created while exploring.</p>
            <Button variant="secondary" size="sm" onClick={s.resetDemo}><RotateCcw /> Reset demo data</Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Sample data" description="Explore with example clients, or start again with an empty practice." />
          <CardBody className="divide-y divide-line py-1">
            <Row title="Add sample data" desc="12 example clients with charts, consultations, observations and readings, dated around today.">
              <Button variant="secondary" size="sm" onClick={async () => { try { await loadSampleData(); s.toast("Sample data added", undefined, "success"); } catch (e) { s.toast("Couldn’t add sample data", (e as Error).message, "error"); } }}><Database /> Add sample data</Button>
            </Row>
            <Row title="Delete all client records" desc="Removes every client, chart, observation, consultation, task and delivery, and all client portal logins. Your account stays.">
              <Button variant="secondary" size="sm" onClick={() => setClear(true)}><Trash2 /> Delete records</Button>
            </Row>
          </CardBody>
        </Card>
      )}
      <Dialog open={clear} onOpenChange={(o) => { setClear(o); setConfirm(""); }}>
        <DialogContent
          title="Delete all client records?"
          description="This permanently removes every client record in your practice. Your account and settings stay."
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setClear(false)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={confirm !== "DELETE"}
                onClick={async () => {
                  try {
                    await api("/api/v1/practice", { method: "DELETE", body: { confirm: "DELETE" } });
                    setClear(false);
                    useStore.setState({ session: { status: "idle" } });
                    await bootstrap("app");
                    s.toast("All client records deleted", undefined, "success");
                  } catch (e) {
                    s.toast("Nothing was deleted", (e as Error).message, "error");
                  }
                }}
              >
                Delete permanently
              </Button>
            </>
          }
        >
          <Field label={<>Type <span className="font-mono">DELETE</span> to confirm</>}><Input value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        </DialogContent>
      </Dialog>
      <Card className="border-danger/30">
        <CardHeader title={<span className="text-danger">Delete account</span>} description="Permanently delete your practice and all client records." />
        <CardBody className="flex items-center justify-between gap-4">
          <p className="text-[13px] text-muted">We recommend exporting your data first. This cannot be undone.</p>
          <Button variant="danger" size="sm" onClick={() => setDel(true)}><Trash2 /> Delete account</Button>
        </CardBody>
      </Card>
      <Dialog open={del} onOpenChange={(o) => { setDel(o); setConfirm(""); }}>
        <DialogContent
          title="Delete your account?"
          description="All clients, charts, observations, recordings and delivered readings will be permanently removed."
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDel(false)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={confirm !== "DELETE"}
                onClick={async () => {
                  if (DATA_MODE === "demo") { setDel(false); s.toast("Account deletion simulated", "Nothing was deleted in the prototype."); return; }
                  try {
                    await api("/api/v1/account", { method: "DELETE", body: { confirm: "DELETE", password: delPassword } });
                    window.location.href = "/";
                  } catch (e) {
                    s.toast("Account not deleted", (e as Error).message, "error");
                  }
                }}
              >
                Delete permanently
              </Button>
            </>
          }
        >
          <Field label={<>Type <span className="font-mono">DELETE</span> to confirm</>}><Input value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
          {DATA_MODE !== "demo" && <Field label="Your password" className="mt-3"><Input type="password" autoComplete="current-password" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} /></Field>}
          {DATA_MODE === "demo" && <SimulatedNote className="mt-4">Simulated — no data is deleted.</SimulatedNote>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
