"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { ClientWork } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { cn, fmtShort } from "@/lib/utils";
import { isOverdue, kindMeta, workState } from "@/components/client-work/work-meta";
import { PORTAL_NOW } from "./portal-data";

export function WorkCard({ w }: { w: ClientWork }) {
  const responses = useStore((s) => s.workResponses);
  const st = workState(w, responses);
  const meta = kindMeta(w.kind);
  const overdue = isOverdue(w, st.done, PORTAL_NOW.slice(0, 10));
  return (
    <Link href={`/portal/work/${w.id}`} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong md:p-5">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", st.done ? "bg-sage-50 text-sage-dark" : "bg-accent-50 text-accent")}>
        {st.done ? <Check className="size-5" /> : <meta.icon className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium uppercase tracking-wide text-muted">{meta.label}</span>
        <span className="mt-0.5 block text-[15.5px] font-medium leading-snug text-ink">{w.title}</span>
        <span className={cn("mt-0.5 block text-[13px]", overdue ? "text-[#8A5A14]" : "text-muted")}>
          {st.done ? "Done" : w.dueDate ? `Suggested by ${fmtShort(w.dueDate)}` : "Whenever you’re ready"}
          {st.entries.length > 0 && ` · ${st.entries.length} ${st.entries.length === 1 ? "entry" : "entries"}`}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" />
    </Link>
  );
}
