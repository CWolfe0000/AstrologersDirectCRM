"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CircleUserRound, Menu, Repeat2, Sparkles, SunMoon, Users, X } from "lucide-react";
import { Mark } from "./logo";

const NAV = [
  { href: "/app", label: "You", icon: SunMoon, exact: true },
  { href: "/app/people", label: "People", icon: Users },
  { href: "/app/patterns", label: "Patterns", icon: Repeat2 },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/practice", label: "Practice", icon: Sparkles },
];

function Sidebar({ name, email, premium, onNavigate }: { name: string; email: string; premium: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string, exact?: boolean) => (exact ? path === href || path === "/app/you" : path === href || path.startsWith(href + "/"));
  return (
    <div className="flex h-full flex-col bg-ink text-[#CFCAD0]">
      <div className="flex h-16 items-center px-5">
        <Link href="/app" onClick={onNavigate} className="inline-flex items-center gap-2 font-display text-[20px] text-white">
          <Mark className="h-6 w-6" /> Datebyfate
        </Link>
      </div>
      <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-2 pb-2 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9C969E]">Your Charts</div>
        <ul className="space-y-0.5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={onNavigate}
                aria-current={active(n.href, n.exact) ? "page" : undefined}
                className={`group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] transition-colors ${active(n.href, n.exact) ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.05] hover:text-white"}`}
              >
                <span className={`absolute -left-3 h-5 w-[3px] rounded-r bg-accent-200 transition-opacity ${active(n.href, n.exact) ? "opacity-100" : "opacity-0"}`} />
                <n.icon className={`size-[17px] ${active(n.href, n.exact) ? "text-[#E3C9D0]" : "text-[#9C969E] group-hover:text-[#CFCAD0]"}`} />
                <span className="flex-1 truncate">{n.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mx-2 my-4 h-px bg-white/[0.07]" />
        <ul>
          <li>
            <Link href="/app/account" onClick={onNavigate} className={`group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] transition-colors ${active("/app/account") ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.05] hover:text-white"}`}>
              <CircleUserRound className="size-[17px] text-[#9C969E] group-hover:text-[#CFCAD0]" />
              Account
            </Link>
          </li>
        </ul>
        {!premium && (
          <div className="mx-2 mt-6 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="text-[11.5px] font-medium text-white">Free Plan</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-[#9C969E]">Your own chart and pattern. Subscribe for people, patterns, the full calendar and practices.</p>
            <Link href="/pricing" onClick={onNavigate} className="mt-2 inline-block text-[11.5px] text-[#E3C9D0] hover:text-white">See plans</Link>
          </div>
        )}
      </nav>
      <Link href="/app/account" onClick={onNavigate} className="flex items-center gap-3 border-t border-white/[0.07] px-5 py-3.5 hover:bg-white/[0.04]">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#4A3A40] text-[12px] font-semibold text-[#EBD7DC]">{name.slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-white">{name}</span>
          <span className="block truncate text-[11.5px] text-[#9C969E]">{premium ? "Subscriber" : email}</span>
        </span>
      </Link>
    </div>
  );
}

/** The signed-in frame: a fixed sidebar on large screens, a drawer on small ones. */
export function AppShell({ name, email, premium, children }: { name: string; email: string; premium: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        <Sidebar name={name} email={email} premium={premium} />
      </aside>
      {open && (
        <div className="lg:hidden">
          <button aria-label="Close menu" className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[272px]">
            <Sidebar name={name} email={email} premium={premium} onNavigate={() => setOpen(false)} />
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-white hover:bg-white/10"><X className="size-5" /></button>
          </div>
        </div>
      )}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
          <button aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-canvas-2"><Menu className="size-5" /></button>
          <Link href="/app" className="inline-flex items-center gap-2 font-display text-[18px]"><Mark className="h-5 w-5" /> Datebyfate</Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6 md:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/** Page title with an optional line under it and actions on the right, as on every AstrologersDirect screen. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
