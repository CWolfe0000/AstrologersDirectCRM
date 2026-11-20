"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type Msg = { id: string; from: "practitioner" | "client"; body: string; at: string; readAt: string | null };

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** A message thread with a composer: my messages on the right, theirs on the left. */
export function Conversation({ messages, me, theirName, onSend, disabled, placeholder }: { messages: Msg[]; me: "practitioner" | "client"; theirName: string; onSend: (body: string) => Promise<void>; disabled?: string | null; placeholder?: string }) {
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const end = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  const lastMine = [...messages].reverse().find((m) => m.from === me);
  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(body);
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-[240px] flex-1 space-y-2 overflow-y-auto px-4 py-4" role="log" aria-label={`Messages with ${theirName}`}>
        {messages.length === 0 && <p className="py-10 text-center text-[13px] text-muted">No messages yet. Say hello to {theirName}.</p>}
        {messages.map((m, i) => {
          const mine = m.from === me;
          const newDay = i === 0 || dayLabel(messages[i - 1]!.at) !== dayLabel(m.at);
          return (
            <React.Fragment key={m.id}>
              {newDay && <p className="pt-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted">{dayLabel(m.at)}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed", mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md border border-line bg-surface text-ink")}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn("mt-0.5 text-right text-[10.5px]", mine ? "text-white/75" : "text-muted")}>{timeLabel(m.at)}</p>
                </div>
              </div>
              {lastMine?.id === m.id && m.readAt && <p className="text-right text-[11px] text-muted">Seen {timeLabel(m.readAt)}</p>}
            </React.Fragment>
          );
        })}
        <div ref={end} />
      </div>
      <div className="border-t border-line p-3">
        {disabled ? (
          <p className="text-[13px] text-muted">{disabled}</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="message-draft">Message</label>
              <textarea
                id="message-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void submit(); } }}
                rows={2}
                maxLength={5000}
                placeholder={placeholder ?? `Write to ${theirName}…`}
                className="min-h-[44px] flex-1 resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              />
              <Button onClick={submit} disabled={!draft.trim() || sending} aria-label="Send message">{sending ? <Loader2 className="animate-spin" /> : <Send />} Send</Button>
            </div>
            <p className="mt-1 text-[11px] text-muted">Ctrl or ⌘ + Enter to send.</p>
            {error && <p className="mt-1 text-[12.5px] text-danger" role="alert">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
