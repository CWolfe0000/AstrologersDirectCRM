"use client";

import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn("no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-line", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative -mb-px inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 text-[13.5px] font-medium text-muted transition-colors hover:text-ink",
        "data-[state=active]:border-accent data-[state=active]:text-ink [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("animate-fade-in focus-visible:outline-none", className)} {...props} />;
}

/** Pill-style segmented control (controlled). */
export function Segmented<V extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: React.ReactNode; count?: number }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex items-center rounded-lg border border-line bg-canvas-2 p-0.5", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium text-muted transition-colors hover:text-ink [&_svg]:size-3.5",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
            value === o.value && "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="rounded-full bg-canvas-3 px-1.5 text-[10.5px] text-muted">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
