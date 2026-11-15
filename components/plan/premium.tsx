"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Gem, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { PREMIUM_FEATURES } from "@/lib/plan";
import { cn, DATA_MODE } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

/** Whether this practice has Premium. The demo shows everything. */
export function usePremium() {
  const plan = useStore((s) => s.plan);
  return DATA_MODE === "demo" || plan === "premium";
}

export function PremiumBadge({ className, locked }: { className?: string; locked?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-[#E6D3B3] bg-[#FBF4E8] px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide text-[#7A5A1E]", className)}>
      {locked ? <Lock className="size-2.5" aria-hidden /> : <Gem className="size-2.5" aria-hidden />}
      Premium
    </span>
  );
}

/** Shown in place of a Premium feature for practices on the standard plan. */
export function PremiumGate({ feature, description, className }: { feature: string; description?: string; className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_260px] md:p-8">
        <div>
          <PremiumBadge locked />
          <h2 className="mt-3 font-serif text-[26px] leading-tight text-ink">{feature} is part of Premium</h2>
          <p className="mt-2 max-w-xl text-[14px] text-muted">
            {description ?? "Your plan includes natal and synastry charts with their aspects and grids, and every practice tool. Premium adds the timing techniques and the convergence timeline."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href="/app/settings?section=subscription">See your plan</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Ask about Premium
            </ButtonLink>
          </div>
          <p className="mt-3 text-[12px] text-muted">Online upgrades arrive with billing. During the beta, we can switch Premium on for you.</p>
        </div>
        <ul className="space-y-2 rounded-xl border border-line bg-canvas p-4 text-[13px] text-ink">
          <li className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Premium includes</li>
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="size-3.5 text-sage-dark" aria-hidden /> {f}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/** Inline link-style notice for small places (menus, cards). */
export function PremiumNote({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/app/settings?section=subscription" className="inline-flex items-center gap-1.5 text-[12px] text-[#7A5A1E] hover:underline">
      <Lock className="size-3" aria-hidden /> {children}
    </Link>
  );
}
