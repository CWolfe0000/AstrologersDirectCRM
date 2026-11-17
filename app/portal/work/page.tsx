"use client";

import { Sprout } from "lucide-react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/ui/misc";
import { joinNames, practiceOf, useMyWork, usePortalPractices } from "@/components/portal/portal-data";
import * as React from "react";
import { cn } from "@/lib/utils";
import { WorkCard } from "@/components/portal/work-card";
import { workState } from "@/components/client-work/work-meta";

export default function BetweenSessions() {
  const all = useMyWork();
  const responses = useStore((s) => s.workResponses);
  const practices = usePortalPractices();
  const [from, setFrom] = React.useState("");
  const work = from ? all.filter((w) => practiceOf(w) === from) : all;
  const names = joinNames(practices.map((p) => p.firstName)) || "your astrologer";
  const open = work.filter((w) => !workState(w, responses).done);
  const done = work.filter((w) => workState(w, responses).done);
  return (
    <div>
      <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">Between Sessions</h1>
      <p className="mt-1.5 max-w-xl text-[15px] text-muted">
        Assignments, journaling prompts, goals and activities from {names}. Write as much or as little as you like: only you and the astrologer who shared it can see what you write.
      </p>
      {practices.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by astrologer">
          {[{ id: "", label: "Everyone" }, ...practices.map((p) => ({ id: p.id, label: p.name || p.practice }))].map((o) => (
            <button key={o.id || "all"} type="button" aria-pressed={from === o.id} onClick={() => setFrom(o.id)} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] transition-colors", from === o.id ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-3 hover:border-line-strong")}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {work.length === 0 ? (
        <EmptyState className="mt-6 rounded-2xl border border-dashed border-line bg-surface" icon={<Sprout />} title="Nothing Here Yet" body={`When ${from ? practices.find((p) => p.id === from)?.firstName || "your astrologer" : names} shares something to work on between sessions, it will appear here.`} />
      ) : (
        <div className="mt-6 space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-[22px] text-ink">To Work On</h2>
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
