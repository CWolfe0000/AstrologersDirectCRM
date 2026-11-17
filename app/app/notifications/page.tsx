"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCheck, Bell, Circle, CircleCheck, Settings2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { NotificationType } from "@/lib/data/types";
import { cn, relTime, fmtDate, fmtTime } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/tabs";
import { Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NotificationIcon } from "@/components/app/notification-icon";

const TYPES: { id: NotificationType; label: string; desc: string }[] = [
  { id: "consultation", label: "Upcoming consultations", desc: "Reminders before sessions and cancellations" },
  { id: "client", label: "New client activity", desc: "Portal sign-ups, intake forms, profile updates" },
  { id: "delivery", label: "Reading delivery confirmations", desc: "When readings are delivered and opened" },
  { id: "upload", label: "Failed uploads", desc: "Problems delivering files to the client portal" },
  { id: "task", label: "Outstanding tasks", desc: "Daily digest of overdue and due tasks" },
  { id: "account", label: "Account notifications", desc: "Storage, billing and security" },
];

export default function NotificationsPage() {
  const s = useStore();
  const [view, setView] = React.useState<"all" | "unread">("all");
  const [type, setType] = React.useState<"all" | NotificationType>("all");
  const [prefs, setPrefs] = React.useState<Record<string, { inApp: boolean; email: boolean }>>(() =>
    Object.fromEntries(TYPES.map((t) => [t.id, { inApp: true, email: t.id === "consultation" || t.id === "upload" || t.id === "account" }])),
  );

  const unread = s.notifications.filter((n) => !n.read).length;
  const list = s.notifications
    .filter((n) => (view === "unread" ? !n.read : true) && (type === "all" || n.type === type))
    .sort((a, b) => b.at.localeCompare(a.at));

  const setPref = (id: string, k: "inApp" | "email", v: boolean) => {
    setPrefs((p) => ({ ...p, [id]: { ...p[id]!, [k]: v } }));
    s.toast("Preference saved", `${TYPES.find((t) => t.id === id)?.label}: ${k === "inApp" ? "in-app" : "email"} ${v ? "on" : "off"}`);
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention across clients, consultations and deliveries."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Notifications" }]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => { s.markAllNotifications(); s.toast("All notifications marked as read"); }} disabled={unread === 0}>
            <CheckCheck /> Mark All as Read
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Segmented value={view} onChange={setView} size="sm" options={[{ value: "all", label: "All", count: s.notifications.length }, { value: "unread", label: "Unread", count: unread }]} />
            <Select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-56" aria-label="Filter by type">
              <option value="all">All types</option>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </div>
          <Card>
            {list.length === 0 ? (
              <EmptyState icon={<Bell />} title={view === "unread" ? "You're All Caught Up" : "No Notifications"} body="New activity will appear here." />
            ) : (
              <ul className="divide-y divide-line">
                {list.map((n) => (
                  <li key={n.id} className={cn("group flex gap-3 px-4 py-4 md:px-5", !n.read && "bg-accent-50/30")}>
                    <NotificationIcon type={n.type} />
                    <Link href={n.href ?? "#"} onClick={() => s.markNotification(n.id, true)} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className={cn("text-[13.5px]", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                        <span className="text-[11.5px] text-muted" title={`${fmtDate(n.at)} ${fmtTime(n.at)}`}>{relTime(n.at)}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
                    </Link>
                    <button
                      onClick={() => s.markNotification(n.id, !n.read)}
                      className="shrink-0 self-start rounded-md p-1.5 text-muted hover:bg-canvas-2 hover:text-ink"
                      title={n.read ? "Mark as unread" : "Mark as read"}
                      aria-label={n.read ? "Mark as unread" : "Mark as read"}
                    >
                      {n.read ? <Circle className="size-4" /> : <CircleCheck className="size-4 text-accent" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Notification Preferences" description="Choose how you hear about each kind of activity." icon={<Settings2 />} />
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-line bg-canvas/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span>Type</span>
            <span>In-app</span>
            <span>Email</span>
          </div>
          <ul className="divide-y divide-line">
            {TYPES.map((t) => (
              <li key={t.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{t.label}</p>
                  <p className="text-[12px] text-muted">{t.desc}</p>
                </div>
                <Switch checked={prefs[t.id]!.inApp} onCheckedChange={(v) => setPref(t.id, "inApp", v)} aria-label={`${t.label} in-app`} className="mx-2" />
                <Switch checked={prefs[t.id]!.email} onCheckedChange={(v) => setPref(t.id, "email", v)} aria-label={`${t.label} email`} className="mx-1.5" />
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3 text-[12px] text-muted">
            More options in <Link href="/app/settings?section=notifications" className="text-accent underline underline-offset-2">Settings → Notifications</Link>. Email delivery is simulated.
          </p>
        </Card>
      </div>
    </div>
  );
}
