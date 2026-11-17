"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search, ShieldAlert, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Practice = {
  id: string;
  name: string;
  plan: "standard" | "premium";
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  verified: boolean;
  twoFactor: boolean;
  clients: number;
  portalClients: number;
  delivered: number;
  lastSignIn: string | null;
};
type AdminEvent = { id: string; adminEmail: string; action: string; practiceId: string; detail: string | null; at: string };

const ago = (iso: string | null) => {
  if (!iso) return "Never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 30 ? `${days} days ago` : fmtDate(iso.slice(0, 10));
};

export default function AdminPage() {
  const user = useStore((s) => s.session.user);
  const toast = useStore((s) => s.toast);
  const [data, setData] = React.useState<{ practices: Practice[]; events: AdminEvent[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Practice | null>(null);
  const [confirm, setConfirm] = React.useState("");

  const load = React.useCallback(() => {
    api<{ practices: Practice[]; events: AdminEvent[] }>("/api/admin/practices")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);
  React.useEffect(load, [load]);

  if (user && !user.admin) return <PageHeader title="Not found" description="This page doesn’t exist." />;
  if (error)
    return (
      <div>
        <PageHeader title="Admin" />
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-5 text-[14px]">
          <ShieldAlert className="mt-0.5 size-5 text-warn" />
          <div>
            <p className="text-ink">{error}</p>
            {/two-step/i.test(error) && (
              <Link href="/app/settings?section=security" className="mt-2 inline-block text-[13.5px] font-medium text-accent hover:underline">Open Security settings</Link>
            )}
          </div>
        </div>
      </div>
    );
  if (!data) return <PageHeader title="Admin" description="Loading practices…" />;

  const needle = q.trim().toLowerCase();
  const rows = needle ? data.practices.filter((p) => [p.name, p.ownerEmail, p.ownerName].some((v) => v?.toLowerCase().includes(needle))) : data.practices;
  const premium = data.practices.filter((p) => p.plan === "premium").length;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const activeWeek = data.practices.filter((p) => p.lastSignIn && new Date(p.lastSignIn).getTime() > weekAgo).length;
  const newMonth = data.practices.filter((p) => new Date(p.createdAt).getTime() > Date.now() - 30 * 86_400_000).length;

  const setPlan = async (p: Practice, plan: string) => {
    setBusy(p.id);
    try {
      await api(`/api/admin/practices/${p.id}`, { method: "PATCH", body: { plan } });
      toast("Plan updated", `${p.name} is now on ${plan === "premium" ? "Premium" : "Standard"}.`, "success");
      load();
    } catch (e) {
      toast("Couldn’t change the plan", (e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(deleting.id);
    try {
      await api(`/api/admin/practices/${deleting.id}`, { method: "DELETE", body: { confirm } });
      toast("Practice deleted", `${deleting.name} and all its data were removed.`, "success");
      setDeleting(null);
      setConfirm("");
      load();
    } catch (e) {
      toast("Couldn’t delete", (e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Admin" description="Every practice on AstrologersDirect. Counts only: client records stay private to each practice." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Practices" value={data.practices.length} />
        <StatCard label="New in the last 30 days" value={newMonth} />
        <StatCard label="Signed in this week" value={activeWeek} />
        <StatCard label="On Premium" value={premium} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Search practices" placeholder="Search by practice, name or email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[860px] text-left text-[13.5px]">
          <thead className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Practice</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last sign-in</th>
              <th className="px-4 py-3 text-right font-medium">Clients</th>
              <th className="px-4 py-3 text-right font-medium">In portal</th>
              <th className="px-4 py-3 text-right font-medium">Readings sent</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const mine = p.id === useStore.getState().session.practice?.id;
              return (
                <tr key={p.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name || "Untitled practice"} {mine && <Badge tone="outline">You</Badge>}</p>
                    <p className="text-[12.5px] text-muted">
                      {p.ownerName ? `${p.ownerName} · ` : ""}{p.ownerEmail ?? "no owner"}
                      {!p.verified && <span className="ml-1.5 text-warn">· email not confirmed</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-3">{fmtDate(p.createdAt.slice(0, 10))}</td>
                  <td className="px-4 py-3 text-ink-3">{ago(p.lastSignIn)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.clients}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.portalClients}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.delivered}</td>
                  <td className="px-4 py-3">
                    <Select aria-label={`Plan for ${p.name}`} value={p.plan} disabled={busy === p.id} onChange={(e) => setPlan(p, e.target.value)} className="h-8 w-[120px]">
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!mine && (
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${p.name}`} title="Delete practice" onClick={() => { setConfirm(""); setDeleting(p); }}>
                        <Trash2 className="text-danger" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">No practices match “{q}”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.events.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-[22px] text-ink">Admin activity</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-[13px]">
            {data.events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3 px-4 py-2.5">
                <span className="text-muted">{new Date(e.at).toLocaleString()}</span>
                <span className="text-ink">{e.action === "plan" ? "Changed plan" : e.action === "delete" ? "Deleted practice" : e.action}</span>
                <span className="text-ink-3">{e.detail}</span>
                <span className="ml-auto text-muted">{e.adminEmail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent
            size="sm"
            title={`Delete ${deleting.name || "this practice"}?`}
            description="Permanently removes the practice, every record and file, and its client portal logins. This can’t be undone."
            footer={
              <>
                <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
                <Button variant="danger" disabled={busy === deleting.id || confirm.trim().toLowerCase() !== (deleting.ownerEmail ?? deleting.id).toLowerCase()} onClick={remove}>
                  {busy === deleting.id && <Loader2 className="animate-spin" />} Delete permanently
                </Button>
              </>
            }
          >
            <label className="block text-[13.5px] text-ink-3" htmlFor="admin-confirm">
              Type <span className="font-medium text-ink">{deleting.ownerEmail ?? deleting.id}</span> to confirm
            </label>
            <Input id="admin-confirm" className="mt-2" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
