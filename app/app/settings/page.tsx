"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Building2, CircleDot, Bell, Shield, CreditCard, Database, CalendarCheck, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/misc";
import { Select } from "@/components/ui/input";
import { BookingSection } from "@/components/settings/booking-section";
import { IntakeFormsSection } from "@/components/settings/intake-forms";
import { ProfileSection, PracticeSection, AstrologySection, NotificationsSection, SecuritySection, SubscriptionSection, DataSection } from "@/components/settings/sections";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User, C: ProfileSection },
  { id: "practice", label: "Practice", icon: Building2, C: PracticeSection },
  { id: "astrology", label: "Astrology Defaults", icon: CircleDot, C: AstrologySection },
  { id: "intake", label: "Intake Forms", icon: ClipboardList, C: IntakeFormsSection },
  { id: "booking", label: "Booking", icon: CalendarCheck, C: BookingSection },
  { id: "notifications", label: "Notifications", icon: Bell, C: NotificationsSection },
  { id: "security", label: "Security", icon: Shield, C: SecuritySection },
  { id: "subscription", label: "Subscription", icon: CreditCard, C: SubscriptionSection },
  { id: "data", label: "Data", icon: Database, C: DataSection },
];

export default function SettingsPage() {
  return (
    <React.Suspense fallback={null}>
      <Settings />
    </React.Suspense>
  );
}

function Settings() {
  const router = useRouter();
  const params = useSearchParams();
  const current = SECTIONS.find((s) => s.id === params.get("section")) ?? SECTIONS[0]!;
  const go = (id: string) => router.replace(`/app/settings?section=${id}`, { scroll: false });
  const C = current.C;
  return (
    <div>
      <PageHeader title="Settings" description="Your profile, practice configuration and chart defaults." breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Settings" }, { label: current.label }]} />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="lg:hidden">
          <Select value={current.id} onChange={(e) => go(e.target.value)} aria-label="Settings section">
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </div>
        <nav className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => go(s.id)}
                  className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors", current.id === s.id ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-muted hover:bg-canvas-2 hover:text-ink")}
                >
                  <s.icon className={cn("size-4", current.id === s.id ? "text-accent" : "")} /> {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 max-w-3xl">
          <C />
        </div>
      </div>
    </div>
  );
}
