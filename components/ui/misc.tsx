"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, FileText, FileAudio, FileVideo, Link2, File, Image as ImageIcon, FlaskConical, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function Breadcrumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex min-w-0 items-center gap-1 text-[12.5px] text-muted", className)}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
          {it.href ? (
            <Link href={it.href} className="truncate hover:text-ink">
              {it.label}
            </Link>
          ) : (
            <span className="truncate text-ink-3">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-2" />}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h1 className="font-serif text-[30px] leading-[1.1] text-ink md:text-[34px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[14px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon?: React.ReactNode; title: string; body?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-canvas-2 text-muted [&_svg]:size-5">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  href,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  const inner = (
    <div className={cn("group rounded-xl border border-line bg-surface p-4 shadow-card transition-colors md:p-5", href && "hover:border-line-strong", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-muted">{label}</span>
        {icon && <span className="flex size-8 items-center justify-center rounded-lg bg-canvas-2 text-ink-3 [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-serif text-[32px] leading-none text-ink">{value}</span>
        {trend && <span className={cn("text-xs font-medium", trend.positive ? "text-sage-dark" : "text-danger")}>{trend.value}</span>}
      </div>
      {sub && <div className="mt-1.5 text-[12.5px] text-muted">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/** Marks functionality that is simulated in the prototype. */
export function SimulatedBadge({ className, label = "Simulated" }: { className?: string; label?: string }) {
  return (
    <span
      title="This feature is simulated in the prototype. See SIMULATED_FEATURES.md."
      className={cn("inline-flex items-center gap-1 rounded-full border border-dashed border-warn/50 bg-warn-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-warn", className)}
    >
      <FlaskConical className="size-3" />
      {label}
    </span>
  );
}

export function SimulatedNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border border-dashed border-warn/40 bg-warn-50/70 px-3.5 py-2.5 text-[12.5px] text-[#7C5A22]", className)}>
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function KeyValue({ items, className, cols = 2 }: { items: { label: string; value: React.ReactNode }[]; className?: string; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3.5", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3", className)}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[12px] text-muted">{i.label}</dt>
          <dd className="mt-0.5 text-[13.5px] text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FileKindIcon({ kind, className }: { kind: string; className?: string }) {
  const map: Record<string, { icon: React.ElementType; cls: string }> = {
    pdf: { icon: FileText, cls: "bg-accent-50 text-accent" },
    document: { icon: FileText, cls: "bg-[#ECEEF3] text-[#4D5A70]" },
    doc: { icon: FileText, cls: "bg-[#ECEEF3] text-[#4D5A70]" },
    audio: { icon: FileAudio, cls: "bg-sage-50 text-sage-dark" },
    video: { icon: FileVideo, cls: "bg-[#F3EDE4] text-[#7A6145]" },
    link: { icon: Link2, cls: "bg-canvas-2 text-ink-3" },
    image: { icon: ImageIcon, cls: "bg-[#F2ECF2] text-[#6E4F6E]" },
  };
  const m = map[kind] ?? { icon: File, cls: "bg-canvas-2 text-ink-3" };
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg", m.cls, className)}>
      <Icon className="size-[18px]" />
    </span>
  );
}

export const KIND_LABEL: Record<string, string> = { pdf: "PDF", audio: "Audio", video: "Video", document: "Document", link: "External link" };

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertCircle : Info;
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop animate-slide-up">
            <Icon className={cn("mt-0.5 size-[18px] shrink-0", t.tone === "success" ? "text-sage-dark" : t.tone === "error" ? "text-danger" : "text-accent")} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12.5px] text-muted">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-muted hover:text-ink" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Wordmark({ className, light, compact }: { className?: string; light?: boolean; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("flex size-7 items-center justify-center rounded-md font-serif text-[17px] leading-none", light ? "bg-white/10 text-white" : "bg-ink text-white")}>A</span>
      {!compact && (
        <span className={cn("font-serif text-[20px] leading-none tracking-[-0.01em]", light ? "text-white" : "text-ink")}>
          Astrologers<span className={light ? "text-[#D9B9C2]" : "text-accent"}>Direct</span>
        </span>
      )}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line bg-canvas-2 px-1.5 py-0.5 font-sans text-[10.5px] font-medium text-muted">{children}</kbd>;
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-line", className)} />;
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between", className)}>
      <h3 className="text-[13px] font-semibold text-ink">{children}</h3>
      {action}
    </div>
  );
}
