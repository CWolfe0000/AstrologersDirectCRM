"use client";

import { ImportClientsDialog } from "@/components/clients/import-dialog";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Upload, Download, LayoutList, LayoutGrid, MoreHorizontal, Archive, ArchiveRestore, User, CalendarPlus, CircleDot, ArrowUpDown, Mail, Phone, FileUp } from "lucide-react";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDate, fmtShort, fmtTime } from "@/lib/utils";
import type { ClientStatus } from "@/lib/data/types";
import { PageHeader, EmptyState, SimulatedBadge, SimulatedNote } from "@/components/ui/misc";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { lastConsultation, nextConsultation } from "@/components/clients/helpers";

type Sort = "name" | "last" | "next" | "created";

export default function ClientsPage() {
  const router = useRouter();
  const s = useStore();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"all" | ClientStatus | "current">("current");
  const [tag, setTag] = React.useState("all");
  const [sort, setSort] = React.useState<Sort>("name");
  const [view, setView] = React.useState<"table" | "cards">("table");
  const [importOpen, setImportOpen] = React.useState(false);

  const allTags = Array.from(new Set(s.clients.flatMap((c) => c.tags))).sort();

  const rows = React.useMemo(() => {
    return s.clients
      .map((c) => {
        const p = s.people.find((x) => x.id === c.id);
        return { c, p, name: personName(p), last: lastConsultation(s.consultations, c.id), next: nextConsultation(s.consultations, c.id) };
      })
      .filter((r) => {
        if (status === "current" && r.c.status === "archived") return false;
        if (status !== "all" && status !== "current" && r.c.status !== status) return false;
        if (tag !== "all" && !r.c.tags.includes(tag)) return false;
        const t = q.trim().toLowerCase();
        if (t && !`${r.name} ${r.c.email} ${r.c.phone ?? ""} ${r.c.tags.join(" ")} ${r.p?.birth.place ?? ""}`.toLowerCase().includes(t)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return (a.p?.lastName ?? "").localeCompare(b.p?.lastName ?? "");
        if (sort === "last") return (b.last?.start ?? "").localeCompare(a.last?.start ?? "");
        if (sort === "next") return (a.next?.start ?? "9999").localeCompare(b.next?.start ?? "9999");
        return b.c.createdAt.localeCompare(a.c.createdAt);
      });
  }, [s.clients, s.people, s.consultations, q, status, tag, sort]);

  const counts = {
    current: s.clients.filter((c) => c.status !== "archived").length,
    active: s.clients.filter((c) => c.status === "active").length,
    new: s.clients.filter((c) => c.status === "new").length,
    inactive: s.clients.filter((c) => c.status === "inactive").length,
    archived: s.clients.filter((c) => c.status === "archived").length,
  };

  const toggleArchive = (id: string, archived: boolean) => {
    s.updateClient(id, { status: archived ? "active" : "archived" });
    s.toast(archived ? "Client restored" : "Client archived", archived ? "The client is back in your active directory." : "Their records are kept and can be restored at any time.", "success");
  };

  const exportCsv = () => {
    const head = ["First name", "Last name", "Email", "Phone", "Status", "Birth date", "Birth time", "Time accuracy", "Birth place", "Tags", "Client since"];
    const lines = rows.map(({ c, p }) =>
      [p?.firstName, p?.lastName, c.email, c.phone ?? "", c.status, p?.birth.date, p?.birth.time, p?.birth.timeAccuracy, p?.birth.place, c.tags.join("; "), c.createdAt]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "astrologersdirect-clients.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    s.toast("Export ready", `${rows.length} clients exported to CSV.`, "success");
  };

  const RowMenu = ({ id, archived }: { id: string; archived: boolean }) => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Client actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownTrigger>
      <DropdownContent onClick={(e) => e.stopPropagation()}>
        <DropdownItem onSelect={() => router.push(`/app/clients/${id}`)}><User /> Open profile</DropdownItem>
        <DropdownItem onSelect={() => router.push(`/app/consultations?new=1&client=${id}`)}><CalendarPlus /> Schedule consultation</DropdownItem>
        <DropdownItem onSelect={() => router.push(`/app/charts/new?client=${id}`)}><CircleDot /> Create chart</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => toggleArchive(id, archived)}>
          {archived ? <ArchiveRestore /> : <Archive />} {archived ? "Restore client" : "Archive client"}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Every client, their charts, consultations and delivered readings — in one record."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Clients" }]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload /> Import
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download /> Export
            </Button>
            <ButtonLink href="/app/clients/new" size="sm">
              <UserPlus /> Add client
            </ButtonLink>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput placeholder="Search by name, email, place or tag…" value={q} onChange={(e) => setQ(e.target.value)} className="lg:w-72" />
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Segmented
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { value: "current", label: "All current", count: counts.current },
              { value: "active", label: "Active", count: counts.active },
              { value: "new", label: "New", count: counts.new },
              { value: "inactive", label: "Inactive", count: counts.inactive },
              { value: "archived", label: "Archived", count: counts.archived },
            ]}
          />
        </div>
        </div>
        <div className="flex items-center gap-2 lg:justify-end 2xl:ml-auto">
          <Select value={tag} onChange={(e) => setTag(e.target.value)} className="min-w-0 flex-1 sm:w-40 sm:flex-none" aria-label="Filter by tag">
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-w-0 flex-1 sm:w-48 sm:flex-none" aria-label="Sort">
            <option value="name">Sort: Last name</option>
            <option value="last">Sort: Last consultation</option>
            <option value="next">Sort: Next appointment</option>
            <option value="created">Sort: Newest client</option>
          </Select>
          <Segmented
            size="sm"
            value={view}
            onChange={setView}
            className="hidden md:inline-flex"
            options={[
              { value: "table", label: <LayoutList aria-label="Table view" /> },
              { value: "cards", label: <LayoutGrid aria-label="Card view" /> },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<User />}
            title="No clients match"
            body="Try a different search or filter."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setQ(""); setTag("all"); setStatus("current"); }}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className={cn("hidden overflow-hidden", view === "table" && "md:block")}>
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-line bg-canvas/60 text-[12px] text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort("name")}>Client <ArrowUpDown className="size-3" /></button>
                  </th>
                  <th className="hidden px-3 py-2.5 font-medium 2xl:table-cell">Birth data</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort("last")}>Last consultation <ArrowUpDown className="size-3" /></button>
                  </th>
                  <th className="px-3 py-2.5 font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort("next")}>Upcoming <ArrowUpDown className="size-3" /></button>
                  </th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="hidden px-3 py-2.5 font-medium lg:table-cell">Tags</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ c, p, name, last, next }) => (
                  <tr key={c.id} className="cursor-pointer transition-colors hover:bg-canvas/70" onClick={() => router.push(`/app/clients/${c.id}`)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/app/clients/${c.id}`} className="font-medium hover:text-accent" onClick={(e) => e.stopPropagation()}>
                            {name}
                          </Link>
                          <p className="truncate text-[12px] text-muted">
                            {c.email}
                            {c.phone && <span className="hidden 2xl:inline"> · {c.phone}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-[12.5px] 2xl:table-cell">
                      {p && (
                        <>
                          <p>
                            {fmtDate(p.birth.date)}
                            {p.birth.timeAccuracy !== "unknown" && `, ${p.birth.time}`}
                            {p.birth.timeAccuracy !== "exact" && <span className="ml-1 text-warn">({p.birth.timeAccuracy})</span>}
                          </p>
                          <p className="max-w-[200px] truncate text-muted">{p.birth.place}</p>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12.5px]">
                      {last ? (
                        <>
                          <p className="whitespace-nowrap">{fmtDate(last.start)}</p>
                          <p className="max-w-[180px] truncate text-muted">{last.type}</p>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12.5px]">
                      {next ? (
                        <>
                          <p className="whitespace-nowrap font-medium">
                            {fmtShort(next.start)}, {fmtTime(next.start)}
                          </p>
                          <p className="max-w-[180px] truncate text-muted">{next.type}</p>
                        </>
                      ) : (
                        <span className="text-muted">None scheduled</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 2).map((t) => (
                          <Badge key={t} tone="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowMenu id={c.id} archived={c.status === "archived"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", view === "table" && "md:hidden")}>
            {rows.map(({ c, p, name, last, next }) => (
              <Card key={c.id} className="cursor-pointer p-4 transition-colors hover:border-line-strong" onClick={() => router.push(`/app/clients/${c.id}`)}>
                <div className="flex items-start gap-3">
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="flex items-center gap-1.5 truncate text-[12px] text-muted">
                      <Mail className="size-3 shrink-0" /> <span className="truncate">{c.email}</span>
                    </p>
                    {c.phone && (
                      <p className="flex items-center gap-1.5 text-[12px] text-muted">
                        <Phone className="size-3" /> {c.phone}
                      </p>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowMenu id={c.id} archived={c.status === "archived"} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
                  <div>
                    <p className="text-muted">Last consultation</p>
                    <p>{last ? fmtDate(last.start) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted">Upcoming</p>
                    <p className={next ? "font-medium" : "text-muted"}>{next ? `${fmtShort(next.start)}, ${fmtTime(next.start)}` : "None"}</p>
                  </div>
                </div>
                {p && (
                  <p className="mt-2 truncate text-[12px] text-muted">
                    Born {fmtDate(p.birth.date)} · {p.birth.place}
                  </p>
                )}
              </Card>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted">
            Showing {rows.length} of {s.clients.length} clients
          </p>
        </>
      )}

      <ImportClientsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
