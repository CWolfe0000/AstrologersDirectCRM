"use client";

import * as React from "react";
import * as P from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;

export function PopoverContent({ className, align = "end", ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={8}
        className={cn("z-50 rounded-xl border border-line bg-surface shadow-pop animate-slide-up focus:outline-none", className)}
        {...props}
      />
    </P.Portal>
  );
}
