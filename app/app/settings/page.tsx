"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, Bell, Building2, CalendarCheck, CircleDot, ClipboardList, CreditCard, Database, Globe, Shield, UserRound, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/misc";
import { Select } from "@/components/ui/input";
import { BookingPageSection, ServicesSection } from "@/components/settings/booking-section";
import { IntakeFormsSection } from "@/components/settings/intake-forms";
import { PaymentsSection } from "@/components/settings/payments-section";
import { YourProfileSection } from "@/components/settings/profile-section";
import { AstrologySection, DataSection, NotificationsSection, PracticeSection, SecuritySection, SubscriptionSection, TimelineSection } from "@/components/settings/sections";

/**
 * Settings, grouped the way people look for things: you, your practice, your
 * charts, your account. Each piece of information is asked for in one place.
 */
const GROUPS = [
  {
    label: "You",
    sections: [
      { id: "profile", label: "Your Profile", icon: UserRound, C: YourProfileSection, description: "Your photo, name, headline, bio, contact details and links. Your booking page, client portal and readings all use them." },
      { id: "security", label: "Sign-In & Security", icon: Shield, C: SecuritySection, description: "Your sign-in email, password, two-step verification and signed-in devices." },
      { id: "notifications", label: "Notifications", icon: Bell, C: NotificationsSection, description: "Client reminders, your calendar feed and emails from AstrologersDirect." },
    ],
  },
  {
    label: "Your Practice",
    sections: [
      { id: "practice", label: "Practice", icon: Building2, C: PracticeSection, description: "Your practice name, time zone and client portal color." },
      { id: "booking", label: "Booking Page", icon: Globe, C: BookingPageSection, description: "Turn online booking on, choose your page address, and decide who can find it." },
      { id: "services", label: "Services & Availability", icon: CalendarCheck, C: ServicesSection, description: "What clients can book, your weekly hours, booking rules and how sessions happen." },
      { id: "payments", label: "Payments", icon: Banknote, C: PaymentsSection, description: "Get paid when clients book, through your own Stripe account, and set your cancellation and refund policy." },
      { id: "intake", label: "Intake Forms", icon: ClipboardList, C: IntakeFormsSection, description: "Questions clients answer before a session. Link a form to a service and it goes out when someone books." },
    ],
  },
  {
    label: "Charts",
    sections: [
      { id: "astrology", label: "Chart Defaults", icon: CircleDot, C: AstrologySection, description: "House system, zodiac, wheel style and colors, aspects, orbs and points for new charts. Any chart can change them for itself." },
      { id: "timeline", label: "Timeline", icon: Waves, C: TimelineSection, description: "What the Convergence Timeline includes by default." },
    ],
  },
  {
    label: "Account",
    sections: [
      { id: "subscription", label: "Plan", icon: CreditCard, C: SubscriptionSection, description: "Your plan and what it includes." },
      { id: "data", label: "Data & Privacy", icon: Database, C: DataSection, description: "Export or import your records, sample data, privacy, and deleting your practice." },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.sections);
// Links from before the redesign still land in the right place.
const MOVED: Record<string, string> = { "booking-services": "services" };

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
  const asked = params.get("section") ?? "";
  const current = ALL.find((s) => s.id === (MOVED[asked] ?? asked)) ?? ALL[0]!;
  const go = (id: string) => router.replace(`/app/settings?section=${id}`, { scroll: false });
  const C = current.C;
  return (
    <div>
      <PageHeader title="Settings" breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Settings" }, { label: current.label }]} />
      <div className="grid gap-8 lg:grid-cols-[232px_minmax(0,1fr)]">
        <div className="lg:hidden">
          <Select value={current.id} onChange={(e) => go(e.target.value)} aria-label="Settings Section">
            {GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </optgroup>
            ))}
          </Select>
        </div>
        <nav className="hidden lg:block" aria-label="Settings">
          <div className="sticky top-24 space-y-5">
            {GROUPS.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{g.label}</p>
                <ul className="space-y-0.5">
                  {g.sections.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => go(s.id)}
                        aria-current={current.id === s.id ? "page" : undefined}
                        className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors", current.id === s.id ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-3 hover:bg-canvas-2 hover:text-ink")}
                      >
                        <s.icon className={cn("size-4", current.id === s.id ? "text-accent" : "text-muted")} /> {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <div className="min-w-0 max-w-4xl">
          <div className="mb-6">
            <h2 className="font-serif text-[26px] leading-tight text-ink">{current.label}</h2>
            <p className="mt-1 text-[14px] text-muted">{current.description}</p>
          </div>
          <C />
        </div>
      </div>
    </div>
  );
}
