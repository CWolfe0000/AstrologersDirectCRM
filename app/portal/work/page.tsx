"use client";

import { Sprout } from "lucide-react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/ui/misc";
import { useMyWork } from "@/components/portal/portal-data";
import { WorkCard } from "@/components/portal/work-card";
import { workState } from "@/components/client-work/work-meta";

export default function BetweenSessions() {
  const work = useMyWork();
  const responses = useStore((s) => s.workResponses);
  const pr = useStore((s) => s.practitioner);
  const open = work.filter((w) => !workState(w, responses).done);
  const done = work.filter((w) => workState(w, responses).done);
  return (
    <div>
      <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">Between Sessions</h1>
      <p className="mt-1.5 max-w-xl text-[15px] text-muted">
        Assignments, journaling prompts, goals and activities from {pr.firstName || "your astrologer"}. Write as much or as little as you like: only you and {pr.firstName || "your astrologer"} can see it.
      </p>
      {work.length === 0 ? (
        <EmptyState className="mt-6 rounded-2xl border border-dashed border-line bg-surface" icon={<Sprout />} title="Nothing here yet" body={`When ${pr.firstName || "your astrologer"} shares something to work on between sessions, it will appear here.`} />
      ) : (
        <div className="mt-6 space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-[22px] text-ink">To work on</h2>
              <div className="space-y-3">
                {open.map((w) => (
                  <WorkCard key={w.id} w={w} />
                ))}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-[22px] text-ink">Done</h2>
              <div className="space-y-3">
                {done.map((w) => (
                  <WorkCard key={w.id} w={w} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
