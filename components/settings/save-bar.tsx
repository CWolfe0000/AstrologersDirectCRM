"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The save bar every editable settings page uses: it stays in view while there are unsaved changes. */
export function SaveBar({ dirty, busy, error, onSave, onDiscard, saveLabel = "Save Changes" }: { dirty: boolean; busy?: boolean; error?: string | null; onSave: () => void; onDiscard: () => void; saveLabel?: string }) {
  return (
    <div className={cn("z-20 mt-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all", dirty || error ? "sticky bottom-4 border-line-strong bg-surface shadow-lg" : "border-line bg-transparent")}>
      {error ? (
        <p role="alert" className="text-[13px] text-danger">{error}</p>
      ) : (
        <p className="text-[13px] text-muted" aria-live="polite">{dirty ? "You have unsaved changes." : "All changes saved."}</p>
      )}
      <div className="flex shrink-0 gap-2">
        {dirty && <Button variant="ghost" size="sm" onClick={onDiscard} disabled={busy}>Discard</Button>}
        <Button size="sm" onClick={onSave} disabled={!dirty || busy}>{busy && <Loader2 className="animate-spin" />} {saveLabel}</Button>
      </div>
    </div>
  );
}
