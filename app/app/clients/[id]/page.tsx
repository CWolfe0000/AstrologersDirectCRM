"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { Pencil, CalendarPlus, CircleDot, NotebookPen, Mail, Phone, Cake, Clock, MapPin, AlertTriangle, MoreHorizontal, Archive, ArchiveRestore, Mic, Send, KeyRound, ListPlus, Eye, Waves, MessagesSquare } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { DATA_MODE } from "@/lib/utils";
import { api } from "@/lib/api";
import { flushNow } from "@/lib/sync";
import { cn, fmtDate, fmtClock } from "@/lib/utils";
import { PageHeader, EmptyState, Breadcrumbs } from "@/components/ui/misc";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ClientWorkTab } from "@/components/client-work/client-work-tab";
import { EditClientDialog } from "@/components/clients/dialogs";
import { OverviewTab, ChartsTab, PeopleTab, ConsultationsTab, ObservationsTab, ReadingsTab, FilesTab } from "@/components/clients/profile-tabs";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "charts", label: "Charts" },
  { id: "people", label: "Associated People" },
  { id: "consultations", label: "Consultations" },
  { id: "work", label: "Between Sessions" },
  { id: "observations", label: "Observations" },
  { id: "readings", label: "Readings" },
  { id: "files", label: "Files" },
];

export default function ClientProfilePage() {
  return (
    <React.Suspense fallback={null}>
      <Profile />
    </React.Suspense>
  );
}

function Profile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const s = useStore();
  const client = s.clients.find((c) => c.id === id);
  const person = s.people.find((p) => p.id === id);
  const [editOpen, setEditOpen] = React.useState(false);

  const counts: Record<string, number> = {
    charts: s.charts.filter((c) => c.clientId === id).length,
    people: s.people.filter((p) => p.clientId === id).length,
    consultations: s.consultations.filter((k) => k.clientId === id).length,
    work: s.clientWork.filter((w) => w.clientId === id && w.status !== "archived").length,
    observations: s.observations.filter((o) => o.clientId === id).length,
    readings: s.readings.filter((r) => r.clientId === id).length,
    files: s.files.filter((f) => f.clientId === id).length,
  };

  const setTab = (t: string) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  if (!client || !person) {
    return (
      <div>
        <PageHeader title="Client Not Found" breadcrumbs={[{ label: "Clients", href: "/app/clients" }, { label: "Not Found" }]} />
        <Card>
          <EmptyState title="This Client Doesn't Exist" body="It may have been created in a different browser, or the demo data was reset." action={<ButtonLink href="/app/clients" variant="secondary" size="sm">Back to Clients</ButtonLink>} />
        </Card>
      </div>
    );
  }

  const name = personName(person);
  const b = person.birth;
  const archived = client.status === "archived";

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/app" }, { label: "Clients", href: "/app/clients" }, { label: name }]} className="mb-4" />

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar name={name} size="xl" className="hidden sm:inline-flex" />
            <Avatar name={name} size="lg" className="sm:hidden" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-[28px] leading-tight md:text-[32px]">{name}</h1>
                {client.pronouns && <span className="text-[13px] text-muted">{client.pronouns}</span>}
                <StatusBadge status={client.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-3">
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-accent"><Mail className="size-3.5 text-muted" /> {client.email}</a>
                {client.phone && <span className="flex items-center gap-1.5"><Phone className="size-3.5 text-muted" /> {client.phone}</span>}
                <span className="flex items-center gap-1.5"><KeyRound className="size-3.5 text-muted" /> Portal: {client.portalAccess === "active" ? "active" : client.portalAccess === "invited" ? "invitation sent" : "no access"}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg bg-canvas/80 px-3 py-2 text-[13px]">
                <span className="flex items-center gap-1.5"><Cake className="size-3.5 text-muted" /> {fmtDate(b.date)}</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted" /> {b.timeAccuracy === "unknown" ? "Time unknown" : fmtClock(b.time)}
                  {b.timeAccuracy === "exact" ? (
                    <Badge tone="sage" className="ml-1">Exact</Badge>
                  ) : (
                    <Badge tone="warn" className="ml-1" title="Angles and house placements are uncertain"><AlertTriangle className="size-3" /> {b.timeAccuracy === "approximate" ? "Approximate" : "Unknown"}</Badge>
                  )}
                  {b.rectifiedFrom && <Badge tone="outline" className="ml-1" title={`Rectified${b.rectifiedAt ? ` on ${fmtDate(b.rectifiedAt)}` : ""}; previously ${b.rectifiedFrom}`}>Rectified</Badge>}
                  <Link href={`/app/clients/${client.id}/rectify`} className="ml-1.5 text-[12px] font-medium text-accent hover:underline">Rectify</Link>
                  <Link href={`/app/clients/${client.id}/forecast`} className="ml-1.5 text-[12px] font-medium text-accent hover:underline">Forecast</Link>
                </span>
                <span className="flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0 text-muted" /> <span className="truncate">{b.place}</span></span>
              </div>
              {client.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {client.tags.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-[340px] lg:justify-end">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Pencil /> Edit Profile</Button>
            <ButtonLink href={`/app/consultations?new=1&client=${id}`} size="sm"><CalendarPlus /> Schedule Consultation</ButtonLink>
            {DATA_MODE === "server" && <ButtonLink href={`/app/messages?client=${id}`} variant="secondary" size="sm"><MessagesSquare /> Message</ButtonLink>}
            <ButtonLink href={`/app/charts/new?client=${id}`} variant="secondary" size="sm"><CircleDot /> Create Chart</ButtonLink>
            <ButtonLink href={`/app/observations?new=1&client=${id}`} variant="secondary" size="sm"><NotebookPen /> Add Observation</ButtonLink>
            <ButtonLink href={`/app/timeline?client=${id}`} variant="secondary" size="sm"><Waves /> Timeline</ButtonLink>
            <Dropdown>
              <DropdownTrigger asChild>
                <Button variant="secondary" size="icon-sm" aria-label="More actions"><MoreHorizontal /></Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem onSelect={() => router.push(`/app/studio?client=${id}`)}><Mic /> Record a Reading</DropdownItem>
                <DropdownItem onSelect={() => router.push(`/app/delivery?new=1&client=${id}`)}><Send /> Deliver a Reading</DropdownItem>
                <DropdownItem onSelect={() => router.push(`/app/tasks?new=1&client=${id}`)}><ListPlus /> New Task</DropdownItem>
                <DropdownItem onSelect={() => router.push(`/portal?as=${id}`)}><Eye /> Preview Their Portal</DropdownItem>
                {client.portalAccess !== "none" && (
                  <DropdownItem
                    onSelect={() => {
                      s.updateClient(id, { portalAccess: "none" });
                      s.toast("Portal Access Turned Off", `${name} is signed out and can no longer open their portal. Send a new invitation to restore it.`, "success");
                    }}
                  >
                    <KeyRound /> Turn Off Portal Access
                  </DropdownItem>
                )}
                {client.portalAccess !== "active" && (
                  <DropdownItem
                    onSelect={async () => {
                      if (DATA_MODE === "demo") {
                        s.updateClient(id, { portalAccess: "invited" });
                        s.toast("Portal Invitation Sent", `${name} will receive an email invitation (simulated).`, "success");
                        return;
                      }
                      try {
                        await flushNow();
                        await api("/api/v1/portal/invite", { body: { clientId: id } });
                        useStore.setState((st) => ({ clients: st.clients.map((c) => (c.id === id ? { ...c, portalAccess: "invited" } : c)) }));
                        s.toast("Portal Invitation Sent", `${name} will receive an email with a link to set their password.`, "success");
                      } catch (e) {
                        s.toast("Invitation Not Sent", (e as Error).message, "error");
                      }
                    }}
                  >
                    <KeyRound /> {client.portalAccess === "invited" ? "Resend portal invitation" : "Send portal invitation"}
                  </DropdownItem>
                )}
                <DropdownSeparator />
                <DropdownItem onSelect={() => { s.updateClient(id, { status: archived ? "active" : "archived" }); s.toast(archived ? "Client restored" : "Client archived", undefined, "success"); }}>
                  {archived ? <ArchiveRestore /> : <Archive />} {archived ? "Restore Client" : "Archive Client"}
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
              {counts[t.id] !== undefined && <span className={cn("rounded-full px-1.5 text-[10.5px]", tab === t.id ? "bg-accent-50 text-accent" : "bg-canvas-2 text-muted")}>{counts[t.id]}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview"><OverviewTab client={client} person={person} onTab={setTab} /></TabsContent>
        <TabsContent value="charts"><ChartsTab client={client} /></TabsContent>
        <TabsContent value="people"><PeopleTab client={client} /></TabsContent>
        <TabsContent value="consultations"><ConsultationsTab client={client} /></TabsContent>
        <TabsContent value="work"><ClientWorkTab client={client} /></TabsContent>
        <TabsContent value="observations"><ObservationsTab client={client} /></TabsContent>
        <TabsContent value="readings"><ReadingsTab client={client} /></TabsContent>
        <TabsContent value="files"><FilesTab client={client} /></TabsContent>
      </Tabs>

      <EditClientDialog open={editOpen} onOpenChange={setEditOpen} client={client} person={person} />
    </div>
  );
}
