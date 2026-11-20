"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn, DATA_MODE } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import { Conversation, type Msg } from "@/components/messages/conversation";
import { refreshUnread } from "@/components/messages/unread";

type Conv = { practiceId: string; astrologer: { name: string; firstName: string; practice: string }; messages: Msg[]; unread: number };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <PortalMessages />
    </React.Suspense>
  );
}

/** The client's messages with their astrologer (one conversation per astrologer). */
function PortalMessages() {
  const params = useSearchParams();
  const preview = useStore((s) => !!s.session.preview);
  const [convs, setConvs] = React.useState<Conv[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState<string | null>(params.get("practice"));

  const load = React.useCallback(async () => {
    try {
      const r = await api<{ conversations: Conv[] }>("/api/v1/portal/messages");
      setConvs(r.conversations);
      setError(null);
      return r.conversations;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (DATA_MODE !== "server" || preview) return;
    void load();
    const id = setInterval(() => document.visibilityState === "visible" && void load(), 15_000);
    return () => clearInterval(id);
  }, [load, preview]);

  const current = convs?.find((c) => c.practiceId === open) ?? (convs && convs.length === 1 ? convs[0] : undefined);
  // Opening a conversation marks the astrologer's messages as read.
  React.useEffect(() => {
    if (!current || !current.unread) return;
    void api("/api/v1/portal/messages/read", { body: { practiceId: current.practiceId } }).then(() => { void refreshUnread("portal"); void load(); });
  }, [current?.practiceId, current?.unread, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const header = <h1 className="font-serif text-[34px] leading-tight text-ink md:text-[40px]">Messages</h1>;
  if (DATA_MODE !== "server" || preview)
    return (<div className="space-y-6">{header}<EmptyState icon={<MessagesSquare />} title={preview ? "Messages Aren’t Shown in a Preview" : "Messages Work in Your Live Portal"} body={preview ? "Your client’s messages with you are in Messages in the app." : "Once you’re signed in to your portal, you can message your astrologer here."} /></div>);

  return (
    <div className="space-y-6">
      {header}
      <p className="-mt-3 text-[14px] text-muted">Private messages with your astrologer. You’ll also get an email when they write to you.</p>
      {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
      {convs === null ? (
        <p className="text-[13px] text-muted">Loading…</p>
      ) : convs.length === 0 ? (
        <EmptyState icon={<MessagesSquare />} title="No Astrologer Yet" body="Messages appear here once an astrologer invites you to their portal." />
      ) : (
        <div className={cn("grid min-h-[520px] overflow-hidden rounded-2xl border border-line bg-surface", convs.length > 1 && "md:grid-cols-[260px_minmax(0,1fr)]")}>
          {convs.length > 1 && (
            <ul className="divide-y divide-line border-line md:border-r">
              {convs.map((c) => (
                <li key={c.practiceId}>
                  <button type="button" onClick={() => setOpen(c.practiceId)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas-2", current?.practiceId === c.practiceId && "bg-canvas-2")}>
                    <Avatar name={c.astrologer.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{c.astrologer.name}</span>
                      <span className="block truncate text-[12px] text-muted">{c.astrologer.practice}</span>
                    </span>
                    {c.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[10.5px] font-bold text-white">{c.unread}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {current ? (
            <section className="flex min-h-[520px] flex-col">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <Avatar name={current.astrologer.name} />
                <div>
                  <p className="font-medium text-ink">{current.astrologer.name}</p>
                  <p className="text-[12px] text-muted">{current.astrologer.practice}</p>
                </div>
              </div>
              <Conversation
                messages={current.messages}
                me="client"
                theirName={current.astrologer.firstName}
                onSend={async (body) => {
                  const r = await api<{ message: Msg }>("/api/v1/portal/messages", { body: { practiceId: current.practiceId, body } });
                  setConvs((cs) => cs?.map((c) => (c.practiceId === current.practiceId ? { ...c, messages: [...c.messages, r.message] } : c)) ?? cs);
                }}
              />
            </section>
          ) : (
            <div className="flex items-center justify-center p-8 text-[13.5px] text-muted">Choose an astrologer to message.</div>
          )}
        </div>
      )}
    </div>
  );
}
