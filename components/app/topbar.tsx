"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Search, HelpCircle, Menu, LogOut, Settings, User, BookOpen, Keyboard, Compass, MessageCircle, ExternalLink, Lightbulb, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, titleCase, relTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/misc";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlobalSearch } from "./global-search";
import { QUICK_CREATE } from "./quick-create";
import { NotificationIcon } from "./notification-icon";
import { SaveStatus } from "./server-gate";
import { signOut } from "@/lib/sync";
import { DATA_MODE } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { useSuggestFeature } from "@/components/feedback/suggest-dialog";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const suggest = useSuggestFeature();
  const p = useStore((s) => s.practitioner);
  const notifications = useStore((s) => s.notifications);
  const mark = useStore((s) => s.markNotification);
  const markAll = useStore((s) => s.markAllNotifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-canvas/90 px-4 backdrop-blur md:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open Navigation">
        <Menu />
      </Button>

      <GlobalSearch
        trigger={(open) => (
          <button
            onClick={open}
            className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-left text-[13.5px] text-muted transition-colors hover:border-line-strong md:max-w-md"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate">Search clients, charts, observations…</span>
            <span className="hidden items-center gap-0.5 sm:flex">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        )}
      />

      <div className="ml-auto flex items-center gap-1 md:gap-1.5">
        <SaveStatus />
        <Dropdown>
          <DropdownTrigger asChild>
            <Button size="sm" className="px-2.5 sm:px-3" aria-label="Create">
              <Plus /> <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownTrigger>
          <DropdownContent className="w-56">
            <DropdownLabel>Quick create</DropdownLabel>
            {QUICK_CREATE.map((q) => (
              <DropdownItem key={q.href} onSelect={() => router.push(q.href)}>
                <q.icon /> {q.label}
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative">
              <Bell />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-[9.5px] font-bold text-white">{unread}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(380px,calc(100vw-1.5rem))]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[14px] font-semibold">Notifications</p>
              <button className="text-[12px] text-accent hover:underline" onClick={markAll}>
                Mark all as read
              </button>
            </div>
            <div className="scrollbar-thin max-h-[380px] overflow-y-auto">
              {notifications.slice(0, 6).map((n) => (
                <Link
                  key={n.id}
                  href={n.href ?? "/app/notifications"}
                  onClick={() => mark(n.id, true)}
                  className={cn("flex gap-3 border-b border-line/70 px-4 py-3 last:border-0 hover:bg-canvas", !n.read && "bg-accent-50/40")}
                >
                  <NotificationIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{titleCase(n.title)}</p>
                    <p className="line-clamp-2 text-[12.5px] text-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{relTime(n.at)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
                </Link>
              ))}
            </div>
            <Link href="/app/notifications" className="block border-t border-line px-4 py-2.5 text-center text-[12.5px] font-medium text-accent hover:bg-canvas">
              View all notifications
            </Link>
          </PopoverContent>
        </Popover>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Help" className="hidden sm:inline-flex">
              <HelpCircle />
            </Button>
          </DropdownTrigger>
          <DropdownContent className="w-60">
            <DropdownLabel>Help</DropdownLabel>
            <DropdownItem onSelect={() => window.open(`${SITE_URL}/contact#help`, "_blank")}><BookOpen /> Help Center</DropdownItem>
            <DropdownItem onSelect={() => window.open(`${SITE_URL}/how-it-works`, "_blank")}><Compass /> How It Works</DropdownItem>
            <DropdownItem onSelect={() => window.open(`${SITE_URL}/contact`, "_blank")}><MessageCircle /> Contact Support</DropdownItem>
            <DropdownItem onSelect={suggest.open}><Lightbulb /> Suggest a Feature</DropdownItem>
            <DropdownItem onSelect={() => window.open(`${SITE_URL}/whats-new`, "_blank")}><Sparkles /> What’s New</DropdownItem>
            <DropdownSeparator />
            <div className="flex items-center justify-between px-2.5 py-2 text-[12.5px] text-muted">
              <span className="flex items-center gap-2"><Keyboard className="size-4" /> Search</span>
              <span className="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
            </div>
          </DropdownContent>
        </Dropdown>
        {suggest.dialog}

        <Dropdown>
          <DropdownTrigger asChild>
            <button className="ml-1 rounded-full focus-visible:ring-2 focus-visible:ring-accent/40" aria-label="Profile Menu">
              <Avatar name={p.name} size="sm" />
            </button>
          </DropdownTrigger>
          <DropdownContent className="w-60">
            <div className="px-2.5 py-2">
              <p className="text-[13.5px] font-medium">{p.name}</p>
              <p className="truncate text-[12px] text-muted">{p.email}</p>
            </div>
            <DropdownSeparator />
            <DropdownItem onSelect={() => router.push("/app/settings?section=profile")}><User /> Profile</DropdownItem>
            <DropdownItem onSelect={() => router.push("/app/settings")}><Settings /> Settings</DropdownItem>
            <DropdownItem onSelect={() => router.push("/portal")}><ExternalLink /> Preview Client Portal</DropdownItem>
            <DropdownSeparator />
            <DropdownItem onSelect={() => (DATA_MODE === "demo" ? router.push("/auth/login") : void signOut())}><LogOut /> Sign Out</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
}
