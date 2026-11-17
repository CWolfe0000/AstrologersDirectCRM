import Link from "next/link";
import { Wordmark } from "@/components/ui/misc";

const COLS = [
  { title: "Product", links: [["Features", "/features"], ["How It Works", "/how-it-works"], ["Pricing", "/pricing"], ["Client Portal", "/portal"], ["Prototype guide", "/prototype"]] },
  { title: "Company", links: [["About", "/about"], ["Contact", "/contact"], ["Help center", "/contact#help"]] },
  { title: "Account", links: [["Sign in", "/auth/login"], ["Create account", "/auth/signup"], ["Accept invitation", "/auth/invite"]] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas-2/60">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-[13.5px] text-muted">Professional chart tools and client relationships, together in one workspace for working astrologers.</p>
          <p className="mt-4 font-serif text-[18px] italic text-ink-3">Better tools. Stronger client relationships.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="eyebrow mb-3">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map(([l, h]) => (
                <li key={h}>
                  <Link href={h!} className="text-[13.5px] text-ink-3 hover:text-accent">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col gap-3 py-5 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AstrologersDirect. Private beta.</p>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="hover:text-ink">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-ink">Terms of Service</Link>
            <Link href="/contact" className="hover:text-ink">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
