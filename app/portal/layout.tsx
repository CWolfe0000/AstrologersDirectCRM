import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/portal-shell";
import { ServerGate } from "@/components/app/server-gate";

export const metadata: Metadata = { title: { default: "Client Portal", template: "%s · Client Portal" } };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServerGate view="portal">
      <PortalShell>{children}</PortalShell>
    </ServerGate>
  );
}
