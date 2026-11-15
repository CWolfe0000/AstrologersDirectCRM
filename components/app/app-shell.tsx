"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import * as D from "@radix-ui/react-dialog";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Toaster } from "@/components/ui/misc";
import { ServerGate, VerifyEmailBanner } from "./server-gate";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const path = usePathname();
  React.useEffect(() => setOpen(false), [path]);

  return (
    <ServerGate view="app">
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        <Sidebar />
      </aside>
      <D.Root open={open} onOpenChange={setOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-ink/40 animate-fade-in lg:hidden" />
          <D.Content className="fixed inset-y-0 left-0 z-50 w-[272px] animate-slide-in-left focus:outline-none lg:hidden">
            <D.Title className="sr-only">Navigation</D.Title>
            <D.Description className="sr-only">Main navigation</D.Description>
            <Sidebar onNavigate={() => setOpen(false)} />
          </D.Content>
        </D.Portal>
      </D.Root>
      <div className="lg:pl-[248px]">
        <VerifyEmailBanner />
        <Topbar onMenu={() => setOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1480px] px-4 py-6 md:px-6 md:py-8 lg:px-8">{children}</main>
      </div>
      <Toaster />
    </div>
    </ServerGate>
  );
}
