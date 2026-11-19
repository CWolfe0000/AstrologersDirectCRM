import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Logo href="/app" />
            {user.premium ? (
              <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold">Subscriber</span>
            ) : (
              <Link href="/pricing" className="btn-primary !py-2">Subscribe</Link>
            )}
          </div>
          <AppNav />
        </div>
      </header>
      <main className="container pb-24 pt-8">{children}</main>
    </>
  );
}
