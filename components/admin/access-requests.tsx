"use client";

import * as React from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Req = { id: string; email: string; name: string; practice: string; website: string; experience: string; about: string; status: "pending" | "approved" | "declined" | "joined"; createdAt: string; decidedAt: string | null; invited: boolean };
const TONE = { pending: "warn", approved: "info", declined: "outline", joined: "sage" } as const;

/** Admin: beta access requests, and whether sign-up needs approval. */
export function AccessRequests() {
  const toast = useStore((s) => s.toast);
  const [d, setD] = React.useState<{ requests: Req[]; inviteOnly: boolean; forced: boolean } | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [show, setShow] = React.useState<"pending" | "all">("pending");
  const load = React.useCallback(() => {
    api<{ requests: Req[]; inviteOnly: boolean; forced: boolean }>("/api/admin/access-requests").then(setD, () => {});
  }, []);
  React.useEffect(load, [load]);
  if (!d) return null;

  const decide = async (r: Req, action: "approve" | "decline") => {
    setBusy(r.id);
    try {
      await api(`/api/admin/access-requests/${r.id}`, { body: { action } });
      toast(action === "approve" ? "Invitation Sent" : "Request Declined", action === "approve" ? `${r.name} has their sign-up link.` : `${r.name} wasn’t emailed.`, "success");
      load();
    } catch (e) {
      toast("Couldn’t Update", (e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };
  const pending = d.requests.filter((r) => r.status === "pending");
  const rows = show === "pending" ? pending : d.requests;

  return (
    <section className="mb-8 rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Beta Requests {pending.length > 0 && <Badge tone="warn" className="ml-1">{pending.length} waiting</Badge>}</h2>
          <p className="text-[12.5px] text-muted">Approving emails a single-use link to create an account. Declining sends nothing.</p>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-3">
          Sign-up needs approval
          <Switch
            checked={d.inviteOnly}
            disabled={d.forced}
            aria-label="Sign-Up Needs Approval"
            onCheckedChange={async (v) => {
              await api("/api/admin/settings", { method: "PUT", body: { inviteOnly: v } });
              load();
            }}
          />
        </label>
      </div>
      {d.forced && <p className="border-b border-line px-4 py-2 text-[12px] text-muted">Set to on for this site by the BETA_INVITE_ONLY setting.</p>}
      <div className="flex gap-1 px-4 pt-3 text-[12.5px]">
        {(["pending", "all"] as const).map((x) => (
          <button key={x} type="button" aria-pressed={show === x} onClick={() => setShow(x)} className={`rounded-md px-2.5 py-1 ${show === x ? "bg-canvas-2 font-medium text-ink" : "text-muted hover:text-ink"}`}>
            {x === "pending" ? `Waiting (${pending.length})` : `All (${d.requests.length})`}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-muted">{show === "pending" ? "No requests waiting." : "No requests yet."}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-ink">
                  {r.name} <span className="font-normal text-muted">· {r.email}</span> <Badge tone={TONE[r.status]} className="ml-1 capitalize">{r.status}</Badge>
                </p>
                <p className="text-[12.5px] text-muted">
                  {[r.practice, r.experience, `Requested ${fmtDate(r.createdAt.slice(0, 10))}`].filter(Boolean).join(" · ")}
                  {r.website && (
                    <>
                      {" · "}
                      <a href={/^https?:\/\//.test(r.website) ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-0.5 text-accent hover:underline">{r.website.replace(/^https?:\/\//, "")}<ExternalLink className="size-3" /></a>
                    </>
                  )}
                </p>
                {r.about && <p className="mt-1 whitespace-pre-line text-[13px] text-ink-3">{r.about}</p>}
              </div>
              {r.status !== "joined" && (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => decide(r, "approve")}><Check /> {r.status === "approved" ? "Resend Link" : "Approve"}</Button>
                  {r.status !== "declined" && <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => decide(r, "decline")}><X /> Decline</Button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
