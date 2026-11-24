"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { CallRoom, type JoinInfo } from "@/components/call/call-room";

/** The client's side of a live session, from their portal. */
export default function PortalCallPage() {
  const { id } = useParams<{ id: string }>();
  const join = React.useCallback(() => api<JoinInfo>(`/api/v1/portal/consultations/${encodeURIComponent(decodeURIComponent(id))}/call`, { body: {} }), [id]);
  return (
    <div className="space-y-4">
      <Link href="/portal/consultations" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Your Sessions</Link>
      <CallRoom role="client" join={join} />
    </div>
  );
}
