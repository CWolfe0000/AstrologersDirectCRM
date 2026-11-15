"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Inbox, FileClock, CheckCircle2, AlertTriangle, ChevronRight, Eye, Mail, Lock, Download, RotateCcw } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader, EmptyState, FileKindIcon, KIND_LABEL, StatCard, SimulatedNote } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Reading } from "@/lib/data/types";
import { cn, fmtDate, relDay } from "@/lib/utils";
import { NewDeliveryDialog } from "./new-delivery";
import { ReadingDetail } from "./reading-detail";
import Link from "next/link";

type Q = "draft" | "ready" | "delivered" | "attention";
const QUEUES: { id: Q; label: string; icon: React.ElementType; test: (r: Reading) => boolean }[] = [
  { id: "draft", label: "Drafts", icon: FileClock, test: (r) => r.status === "draft" },
  { id: "ready", label: "Ready to send", icon: Inbox, test: (r) => r.status === "ready" },
  { id: "delivered", label: "Delivered", icon: CheckCircle2, test: (r) => r.status === "delivered" },
  { id: "attention", label: "Failed or pending", icon: AlertTriangle, test: (r) => r.status === "failed" || (r.status === "delivered" && r.notification === "pending") },
];

export function DeliveryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const readings = useStore((s) => s.readings);
  const people = useStore((s) => s.people);
  const charts = useStore((s) => s.charts);
  const deliver = useStore((s) => s.deliverReading);
  const toast = useStore((s) => s.toast);
  const [queue, setQueue] = React.useState<Q>("ready");
  const [q, setQ] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(params.get("new") === "1");
  const selectedId = params.get("id");

  React.useEffect(() => {
    if (params.get("new") === "1") setNewOpen(true);
  }, [params]);

  // open the queue containing the selected reading
  React.useEffect(() => {
    const r = readings.find((x) => x.id === selectedId);
    if (r) setQueue(r.status === "failed" ? "attention" : (r.status as Q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const name = (id: string) => personName(people.find((p) => p.id === id));
  const select = (id: string | null) => router.replace(`/app/delivery${id ? "?id=" + id : ""}`, { scroll: false });
  const matches = (r: Reading) => !q || (r.title + " " + name(r.clientId)).toLowerCase().includes(q.toLowerCase());
  const current = QUEUES.find((x) => x.id === queue)!;
  const list = readings.filter(current.test).filter(matches).sort((a, b) => (b.deliveredAt ?? b.createdAt).localeCompare(a.deliveredAt ?? a.createdAt));
  const history = readings.filter((r) => r.status === "delivered").filter(matches).sort((a, b) => (b.deliveredAt ?? "").localeCompare(a.deliveredAt ?? ""));

  const delivered30 = readings.filter((r) => r.status === "delivered" && (r.deliveredAt ?? "") >= "2026-10-15").length;
  const openRate = (() => {
    const d = readings.filter((r) => r.status === "delivered");
    return d.length ? Math.round((d.filter((r) => r.notification === "opened").length / d.length) * 100) : 0;
  })();

  const quickSend = (r: Reading) => {
    deliver(r.id);
    toast("Reading delivered", `${name(r.clientId)} has been notified.`, "success");
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Reading Delivery" }]}
        title="Reading Delivery"
        description="Deliver finished readings, recordings and links securely to each client's private portal."
        actions={<Button onClick={() => setNewOpen(true)}><Send /> New delivery</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ready to send" value={readings.filter((r) => r.status === "ready").length} sub="Prepared and waiting" icon={<Inbox />} />
        <StatCard label="Drafts" value={readings.filter((r) => r.status === "draft").length} sub="Need a file or a final check" icon={<FileClock />} />
        <StatCard label="Delivered · 30 days" value={delivered30} sub={`${readings.filter((r) => r.status === "delivered").length} all time`} icon={<CheckCircle2 />} />
        <StatCard label="Opened by clients" value={`${openRate}%`} sub="Of delivered readings" icon={<Eye />} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 pt-3 md:flex-row md:items-end md:justify-between">
          <Tabs value={queue} onValueChange={(v) => setQueue(v as Q)}>
            <TabsList className="border-b-0">
              {QUEUES.map((x) => {
                const n = readings.filter(x.test).length;
                return (
                  <TabsTrigger key={x.id} value={x.id}>
                    <x.icon className={cn(x.id === "attention" && n > 0 && "text-danger")} />
                    {x.label}
                    <span className={cn("rounded-full px-1.5 text-[11px]", x.id === "attention" && n > 0 ? "bg-danger-50 text-danger" : "bg-canvas-2 text-muted")}>{n}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {/* The list below is the panel for every tab; empty panels keep the tab ↔ panel links valid. */}
            {QUEUES.map((x) => <TabsContent key={x.id} value={x.id} />)}
          </Tabs>
          <div className="pb-3 md:w-64"><SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search readings or clients…" /></div>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={<current.icon />} title={`No ${current.label.toLowerCase()}`} body="Deliveries move through these queues as you prepare and send them." action={<Button size="sm" variant="secondary" onClick={() => setNewOpen(true)}>New delivery</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((r) => {
              const chart = charts.find((c) => c.id === r.chartId);
              return (
                <li key={r.id} className={cn("flex items-center gap-3 px-4 py-3 hover:bg-canvas/60", selectedId === r.id && "bg-accent-50/40")}>
                  <button onClick={() => select(r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <FileKindIcon kind={r.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                      <p className="truncate text-[12px] text-muted">
                        {name(r.clientId)} · {KIND_LABEL[r.kind]}
                        {chart ? ` · ${chart.title}` : ""}
                      </p>
                      {r.status === "failed" && <p className="mt-0.5 truncate text-[12px] text-danger">{r.failureReason}</p>}
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <StatusBadge status={r.status} />
                      <span className="text-[11.5px] text-muted">{r.deliveredAt ? `Sent ${relDay(r.deliveredAt)}` : `Created ${relDay(r.createdAt)}`}</span>
                    </div>
                  </button>
                  {r.status === "ready" && <Button size="sm" onClick={() => quickSend(r)} className="hidden md:inline-flex"><Send /> Send</Button>}
                  {r.status === "failed" && <Button size="sm" variant="secondary" onClick={() => select(r.id)} className="hidden md:inline-flex"><RotateCcw /> Retry</Button>}
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <SimulatedNote className="mt-4">
        Deliveries are simulated — no email is sent. Readings delivered to <strong>Amelia Hart</strong> appear in the demo{" "}
        <Link href="/portal" className="font-medium underline">client portal</Link>, together with a notification.
      </SimulatedNote>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Delivery history" description="Every reading shared with clients, with access and notification status." />
        {/* desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas/60 text-[11.5px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Delivered</th>
                <th className="px-3 py-2.5 font-semibold">Reading</th>
                <th className="px-3 py-2.5 font-semibold">Client</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Access</th>
                <th className="px-5 py-2.5 font-semibold">Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.map((r) => (
                <tr key={r.id} onClick={() => select(r.id)} className="cursor-pointer hover:bg-canvas/60">
                  <td className="whitespace-nowrap px-5 py-3 text-muted">{fmtDate(r.deliveredAt!)}</td>
                  <td className="max-w-[260px] truncate px-3 py-3 font-medium">{r.title}</td>
                  <td className="whitespace-nowrap px-3 py-3">{name(r.clientId)}</td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-2"><FileKindIcon kind={r.kind} className="size-6 rounded-md [&_svg]:size-3.5" />{KIND_LABEL[r.kind]}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      {r.kind === "link" ? <><Eye className="size-3.5" /> Link</> : r.allowDownload ? <><Download className="size-3.5" /> Download</> : <><Lock className="size-3.5" /> Stream only</>}
                      {r.expiresAt && <span>· until {fmtDate(r.expiresAt)}</span>}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <StatusBadge status={r.notification} />
                      {r.openedAt && <span className="text-[11.5px] text-muted">{fmtDate(r.openedAt)}</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* mobile cards */}
        <ul className="divide-y divide-line md:hidden">
          {history.map((r) => (
            <li key={r.id}>
              <button onClick={() => select(r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <FileKindIcon kind={r.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                  <p className="text-[12px] text-muted">{name(r.clientId)} · {fmtDate(r.deliveredAt!)}</p>
                </div>
                <span className="flex items-center gap-1 text-[11.5px] text-muted">{r.notification === "opened" ? <Eye className="size-3.5" /> : <Mail className="size-3.5" />}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && select(null)} title="Delivery" description="Status, access and client view" width="max-w-xl">
        <div className="p-5 md:p-6">{selectedId && <ReadingDetail id={selectedId} onClose={() => select(null)} />}</div>
      </Sheet>

      <NewDeliveryDialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o && params.get("new")) router.replace("/app/delivery", { scroll: false });
        }}
        defaultClientId={params.get("client") ?? undefined}
        defaultChartId={params.get("chart") ?? undefined}
        onDone={(r) => select(r.id)}
      />
    </div>
  );
}
