"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { CallRoom, type JoinInfo } from "./call-room";

/** The client's side of a live session from their booking link (no sign-in). */
export function BookingCall({ token }: { token: string }) {
  const join = React.useCallback(() => api<JoinInfo>(`/api/public/booking/${encodeURIComponent(token)}/call`, { body: {} }), [token]);
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <a href={`/book/manage/${token}`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Your Booking</a>
        <CallRoom role="client" join={join} />
      </div>
    </main>
  );
}
