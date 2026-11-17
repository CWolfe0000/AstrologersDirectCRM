"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Star, LayoutGrid, List, Clock, Bookmark, CircleDot } from "lucide-react";
import { CHART_TYPES } from "@/lib/astro";
import type { ChartType } from "@/lib/data/types";
import { useStore, personName } from "@/lib/store";
import { cn, fmtDate, relTime } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ChartThumb, ChartTypeBadge, EngineNotice } from "@/components/chart/chart-helpers";
import { ChartActionsMenu } from "@/components/chart/chart-actions";

export default function ChartsPage() {
  return (
    <React.Suspense>
      <ChartDirectory />
    </React.Suspense>
  );
}

function ChartDirectory() {
  const router = useRouter();
  const params = useSearchParams();
  const charts = useStore((s) => s.charts);
  const people = useStore((s) => s.people);
  const clients = useStore((s) => s.clients);
  const updateChart = useStore((s) => s.updateChart);
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<ChartType | "all">((params.get("type") as ChartType) ?? "all");
  const [client, setClient] = React.useState(params.get("client") ?? "all");
  const [favOnly, setFavOnly] = React.useState(false);
  const [view, setView] = React.useState<"grid" | "list">("grid");

  const name = (id?: string) => personName(people.find((p) => p.id === id));
  const subjects = (ids: string[]) => ids.map(name).join(" & ");

  const filtered = charts
    .filter((c) => type === "all" || c.type === type)
    .filter((c) => client === "all" || c.clientId === client)
    .filter((c) => !favOnly || c.favorite)
    .filter((c) => {
      const t = q.trim().toLowerCase();
      if (!t) return true;
      return (c.title + " " + subjects(c.personIds) + " " + name(c.clientId) + " " + (c.savedConfig ?? "")).toLowerCase().includes(t);
    })
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));

  const recent = [...charts].filter((c) => c.lastOpenedAt).sort((a, b) => (b.lastOpenedAt! > a.lastOpenedAt! ? 1 : -1)).slice(0, 4);
  const counts = Object.fromEntries(CHART_TYPES.map((t) => [t.id, charts.filter((c) => c.type === t.id).length]));

  return (
    <div>
      <PageHeader
        title="Charts"
        description="Every saved chart, filed under the client it belongs to. Open a chart to analyse it, add observations, or record a reading."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Charts" }]}
        actions={
          <>
            <EngineNotice compact />
            <ButtonLink href="/app/charts/new">
              <Plus /> Create Chart
            </ButtonLink>
          </>
        }
      />

      {/* Recently opened */}
      <section className="mb-7">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Clock className="size-4 text-muted" /> Recently opened
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {recent.map((c) => (
            <Link key={c.id} href={`/app/charts/${c.id}`} className="flex w-[260px] shrink-0 items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition-colors hover:border-line-strong md:w-auto">
              <div className="size-14 shrink-0">
                <ChartThumb chart={c} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-ink">{c.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                  <ChartTypeBadge type={c.type} /> {relTime(c.lastOpenedAt!)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <SearchInput placeholder="Search by title, person, client or configuration…" value={q} onChange={(e) => setQ(e.target.value)} className="lg:max-w-sm lg:flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={client} onChange={(e) => setClient(e.target.value)} className="w-[190px]" aria-label="Filter by client">
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {name(c.id)}
              </option>
            ))}
          </Select>
          <Button variant={favOnly ? "primary" : "secondary"} size="md" onClick={() => setFavOnly((f) => !f)} aria-pressed={favOnly}>
            <Star className={cn(favOnly && "fill-current")} /> Favorites
          </Button>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: <LayoutGrid aria-label="Grid view" /> },
              { value: "list", label: <List aria-label="List view" /> },
            ]}
          />
        </div>
      </div>
      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {[{ id: "all" as const, short: "All types" }, ...CHART_TYPES].map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
              type === t.id ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-3 hover:border-line-strong",
            )}
          >
            {t.short}
            <span className={cn("text-[11px]", type === t.id ? "text-white/60" : "text-muted")}>{t.id === "all" ? charts.length : counts[t.id]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState icon={<CircleDot />} title="No Charts Match These Filters" body="Try a different search, or create a new chart for a client." action={<ButtonLink href="/app/charts/new" size="sm"><Plus /> Create Chart</ButtonLink>} />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/app/charts/${c.id}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/app/charts/${c.id}`)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-colors hover:border-line-strong"
            >
              <div className="relative border-b border-line bg-canvas/50 px-8 py-5" data-chart-id={c.id}>
                <ChartThumb chart={c} className="mx-auto max-w-[220px]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateChart(c.id, { favorite: !c.favorite });
                  }}
                  aria-label={c.favorite ? "Remove from favorites" : "Add to favorites"}
                  className="absolute left-3 top-3 rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink"
                >
                  <Star className={cn("size-4", c.favorite && "fill-accent text-accent")} />
                </button>
                <div className="absolute right-2 top-2">
                  <ChartActionsMenu chart={c} />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-medium leading-snug text-ink">{c.title}</p>
                  <ChartTypeBadge type={c.type} className="shrink-0" />
                </div>
                <p className="mt-1 text-[12.5px] text-muted">
                  Client:{" "}
                  <Link href={`/app/clients/${c.clientId}`} onClick={(e) => e.stopPropagation()} className="text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-accent">
                    {name(c.clientId)}
                  </Link>
                  {c.personIds.some((p) => p !== c.clientId) && <> · {subjects(c.personIds)}</>}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted">
                  <span>Updated {fmtDate(c.updatedAt)}</span>
                  {c.savedConfig && (
                    <span className="inline-flex items-center gap-1 text-sage-dark">
                      <Bookmark className="size-3" /> {c.savedConfig}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-line bg-canvas/60 text-[11.5px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Chart</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Client</th>
                  <th className="px-4 py-2.5 font-semibold">Configuration</th>
                  <th className="px-4 py-2.5 font-semibold">Updated</th>
                  <th className="w-20 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/app/charts/${c.id}`)} className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 shrink-0" data-chart-id={c.id}>
                          <ChartThumb chart={c} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{c.title}</p>
                          <p className="truncate text-[12px] text-muted">{subjects(c.personIds)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><ChartTypeBadge type={c.type} /></td>
                    <td className="px-4 py-2.5">
                      <Link href={`/app/clients/${c.clientId}`} onClick={(e) => e.stopPropagation()} className="underline decoration-line-strong underline-offset-2 hover:text-accent">{name(c.clientId)}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{c.savedConfig ?? "Practice defaults"}</td>
                    <td className="px-4 py-2.5 text-muted">{fmtDate(c.updatedAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); updateChart(c.id, { favorite: !c.favorite }); }} className="rounded-md p-1.5 text-muted hover:bg-canvas-2" aria-label="Toggle favorite">
                          <Star className={cn("size-4", c.favorite && "fill-accent text-accent")} />
                        </button>
                        <ChartActionsMenu chart={c} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mt-4 text-[12px] text-muted">{filtered.length} of {charts.length} charts</p>
    </div>
  );
}
