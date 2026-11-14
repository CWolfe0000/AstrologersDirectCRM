"use client";

import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = M.Root;
export const DropdownTrigger = M.Trigger;

export function DropdownContent({ className, align = "end", ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        className={cn("z-50 min-w-[200px] rounded-lg border border-line bg-surface p-1 shadow-pop animate-slide-up", className)}
        {...props}
      />
    </M.Portal>
  );
}

export function DropdownItem({ className, ...props }: React.ComponentProps<typeof M.Item>) {
  return (
    <M.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] text-ink outline-none data-[highlighted]:bg-canvas-2 data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof M.Label>) {
  return <M.Label className={cn("px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted", className)} {...props} />;
}

export function DropdownSeparator() {
  return <M.Separator className="my-1 h-px bg-line" />;
}
