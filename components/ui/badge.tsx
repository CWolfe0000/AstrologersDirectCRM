import * as React from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "sage" | "warn" | "danger" | "outline" | "dark" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas-2 text-ink-3 border-transparent",
  accent: "bg-accent-50 text-accent border-accent-100",
  sage: "bg-sage-50 text-sage-dark border-sage-100",
  warn: "bg-warn-50 text-warn border-[#F1E0C2]",
  danger: "bg-danger-50 text-danger border-[#F0D3D1]",
  outline: "bg-transparent text-muted border-line",
  dark: "bg-ink text-white border-ink",
  info: "bg-[#EEF1F5] text-[#4B5D73] border-[#DCE3EC]",
};

export function Badge({
  tone = "neutral",
  className,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-[18px]",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

const STATUS: Record<string, { tone: Tone; label: string }> = {
  // client
  active: { tone: "sage", label: "Active" },
  new: { tone: "accent", label: "New" },
  inactive: { tone: "neutral", label: "Inactive" },
  archived: { tone: "outline", label: "Archived" },
  // consultation
  scheduled: { tone: "info", label: "Scheduled" },
  completed: { tone: "sage", label: "Completed" },
  cancelled: { tone: "outline", label: "Cancelled" },
  "no-show": { tone: "warn", label: "No-show" },
  // tasks
  todo: { tone: "neutral", label: "To do" },
  "in-progress": { tone: "info", label: "In progress" },
  done: { tone: "sage", label: "Done" },
  overdue: { tone: "danger", label: "Overdue" },
  // delivery
  draft: { tone: "neutral", label: "Draft" },
  ready: { tone: "accent", label: "Ready to send" },
  delivered: { tone: "sage", label: "Delivered" },
  failed: { tone: "danger", label: "Failed" },
  pending: { tone: "warn", label: "Pending" },
  sent: { tone: "info", label: "Notified" },
  opened: { tone: "sage", label: "Opened" },
  saved: { tone: "neutral", label: "Saved" },
  invited: { tone: "warn", label: "Invited" },
  none: { tone: "outline", label: "No access" },
  // priority
  high: { tone: "danger", label: "High" },
  medium: { tone: "warn", label: "Medium" },
  low: { tone: "neutral", label: "Low" },
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const s = STATUS[status] ?? { tone: "neutral" as Tone, label: status };
  return (
    <Badge tone={s.tone} dot className={className}>
      {label ?? s.label}
    </Badge>
  );
}
