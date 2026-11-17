"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, Lock, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, fmtDate, fmtLong, relTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { sameId, useMyWork, usePractitionerFor, PORTAL_NOW } from "@/components/portal/portal-data";
import { isOverdue, kindMeta, workState } from "@/components/client-work/work-meta";

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const work = useMyWork().find((w) => sameId(w.id, id));
  const responses = useStore((s) => s.workResponses);
  const consultation = useStore((s) => s.consultations.find((k) => k.id === work?.consultationId));
  const pr = usePractitionerFor(work);
  const respond = useStore((s) => s.respondToWork);
  const toast = useStore((s) => s.toast);
  const [text, setText] = React.useState("");
  const who = pr.firstName || "your astrologer";

  if (!work) {
    return (
      <EmptyState
        className="rounded-2xl border border-line bg-surface"
        icon={<Lock />}
        title="This Isn’t Available"
        body="It may not have been shared with you, or it has been archived."
        action={<Link href="/portal/work" className="text-sm font-medium text-accent hover:underline">Back to Between Sessions</Link>}
      />
    );
  }
  const st = workState(work, responses);
  const meta = kindMeta(work.kind);
  const overdue = isOverdue(work, st.done, PORTAL_NOW.slice(0, 10));
  const label = `${meta.respond[0]}${meta.respond.slice(1)}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/portal/work" className="inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Between Sessions
      </Link>
      <div className="mt-4 rounded-2xl border border-line bg-surface p-6 md:p-8">
        <p className="flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-wide text-accent">
          <meta.icon className="size-4" aria-hidden /> {meta.label}
        </p>
        <h1 className="mt-2 font-serif text-[30px] leading-tight text-ink md:text-[36px]">{work.title}</h1>
        <p className={cn("mt-2 text-[14px]", overdue ? "text-[#8A5A14]" : "text-muted")}>
          From {who}
          {work.sharedAt && `, ${fmtDate(work.sharedAt)}`}
          {work.dueDate && !st.done && ` · Suggested by ${fmtLong(work.dueDate)}`}
        </p>
        {work.instructions && <p className="mt-5 whitespace-pre-line text-[16px] leading-relaxed text-ink-3">{work.instructions}</p>}
        {consultation && (
          <p className="mt-5 flex items-center gap-1.5 text-[13px] text-muted">
            <CalendarDays className="size-4" /> From your {consultation.type.toLowerCase()} on {fmtDate(consultation.start)}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {st.done ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-3 py-1 text-[13px] font-medium text-sage-dark">
                <Check className="size-4" /> Done{st.doneAt ? ` · ${relTime(st.doneAt)}` : ""}
              </span>
              {st.doneBy === "client" && (
                <Button variant="ghost" size="sm" onClick={() => respond(work.id, "undone")}>
                  <RotateCcw /> Not Done Yet
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                respond(work.id, "done");
                toast("Marked as done", `${who} will see that you’ve finished.`, "success");
              }}
            >
              <Check /> Mark as Done
            </Button>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-[24px] text-ink">{work.kind === "journal" ? "Your journal" : "Your notes"}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
          <Lock className="size-3.5" /> Only you and {who} can see these.
        </p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            respond(work.id, "entry", text.trim());
            setText("");
            toast("Saved", `${who} can read it now.`, "success");
          }}
        >
          <label htmlFor="entry" className="sr-only">
            {label}
          </label>
          <Textarea id="entry" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={work.kind === "journal" ? "Write what you noticed…" : "Write your response…"} maxLength={10000} className="text-[15px]" />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={!text.trim()}>
              {label}
            </Button>
          </div>
        </form>
        {st.entries.length > 0 && (
          <ol className="mt-6 space-y-3">
            {[...st.entries].reverse().map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{r.text}</p>
                <p className="mt-2 text-[12px] text-muted">{fmtLong(r.createdAt.slice(0, 10))} · {relTime(r.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
