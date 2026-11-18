"use client";

import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * The chart wheel, full screen: as large as the window allows, still
 * interactive. Esc, the close button or clicking outside returns.
 */
export function ExpandedWheel({
  open,
  onOpenChange,
  title,
  caption,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  caption?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40 animate-fade-in" />
        <D.Content className="fixed inset-2 z-50 flex flex-col rounded-xl border border-line bg-surface shadow-pop animate-fade-in focus:outline-none sm:inset-4">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 sm:px-5">
            <D.Title className="min-w-0 truncate font-serif text-[18px] text-ink">{title}</D.Title>
            <D.Description className="sr-only">The chart wheel, enlarged. Select a planet to see its aspects.</D.Description>
            <D.Close className="-mr-1.5 rounded-md p-1.5 text-muted hover:bg-canvas-2 hover:text-ink" aria-label="Close expanded wheel">
              <X className="size-5" />
            </D.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-3">
            {/* Square: the smaller of the available width and height. */}
            <div className="w-full" style={{ maxWidth: "min(100%, calc(100dvh - 15rem))" }}>
              {children}
            </div>
          </div>
          {caption && (
            <div className="border-t border-line px-3 py-3 sm:px-5">
              <div className="mx-auto max-w-3xl rounded-xl border border-line bg-canvas/60 px-4 py-3 text-[13.5px] text-ink">{caption}</div>
            </div>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
