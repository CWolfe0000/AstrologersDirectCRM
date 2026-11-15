"use client";

import { ServerInvite } from "@/components/auth/server-forms";
import { DATA_MODE } from "@/lib/utils";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, BookOpen, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { AuthHeading } from "@/components/marketing/auth-ui";

function DemoInvitePage() {
  const router = useRouter();
  const pr = useStore((s) => s.practitioner);
  const [loading, setLoading] = React.useState(false);
  return (
    <>
      <div className="mb-7 flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
        <Avatar name={pr.name} size="lg" />
        <div className="min-w-0">
          <p className="text-[12px] text-muted">Invitation from</p>
          <p className="truncate text-[15px] font-semibold text-ink">{pr.name}</p>
          <p className="truncate text-[12.5px] text-muted">{pr.practice}</p>
        </div>
      </div>
      <AuthHeading title="Accept your invitation" body={`${pr.firstName} has invited you to a private client portal, where your readings, recordings and consultation details will be kept.`} />
      <ul className="mb-7 space-y-2.5 text-[13.5px] text-ink-3">
        <li className="flex items-center gap-2.5"><BookOpen className="size-4 text-accent" /> Read, listen to and watch your readings</li>
        <li className="flex items-center gap-2.5"><CalendarDays className="size-4 text-accent" /> See upcoming and past consultations</li>
        <li className="flex items-center gap-2.5"><Lock className="size-4 text-accent" /> Private to you and your astrologer</li>
      </ul>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => router.push("/portal"), 700);
        }}
      >
        <Field label="Email" htmlFor="em">
          <Input id="em" type="email" value="amelia.hart@example.com" readOnly className="bg-canvas-2 text-muted" />
        </Field>
        <Field label="Create a password" htmlFor="pw" hint="At least 12 characters.">
          <Input id="pw" type="password" required minLength={12} autoComplete="new-password" defaultValue="demo-password-1" />
        </Field>
        <Checkbox required defaultChecked label={<span className="text-[13px] text-muted">Email me when a new reading is shared</span>} />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Accept and open my portal
        </Button>
      </form>
      <p className="mt-6 text-center text-[12px] text-muted">Your astrologer’s private notes are never visible in the portal.</p>
    </>
  );
}

export default function InvitePage() {
  return DATA_MODE === "demo" ? <DemoInvitePage /> : <ServerInvite />;
}
