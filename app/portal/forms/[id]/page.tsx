"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import { IntakeFill } from "@/components/intake/intake-fill";
import { sameId, usePractitionerFor } from "@/components/portal/portal-data";

/** An intake form from the client's astrologer: fill it in, or see that it's been sent. */
export default function PortalForm() {
  const { id } = useParams<{ id: string }>();
  const req = useStore((s) => s.intakeRequests.find((r) => sameId(r.id, id)));
  const me = useStore((s) => s.people[0]);
  const preview = useStore((s) => !!s.session.preview);
  const pr = usePractitionerFor(req);
  const back = <Link href="/portal" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Home</Link>;

  if (!req)
    return <EmptyState className="rounded-2xl border border-line bg-surface" icon={<Lock />} title="This Form Isn’t Available" body="It may have been withdrawn by your astrologer." action={<Link href="/portal" className="text-sm font-medium text-accent hover:underline">Back to Home</Link>} />;

  if (req.status === "submitted")
    return (
      <div className="space-y-6">
        {back}
        <EmptyState className="rounded-2xl border border-line bg-surface" icon={<CheckCircle2 />} title={req.title} body={`You sent this to ${pr?.firstName || "your astrologer"}${req.submittedAt ? ` on ${fmtDate(req.submittedAt)}` : ""}. To change anything, send them a message.`} action={<Link href="/portal/messages" className="text-sm font-medium text-accent hover:underline">Message Your Astrologer</Link>} />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {back}
      <p className="text-[13px] text-muted">From {pr?.name || "your astrologer"}</p>
      <IntakeFill
        title={req.title}
        intro={req.intro}
        sections={req.sections}
        knownBirth={me?.birth}
        onSubmit={async (answers) => {
          if (preview) throw new Error("This is a preview of the client’s portal: forms can’t be sent from here.");
          await api(`/api/v1/portal/intake/${encodeURIComponent(req.id)}`, { body: { answers } });
          useStore.setState((s) => ({ intakeRequests: s.intakeRequests.map((r) => (r.id === req.id ? { ...r, status: "submitted", submittedAt: new Date().toISOString().slice(0, 19), answers } : r)) }));
        }}
      />
    </div>
  );
}
