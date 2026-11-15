"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Database, ExternalLink, RotateCcw } from "lucide-react";
import { loadSampleData } from "@/lib/sync";
import { cn, DATA_MODE, TODAY } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Wordmark } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import { APP_NAV, APP_NAV_SECONDARY } from "./nav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const p = useStore((s) => s.practitioner);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const overdue = useStore((s) => s.tasks.filter((t) => t.status !== "done" && t.due < TODAY).length);
  const pending = useStore((s) => s.readings.filter((r) => r.status === "ready" || r.status === "failed" || r.status === "draft").length);
  const resetDemo = useStore((s) => s.resetDemo);
  const toast = useStore((s) => s.toast);
  const clientCount = useStore((s) => s.clients.length);
  const [loadingSample, setLoadingSample] = React.useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));
  const badge = (href: string) => (href === "/app/tasks" ? overdue : href === "/app/delivery" ? pending : href === "/app/notifications" ? unread : 0);

  return (
    <div className="flex h-full flex-col bg-ink text-[#CFCAD0]">
      <div className="flex h-16 items-center px-5">
        <Link href="/app" onClick={onNavigate}>
          <Wordmark light />
        </Link>
      </div>
      <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-2 pb-2 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9C969E]">Practice</div>
        <ul className="space-y-0.5">
          {APP_NAV.map((n) => {
            const active = isActive(n.href, n.exact);
            const b = badge(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] transition-colors",
                    active ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  <span className={cn("absolute -left-3 h-5 w-[3px] rounded-r bg-accent-200 transition-opacity", active ? "opacity-100" : "opacity-0")} />
                  <n.icon className={cn("size-[17px]", active ? "text-[#E3C9D0]" : "text-[#9C969E] group-hover:text-[#CFCAD0]")} />
                  <span className="flex-1 truncate">{n.label}</span>
                  {b > 0 && <span className={cn("rounded-full px-1.5 text-[10.5px] font-semibold leading-[18px]", n.href === "/app/tasks" ? "bg-accent text-white" : "bg-white/10 text-white")}>{b}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mx-2 my-4 h-px bg-white/[0.07]" />
        <ul className="space-y-0.5">
          {APP_NAV_SECONDARY.map((n) => {
            const active = isActive(n.href);
            const b = badge(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={onNavigate}
                  className={cn("group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] transition-colors", active ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.05] hover:text-white")}
                >
                  <n.icon className={cn("size-[17px]", active ? "text-[#E3C9D0]" : "text-[#9C969E] group-hover:text-[#CFCAD0]")} />
                  <span className="flex-1">{n.label}</span>
                  {b > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[10.5px] font-semibold leading-[18px] text-white">{b}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        {DATA_MODE === "demo" ? (
          <div className="mx-2 mt-6 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="text-[11.5px] font-medium text-white">Prototype</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-[#9C969E]">Demonstration data. Changes are saved in this browser.</p>
            <div className="mt-2.5 flex flex-col gap-1.5">
              <Link href="/portal" className="inline-flex items-center gap-1.5 text-[11.5px] text-[#E3C9D0] hover:text-white" onClick={onNavigate}>
                <ExternalLink className="size-3" /> View client portal
              </Link>
              <Link href="/prototype" className="inline-flex items-center gap-1.5 text-[11.5px] text-[#E3C9D0] hover:text-white" onClick={onNavigate}>
                <ExternalLink className="size-3" /> Prototype guide
              </Link>
              <button onClick={resetDemo} className="inline-flex items-center gap-1.5 text-left text-[11.5px] text-[#9C969E] hover:text-white">
                <RotateCcw className="size-3" /> Reset demo data
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-2 mt-6 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="text-[11.5px] font-medium text-white">Beta</p>
            {clientCount === 0 ? (
              <>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[#9C969E]">Your practice is empty. Add your first client, or explore with sample data.</p>
                <button
                  disabled={loadingSample}
                  onClick={async () => {
                    setLoadingSample(true);
                    try {
                      await loadSampleData();
                      toast("Sample data added", "12 example clients with charts, consultations and readings.", "success");
                    } catch {
                      toast("Couldn’t add sample data", "Please try again.", "error");
                    } finally {
                      setLoadingSample(false);
                    }
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-left text-[11.5px] text-[#E3C9D0] hover:text-white disabled:opacity-60"
                >
                  <Database className="size-3" /> {loadingSample ? "Adding sample data…" : "Load sample data"}
                </button>
              </>
            ) : (
              <p className="mt-0.5 text-[11.5px] leading-snug text-[#9C969E]">Charts use Swiss Ephemeris — check a few against your usual software before relying on them.</p>
            )}
            <Link href="/portal" className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] text-[#E3C9D0] hover:text-white" onClick={onNavigate}>
              <ExternalLink className="size-3" /> Preview a client’s portal
            </Link>
          </div>
        )}
      </nav>
      <Link href="/app/settings" onClick={onNavigate} className="flex items-center gap-3 border-t border-white/[0.07] px-5 py-3.5 hover:bg-white/[0.04]">
        <Avatar name={p.name} size="sm" className="bg-[#4A3A40] text-[#EBD7DC]" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-white">{p.name}</p>
          <p className="truncate text-[11.5px] text-[#9C969E]">{p.practice}</p>
        </div>
      </Link>
    </div>
  );
}
