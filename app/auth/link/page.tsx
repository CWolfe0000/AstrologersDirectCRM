"use client";

import { ServerLinkSignIn } from "@/components/auth/server-forms";

/** Opened from the sign-in email (server mode only). */
export default function LinkPage() {
  return <ServerLinkSignIn />;
}
