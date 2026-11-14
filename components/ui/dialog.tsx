"use client";

import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  footer,
  size = "md",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] animate-fade-in" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-line bg-surface shadow-pop animate-slide-up focus:outline-none",
          w,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <D.Title className="font-serif text-[22px] leading-tight text-ink">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-[13px] text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">Dialog</D.Description>
            )}
          </div>
          <D.Close className="-mr-2 rounded-md p-1.5 text-muted hover:bg-canvas-2 hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
      </D.Content>
    </D.Portal>
  );
}

/** Right-hand slide-over panel. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "max-w-xl",
  side = "right",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  side?: "right" | "left";
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/30 animate-fade-in" />
        <D.Content
          className={cn(
            "fixed inset-y-0 z-50 flex w-full flex-col bg-surface shadow-pop focus:outline-none",
            side === "right" ? "right-0 animate-slide-in-right border-l border-line" : "left-0 animate-slide-in-left border-r border-line",
            width,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <D.Title className="font-serif text-[22px] leading-tight text-ink">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-[13px] text-muted">{description}</D.Description> : <D.Description className="sr-only">Panel</D.Description>}
            </div>
            <D.Close className="-mr-2 rounded-md p-1.5 text-muted hover:bg-canvas-2 hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </D.Close>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
