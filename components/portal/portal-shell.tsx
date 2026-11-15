"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, CalendarDays, Settings, Bell, LogOut, ArrowLeftRight } from "lucide-react";
import { cn, DATA_MODE, relTime } from "@/lib/utils";
import { signOut } from "@/lib/sync";
import { useStore, personName } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/misc";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** The client whose portal is shown (the signed-in client, or the demo client "c1"). */
export function usePortalClientId() {
  return useStore((s) => s.portalClientId);
}

const NAV = [
  { href: "/portal", label: "Home", icon: Home, exact: true },
  { href: "/portal/readings", label: "My Readings", short: "Readings", icon: BookOpen },
  { href: "/portal/consultations", label: "Consultations", short: "Sessions", icon: CalendarDays },
  { href: "/portal/settings", label: "Account", icon: Settings },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const PORTAL_CLIENT_ID = usePortalClientId();
  const path = usePathname();
  const pr = useStore((s) => s.practitioner);
  const me = useStore((s) => s.people.find((p) => p.id === PORTAL_CLIENT_ID));
  const allNotes = useStore((s) => s.portalNotifications);
  const notes = React.useMemo(() => allNotes.filter((n) => !n.clientId || n.clientId === PORTAL_CLIENT_ID), [allNotes, PORTAL_CLIENT_ID]);
  const session = useStore((s) => s.session);
  const myEmail = useStore((s) => s.clients.find((c) => c.id === PORTAL_CLIENT_ID)?.email);
  const showBanner = DATA_MODE === "demo" || session.preview;
  const markRead = useStore((s) => s.markPortalNotification);
  const unread = notes.filter((n) => !n.read).length;
  const active = (href: string, exact?: boolean) => (exact ? path === href : path.startsWith(href));

  return (
    <div className="min-h-screen bg-canvas pb-20 md:pb-0">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      {showBanner && <div className="bg-ink text-[12px] text-[#CFCAD0]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1.5 md:px-6">
          <span className="truncate">{DATA_MODE === "demo" ? `Client portal preview — signed in as demo client ${personName(me)}` : `Previewing ${personName(me)}’s portal — this is what they see`}</span>
          <Link href="/app" className="inline-flex shrink-0 items-center gap-1.5 text-[#E3C9D0] hover:text-white">
            <ArrowLeftRight className="size-3" /> Practitioner app
          </Link>
        </div>
      </div>}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 md:px-6">
          <Link href="/portal" className="min-w-0">
            <p className="truncate font-serif text-[19px] leading-tight text-ink">{pr.practice}</p>
            <p className="text-[11px] text-muted">Client portal · powered by AstrologersDirect</p>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("rounded-lg px-3 py-2 text-[13.5px] transition-colors", active(n.href, n.exact) ? "bg-canvas-2 font-medium text-ink" : "text-muted hover:text-ink")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative rounded-lg p-2 text-ink-3 hover:bg-canvas-2" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
                  <Bell className="size-[18px]" />
                  {unread > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9.5px] font-bold text-white">{unread}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(340px,calc(100vw-1.5rem))]">
                <p className="border-b border-line px-4 py-3 text-[14px] font-semibold">Notifications</p>
                {notes.slice(0, 5).map((n) => (
                  <Link key={n.id} href={n.href ?? "/portal"} onClick={() => markRead(n.id)} className={cn("block border-b border-line/70 px-4 py-3 last:border-0 hover:bg-canvas", !n.read && "bg-accent-50/40")}>
                    <p className="text-[13px] font-medium">{n.title}</p>
                    <p className="text-[12.5px] text-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{relTime(n.at)}</p>
                  </Link>
                ))}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button>
                  <Avatar name={personName(me)} size="sm" />
                  <span className="sr-only">Account menu</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1">
                <div className="px-3 py-2">
                  <p className="text-[13.5px] font-medium">{personName(me)}</p>
                  <p className="text-[12px] text-muted">{myEmail}</p>
                </div>
                <Link href="/portal/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] hover:bg-canvas-2"><Settings className="size-4 text-muted" /> Account settings</Link>
                {DATA_MODE === "demo" || !session.preview ? (
                  <Link href="/auth/login" onClick={(e) => { if (DATA_MODE !== "demo") { e.preventDefault(); void signOut(); } }} className="flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] hover:bg-canvas-2"><LogOut className="size-4 text-muted" /> Sign out</Link>
                ) : (
                  <Link href="/app" className="flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] hover:bg-canvas-2"><ArrowLeftRight className="size-4 text-muted" /> Back to workspace</Link>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">{children}</main>
      <footer className="mx-auto hidden max-w-5xl px-6 pb-10 text-[12px] text-muted md:block">
        Your readings and consultation records are private to you and {pr.name}. <Link href="/legal/privacy" className="underline">Privacy</Link>
      </footer>
      {/* mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px]", active(n.href, n.exact) ? "text-accent" : "text-muted")}>
            <n.icon className="size-5" />
            {n.short ?? n.label}
          </Link>
        ))}
      </nav>
      <Toaster />
    </div>
  );
}
