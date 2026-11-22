"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldIdContext, LabelledByContext } from "./label-context";

const field =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-line-strong focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:bg-canvas-2 disabled:text-muted";

/** id from an enclosing <Field>, or aria-labelledby from an enclosing settings row, when none is given. */
function useA11yProps(props: { id?: string; "aria-label"?: string; "aria-labelledby"?: string }) {
  const fieldId = React.useContext(FieldIdContext);
  const labelledBy = React.useContext(LabelledByContext);
  return {
    id: props.id ?? fieldId ?? undefined,
    "aria-labelledby": props["aria-labelledby"] ?? (!props["aria-label"] && !props.id && !fieldId && labelledBy ? labelledBy : undefined),
  };
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  const a11y = useA11yProps(props);
  return <input ref={ref} className={cn(field, "h-9", className)} {...props} {...a11y} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  const a11y = useA11yProps(props);
  return <textarea ref={ref} className={cn(field, "min-h-[88px] py-2 leading-relaxed", className)} {...props} {...a11y} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", className)}>
      <select ref={ref} className={cn(field, "h-9 appearance-none pr-8")} {...props} {...useA11yProps(props)}>
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
  const auto = React.useId();
  const id = htmlFor ?? auto;
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(Optional)</span>}
      </Label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
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
        "ad-check",
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
