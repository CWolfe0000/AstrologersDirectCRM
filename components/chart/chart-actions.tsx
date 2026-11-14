"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, ExternalLink, UserRound, Download, Printer, Star, Mic, Send } from "lucide-react";
import type { ChartRecord } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { downloadPng, downloadSvg, findChartSvg } from "./export";

export function ChartActionsMenu({ chart, svg, inWorkspace }: { chart: ChartRecord; svg?: () => SVGSVGElement | null; inWorkspace?: boolean }) {
  const router = useRouter();
  const updateChart = useStore((s) => s.updateChart);
  const toast = useStore((s) => s.toast);
  const getSvg = () => (svg ? svg() : findChartSvg(chart.id));
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant={inWorkspace ? "secondary" : "ghost"} size="icon-sm" aria-label="Chart actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-56" onClick={(e) => e.stopPropagation()}>
        {!inWorkspace && (
          <DropdownItem onSelect={() => router.push(`/app/charts/${chart.id}`)}>
            <ExternalLink /> Open in workspace
          </DropdownItem>
        )}
        <DropdownItem onSelect={() => router.push(`/app/clients/${chart.clientId}`)}>
          <UserRound /> Open client record
        </DropdownItem>
        <DropdownItem
          onSelect={() => {
            updateChart(chart.id, { favorite: !chart.favorite });
            toast(chart.favorite ? "Removed from favorites" : "Added to favorites", chart.title);
          }}
        >
          <Star /> {chart.favorite ? "Remove from favorites" : "Add to favorites"}
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => router.push(`/app/studio?client=${chart.clientId}&chart=${chart.id}`)}>
          <Mic /> Record reading
        </DropdownItem>
        <DropdownItem onSelect={() => router.push(`/app/delivery?new=1&client=${chart.clientId}&chart=${chart.id}`)}>
          <Send /> Deliver reading
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => (downloadSvg(getSvg(), chart.title) ? toast("Chart exported", "SVG downloaded.", "success") : toast("Export unavailable", undefined, "error"))}>
          <Download /> Export as SVG
        </DropdownItem>
        <DropdownItem onSelect={() => downloadPng(getSvg(), chart.title).then((ok) => toast(ok ? "Chart exported" : "Export failed", ok ? "PNG downloaded." : undefined, ok ? "success" : "error"))}>
          <Download /> Export as PNG
        </DropdownItem>
        <DropdownItem onSelect={() => (inWorkspace ? window.print() : router.push(`/app/charts/${chart.id}?print=1`))}>
          <Printer /> Print
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
