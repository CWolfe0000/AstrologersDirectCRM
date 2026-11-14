"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Textarea that autosaves after a short pause. */
export function AutosaveTextarea({
  value,
  onSave,
  placeholder,
  className,
  label,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  label: React.ReactNode;
}) {
  const [v, setV] = React.useState(value);
  const [state, setState] = React.useState<"idle" | "saving" | "saved">("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = React.useRef(value);

  // Reset when the underlying record changes
  React.useEffect(() => {
    if (value !== keyRef.current && state !== "saving") {
      setV(value);
      keyRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const change = (nv: string) => {
    setV(nv);
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      keyRef.current = nv;
      onSave(nv);
      setState("saved");
    }, 700);
  };

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className={cn("flex items-center gap-1 text-[11.5px] text-muted transition-opacity", state === "idle" && "opacity-0")}>
          {state === "saving" ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3 text-sage-dark" />}
          {state === "saving" ? "Saving…" : "Saved"}
        </span>
      </div>
      <Textarea value={v} onChange={(e) => change(e.target.value)} placeholder={placeholder} className={cn("min-h-[110px] bg-canvas/40", className)} />
    </div>
  );
}
