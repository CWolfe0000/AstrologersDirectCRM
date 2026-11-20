import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-chrome";
import { getUser } from "@/lib/server/auth";
import { FreeReadingTool } from "./free-reading";

export const metadata: Metadata = { title: "Your Free Relationship Pattern", description: "Enter your birth details and see how you love, what you need, who you are drawn to and the dynamics you repeat." };

export default async function ReadingPage() {
  const user = await getUser().catch(() => null);
  return (
    <>
      <SiteHeader />
      <main className="container py-12">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <p className="eyebrow">Free reading</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Your relationship pattern</h1>
          <p className="mt-3 text-ink-2">How you love, what you need, who you are drawn to and what you repeat.</p>
        </div>
        <FreeReadingTool signedIn={!!user} />
      </main>
    </>
  );
}
