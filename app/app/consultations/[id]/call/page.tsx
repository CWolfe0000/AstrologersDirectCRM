"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { useStore, personName } from "@/lib/store";
import { fmtDuration } from "@/lib/utils";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CallRoom, type JoinInfo } from "@/components/call/call-room";

type Pending = { blob: Blob; durationSec: number; title: string; url: string };

/** The astrologer's side of a live session: the call, and saving its recording to the client's record. */
export default function AstrologerCallPage() {
  const { id } = useParams<{ id: string }>();
  const k = useStore((s) => s.consultations.find((x) => x.id === id));
  const person = useStore((s) => s.people.find((p) => p.id === k?.clientId));
  const addRecording = useStore((s) => s.addRecording);
  const updateConsultation = useStore((s) => s.updateConsultation);
  const toast = useStore((s) => s.toast);
  const [pending, setPending] = React.useState<Pending[]>([]);
  const [busy, setBusy] = React.useState<number | null>(null);

  const join = React.useCallback(() => api<JoinInfo>(`/api/v1/calls/${encodeURIComponent(id)}`, { body: {} }), [id]);
  const onRecording = React.useCallback((blob: Blob, durationSec: number, info: JoinInfo) => {
    setPending((p) => [...p, { blob, durationSec, title: `${info.title}: Session Recording`, url: URL.createObjectURL(blob) }]);
  }, []);

  const save = async (i: number) => {
    const r = pending[i];
    if (!r || !k) return;
    setBusy(i);
    try {
      const file = new File([r.blob], `${r.title.replace(/[^\w]+/g, "_")}.${r.blob.type.includes("mp4") ? "m4a" : "webm"}`, { type: r.blob.type.split(";")[0] || "audio/webm" });
      const up = await uploadFile(file, () => {});
      const rec = addRecording({ clientId: k.clientId, title: r.title.trim() || "Session Recording", mode: "audio", durationSec: r.durationSec, status: "saved", fileKey: up.key, contentType: up.contentType });
      updateConsultation(k.id, { recordingIds: [...(k.recordingIds ?? []), rec.id] });
      URL.revokeObjectURL(r.url);
      setPending((p) => p.filter((_, j) => j !== i));
      toast("Recording Saved", `In ${person ? personName(person) : "the client"}’s record. Deliver it from the Recording Studio or Reading Delivery.`, "success");
    } catch (e) {
      toast("Couldn’t Save the Recording", (e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  if (!k) return <PageHeader title="Call" description="Loading…" />;
  return (
    <div>
      <Link href={`/app/consultations?id=${encodeURIComponent(k.id)}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Back to the Session</Link>
      <PageHeader title={`Call: ${k.type}`} description={person ? `With ${personName(person)}. Recording takes both sides’ audio in your browser; your client sees when it’s on. Ask their permission first.` : undefined} />
      <CallRoom role="astrologer" join={join} onRecording={onRecording} />
      {pending.length > 0 && (
        <div className="mt-5 space-y-3">
          {pending.map((r, i) => (
            <div key={r.url} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[14px] font-semibold text-ink">New Recording · {fmtDuration(r.durationSec)}</p>
              <audio controls src={r.url} className="mt-2 w-full" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input aria-label="Recording title" value={r.title} maxLength={300} onChange={(e) => setPending((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className="min-w-[240px] flex-1" />
                <Button onClick={() => void save(i)} disabled={busy !== null}>{busy === i ? <Loader2 className="animate-spin" /> : <Save />} Save to Client Record</Button>
                <Button variant="ghost" onClick={() => { URL.revokeObjectURL(r.url); setPending((p) => p.filter((_, j) => j !== i)); }}><Trash2 /> Discard</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
