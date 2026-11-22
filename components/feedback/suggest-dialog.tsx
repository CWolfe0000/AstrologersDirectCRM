"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { DATA_MODE } from "@/lib/utils";
import { FEEDBACK_AREAS } from "@/lib/feedback";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";

/** Anywhere in the app: open the "Suggest a Feature" dialog. */
export function useSuggestFeature() {
  const [open, setOpen] = React.useState(false);
  return { open: () => setOpen(true), dialog: <SuggestDialog open={open} onOpenChange={setOpen} /> };
}

export function SuggestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const toast = useStore((s) => s.toast);
  const [area, setArea] = React.useState<(typeof FEEDBACK_AREAS)[number]>(FEEDBACK_AREAS[0]);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      if (DATA_MODE === "server") await api("/api/v1/feedback", { body: { area, text } });
      toast("Thank You", "Your suggestion reached the team. You’ll see what we build on the What’s New page.", "success");
      setText("");
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Suggest a Feature" description="What would make your practice easier? We read every suggestion." footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={send} disabled={busy || text.trim().length < 5}><Lightbulb /> {busy ? "Sending…" : "Send Suggestion"}</Button></>}>
        <div className="space-y-4 px-6 pb-2">
          <Field label="About" htmlFor="fb-area">
            <Select id="fb-area" value={area} onChange={(e) => setArea(e.target.value as typeof area)}>
              {FEEDBACK_AREAS.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="Your Suggestion" htmlFor="fb-text" hint="What you’d like, and what it would help you do.">
            <Textarea id="fb-text" rows={5} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
