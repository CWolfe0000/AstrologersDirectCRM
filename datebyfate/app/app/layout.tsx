import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell name={user.name} email={user.email} premium={user.premium}>{children}</AppShell>;
}
