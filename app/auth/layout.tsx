import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Wordmark, Toaster } from "@/components/ui/misc";

export const metadata: Metadata = { title: { default: "Account", template: "%s · AstrologersDirect" } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 md:px-16">
        <Link href="/" className="self-start" aria-label="AstrologersDirect home">
          <Wordmark />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
        <p className="text-center text-[12px] text-muted">
          Prototype — authentication is simulated. <Link href="/prototype" className="underline hover:text-ink">Prototype guide</Link>
        </p>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col xl:p-16">
        <p className="eyebrow text-[#C9B3BA]">AstrologersDirect</p>
        <div className="mt-auto">
          <h2 className="font-serif text-[46px] leading-[1.05] xl:text-[56px]">
            Your Practice.
            <br />
            <span className="italic text-[#E3C9D0]">Connected.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-[#CFCAD0]">Charts, clients, consultations and your professional knowledge — in one calm, capable workspace.</p>
          <ul className="mt-8 space-y-3 text-[14px] text-[#E4E0E5]">
            {["Every chart linked to the client it describes", "Observations that persist for years", "Readings delivered to a private client portal"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <figure className="mt-14 border-t border-white/10 pt-8">
          <blockquote className="font-serif text-[21px] leading-snug text-[#F1EDEF]">“The technology should support the astrologer’s expertise, not compete with it.”</blockquote>
          <figcaption className="mt-3 text-[12.5px] text-[#9C969E]">AstrologersDirect product philosophy</figcaption>
        </figure>
      </aside>
      <Toaster />
    </div>
  );
}
