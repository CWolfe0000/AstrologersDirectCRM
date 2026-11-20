"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, MessagesSquare, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useStore, personName } from "@/lib/store";
import { flushNow } from "@/lib/sync";
import { cn, DATA_MODE } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Conversation, type Msg } from "@/components/messages/conversation";
import { refreshUnread } from "@/components/messages/unread";

type Thread = { clientId: string; name: string; at: string; unread: number; last: Msg | null };
const ago = (iso: string) => {
  const d = (Date.now() - Date.parse(iso)) / 60_000;
  if (d < 1) return "Now";
  if (d < 60) return `${Math.round(d)}m`;
  if (d < 1440) return `${Math.round(d / 60)}h`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <MessagesPage />
    </React.Suspense>
  );
}

/** Messages with clients: conversations on the left, the open one on the right. */
function MessagesPage() {
  const params = useSearchParams();
  const router = useRouter();
  const clients = useStore((s) => s.clients);
  const people = useStore((s) => s.people);
  const toast = useStore((s) => s.toast);
  const [threads, setThreads] = React.useState<Thread[] | null>(null);
  const [open, setOpen] = React.useState<string | null>(params.get("client"));
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [q, setQ] = React.useState("");

  const loadThreads = React.useCallback(async () => {
    try { setThreads((await api<{ threads: Thread[] }>("/api/v1/messages")).threads); } catch { setThreads([]); }
  }, []);
  const loadThread = React.useCallback(async (clientId: string, markRead = true) => {
    const r = await api<{ messages: Msg[] }>(`/api/v1/messages?clientId=${encodeURIComponent(clientId)}`);
    setMessages(r.messages);
    if (markRead && r.messages.some((m) => m.from === "client" && !m.readAt)) {
      await api("/api/v1/messages/read", { body: { clientId } });
      void refreshUnread("app");
      void loadThreads();
    }
  }, [loadThreads]);

  React.useEffect(() => {
    if (DATA_MODE !== "server") return;
    void loadThreads();
    const id = setInterval(() => document.visibilityState === "visible" && void loadThreads(), 30_000);
    return () => clearInterval(id);
  }, [loadThreads]);
  React.useEffect(() => {
    if (!open || DATA_MODE !== "server") return;
    setMessages([]);
    void loadThread(open);
    const id = setInterval(() => document.visibilityState === "visible" && void loadThread(open), 15_000);
    return () => clearInterval(id);
  }, [open, loadThread]);

  if (DATA_MODE !== "server")
    return (<div><PageHeader title="Messages" /><EmptyState icon={<MessagesSquare />} title="Messaging Needs Your Live Practice" body="Messages are sent between you and clients in their portal, so they work once you’re signed in to your practice (not in the demo)." /></div>);

  const name = (id: string) => { const p = people.find((x) => x.id === id); return p ? personName(p) : threads?.find((t) => t.clientId === id)?.name ?? "Client"; };
  const client = open ? clients.find((c) => c.id === open) : undefined;
  const startable = clients.filter((c) => c.status !== "archived" && !threads?.some((t) => t.clientId === c.id)).sort((a, b) => name(a.id).localeCompare(name(b.id)));
  const shown = (threads ?? []).filter((t) => !q.trim() || t.name.toLowerCase().includes(q.trim().toLowerCase()));
  const select = (id: string) => { setOpen(id); router.replace(`/app/messages?client=${encodeURIComponent(id)}`, { scroll: false }); };
  const invite = async () => {
    if (!open) return;
    try {
      await flushNow();
      await api("/api/v1/portal/invite", { body: { clientId: open } });
      useStore.setState((st) => ({ clients: st.clients.map((c) => (c.id === open ? { ...c, portalAccess: "invited" } : c)) }));
      toast("Portal Invitation Sent", `${name(open)} will receive an email with a link to their portal.`, "success");
    } catch (e) {
      toast("Invitation Not Sent", (e as Error).message, "error");
    }
  };

  return (
    <div>
      <PageHeader title="Messages" description="Private messages with clients. They read and reply in their portal; each new message also reaches them by email." />
      <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={cn("flex min-h-0 flex-col border-line lg:border-r", open && "hidden lg:flex")}>
          <div className="space-y-2 border-b border-line p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Search conversations" placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select aria-label="Start a conversation" value="" onChange={(e) => e.target.value && select(e.target.value)}>
              <option value="">New Message To…</option>
              {startable.map((c) => <option key={c.id} value={c.id}>{name(c.id)}</option>)}
            </Select>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {threads === null ? <li className="p-4 text-[13px] text-muted">Loading…</li> : shown.length === 0 ? <li className="p-4 text-[13px] text-muted">{threads.length ? "No conversations match." : "No conversations yet. Start one above."}</li> : shown.map((t) => (
              <li key={t.clientId}>
                <button type="button" onClick={() => select(t.clientId)} className={cn("flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-canvas-2", open === t.clientId && "bg-canvas-2")}>
                  <Avatar name={t.name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate text-[13.5px]", t.unread ? "font-semibold text-ink" : "text-ink")}>{t.name}</span>
                      <span className="shrink-0 text-[11px] text-muted">{ago(t.at)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] text-muted">{t.last ? `${t.last.from === "practitioner" ? "You: " : ""}${t.last.body}` : ""}</span>
                      {t.unread > 0 && <span className="ml-auto shrink-0 rounded-full bg-accent px-1.5 text-[10.5px] font-bold text-white">{t.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className={cn("flex min-h-[560px] flex-col", !open && "hidden lg:flex")}>
          {!open ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-[13.5px] text-muted">Choose a conversation, or start a new one.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button type="button" className="text-[13px] text-muted hover:text-ink lg:hidden" onClick={() => { setOpen(null); router.replace("/app/messages"); }}>← All</button>
                <Avatar name={name(open)} />
                <div className="min-w-0 flex-1">
                  <Link href={`/app/clients/${open}`} className="font-medium text-ink hover:text-accent">{name(open)}</Link>
                  <p className="text-[12px] text-muted">{client?.portalAccess === "active" ? "In the client portal" : client?.portalAccess === "invited" ? "Portal invitation sent, not yet accepted" : "Not in the client portal yet"}</p>
                </div>
              </div>
              {client && client.portalAccess !== "active" && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-canvas-2 px-4 py-2.5 text-[12.5px] text-ink-3">
                  <span>{name(open).split(" ")[0]} will see your messages once they open their portal{client.portalAccess === "invited" ? " from the invitation" : ""}.</span>
                  <Button size="sm" variant="secondary" onClick={invite}><KeyRound /> {client.portalAccess === "invited" ? "Resend Invitation" : "Send Portal Invitation"}</Button>
                </div>
              )}
              <Conversation
                messages={messages}
                me="practitioner"
                theirName={name(open).split(" ")[0] || "your client"}
                onSend={async (body) => {
                  const r = await api<{ message: Msg }>("/api/v1/messages", { body: { clientId: open, body } });
                  setMessages((m) => [...m, r.message]);
                  void loadThreads();
                }}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
