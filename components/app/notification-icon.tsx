import { CalendarDays, UserRound, Send, AlertTriangle, ListChecks, Settings2 } from "lucide-react";
import type { NotificationType } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function NotificationIcon({ type, className }: { type: NotificationType; className?: string }) {
  const map = {
    consultation: { i: CalendarDays, c: "bg-[#ECEEF3] text-[#4D5A70]" },
    client: { i: UserRound, c: "bg-sage-50 text-sage-dark" },
    delivery: { i: Send, c: "bg-accent-50 text-accent" },
    upload: { i: AlertTriangle, c: "bg-danger-50 text-danger" },
    task: { i: ListChecks, c: "bg-warn-50 text-warn" },
    account: { i: Settings2, c: "bg-canvas-2 text-ink-3" },
  }[type];
  const I = map.i;
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", map.c, className)}>
      <I className="size-4" />
    </span>
  );
}
