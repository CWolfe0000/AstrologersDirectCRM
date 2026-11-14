import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-line-strong focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:bg-canvas-2 disabled:text-muted";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(field, "h-9", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(field, "min-h-[88px] py-2 leading-relaxed", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", className)}>
      <select ref={ref} className={cn(field, "h-9 appearance-none pr-8")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-ink", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
  optional,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SearchInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input className={cn(field, "h-9 pl-9")} {...props} />
    </div>
  );
}

export function Checkbox({ className, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }) {
  const box = (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer appearance-none rounded border border-line-strong bg-surface transition-colors checked:border-accent checked:bg-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        "bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M4 8.5l2.5 2.5L12 5.5%22/></svg>')]",
        className,
      )}
      {...props}
    />
  );
  if (!label) return box;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
      {box}
      <span>{label}</span>
    </label>
  );
}
