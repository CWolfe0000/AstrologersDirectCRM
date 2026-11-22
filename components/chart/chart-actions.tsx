"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, ExternalLink, UserRound, Download, Printer, Star, Mic, Send, Share2, EyeOff, RefreshCw, Image as ImageIcon } from "lucide-react";
import type { ChartView } from "@/lib/astro";
import type { ChartRecord } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { downloadPng, downloadSvg, findChartSvg } from "./export";

export function ChartActionsMenu({ chart, svg, inWorkspace, view }: { chart: ChartRecord; svg?: () => SVGSVGElement | null; inWorkspace?: boolean; view?: ChartView | null }) {
  const router = useRouter();
  const updateChart = useStore((s) => s.updateChart);
  const toast = useStore((s) => s.toast);
  const getSvg = () => (svg ? svg() : findChartSvg(chart.id));
  const clientName = useStore((s) => s.people.find((p) => p.id === chart.clientId)?.firstName ?? "your client");
  // Share a read-only snapshot of the calculated chart to the client's portal.
  const share = (again: boolean) => {
    if (!view) return;
    // Only the fields the portal draws (the server validates the snapshot strictly).
    const pts = (p: NonNullable<ChartView["outer"]>) => ({ bodies: p.bodies.map((b) => ({ id: b.id, lon: b.lon, speed: b.speed, house: b.house })), cusps: [...p.cusps], asc: p.asc, mc: p.mc });
    const snap = {
      type: view.type,
      inner: pts(view.inner),
      ...(view.outer ? { outer: pts(view.outer) } : {}),
      aspects: view.aspects.slice(0, 400).map((a) => ({ a: a.a, b: a.b, aRing: a.aRing, bRing: a.bRing, type: a.type, orb: a.orb, applying: a.applying })),
    };
    updateChart(chart.id, { shared: { at: new Date().toISOString(), view: snap } });
    if (!again)
      useStore.setState((s) => ({
        portalNotifications: [{ id: `pn_${Math.random().toString(36).slice(2, 10)}`, clientId: chart.clientId, title: "New Chart Shared", body: `“${chart.title}” is in My Charts.`, at: new Date().toISOString().slice(0, 19), read: false, href: `/portal/charts/${chart.id}` }, ...s.portalNotifications],
      }));
    toast(again ? "Shared Chart Updated" : "Chart Shared", again ? `${clientName} now sees the current version.` : `${clientName} can see it in My Charts in their portal.`, "success");
  };
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant={inWorkspace ? "secondary" : "ghost"} size="icon-sm" aria-label="Chart Actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-56" onClick={(e) => e.stopPropagation()}>
        {!inWorkspace && (
          <DropdownItem onSelect={() => router.push(`/app/charts/${chart.id}`)}>
            <ExternalLink /> Open in Workspace
          </DropdownItem>
        )}
        <DropdownItem onSelect={() => router.push(`/app/clients/${chart.clientId}`)}>
          <UserRound /> Open Client Record
        </DropdownItem>
        <DropdownItem
          onSelect={() => {
            updateChart(chart.id, { favorite: !chart.favorite });
            toast(chart.favorite ? "Removed from favorites" : "Added to favorites", chart.title);
          }}
        >
          <Star /> {chart.favorite ? "Remove from Favorites" : "Add to Favorites"}
        </DropdownItem>
        {view && chart.type !== "astrocartography" && (
          <>
            <DropdownSeparator />
            {!chart.shared ? (
              <DropdownItem onSelect={() => share(false)}><Share2 /> Share With Client</DropdownItem>
            ) : (
              <>
                <DropdownItem onSelect={() => share(true)}><RefreshCw /> Update Shared Chart</DropdownItem>
                <DropdownItem onSelect={() => { updateChart(chart.id, { shared: undefined }); toast("Stopped Sharing", `${clientName} no longer sees this chart.`, "success"); }}><EyeOff /> Stop Sharing</DropdownItem>
              </>
            )}
          </>
        )}
        <DropdownSeparator />
        <DropdownItem onSelect={() => router.push(`/app/studio?client=${chart.clientId}&chart=${chart.id}`)}>
          <Mic /> Record Reading
        </DropdownItem>
        <DropdownItem onSelect={() => router.push(`/app/delivery?new=1&client=${chart.clientId}&chart=${chart.id}`)}>
          <Send /> Deliver Reading
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => (downloadSvg(getSvg(), chart.title) ? toast("Chart Exported", "SVG downloaded.", "success") : toast("Export Unavailable", undefined, "error"))}>
          <Download /> Export as SVG
        </DropdownItem>
        <DropdownItem onSelect={() => downloadPng(getSvg(), chart.title).then((ok) => toast(ok ? "Chart exported" : "Export failed", ok ? "PNG downloaded." : undefined, ok ? "success" : "error"))}>
          <Download /> Export as PNG
        </DropdownItem>
        {chart.type === "natal" && (
          <DropdownItem onSelect={() => router.push(`/app/share?chart=${chart.id}`)}>
            <ImageIcon /> Make a Share Card
          </DropdownItem>
        )}
        <DropdownItem onSelect={() => router.push(`/app/charts/${chart.id}/print`)}>
          <Printer /> Print or Save as PDF
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
