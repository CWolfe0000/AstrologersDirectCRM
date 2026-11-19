import Link from "next/link";
import { getUser } from "@/lib/server/auth";
import { Logo } from "./logo";

export async function SiteHeader({ dark = false }: { dark?: boolean }) {
  const user = await getUser().catch(() => null);
  const link = dark ? "text-cream/80 hover:text-cream" : "text-ink-2 hover:text-ink";
  return (
    <header className={dark ? "bg-night" : "border-b border-line bg-cream"}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo light={dark} />
        <nav aria-label="Main" className="flex items-center gap-1 text-[15px] font-medium sm:gap-5">
          <Link href="/method" className={`hidden px-2 py-1 sm:block ${link}`}>How it works</Link>
          <Link href="/pricing" className={`px-2 py-1 ${link}`}>Pricing</Link>
          {user ? (
            <Link href="/app" className={dark ? "btn-light !py-2" : "btn-dark !py-2"}>Your pattern</Link>
          ) : (
            <>
              <Link href="/login" className={`px-2 py-1 ${link}`}>Sign in</Link>
              <Link href="/reading" className={`hidden sm:inline-flex ${dark ? "btn-light" : "btn-dark"} !py-2`}>Free reading</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-cream-2">
      <div className="container grid gap-8 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Astrology is a way of reflecting on your relationships. It is not science and it does not predict what a person will do. Datebyfate is not a substitute for advice from a therapist, doctor or lawyer.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Datebyfate</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li><Link className="hover:text-ink" href="/reading">Free reading</Link></li>
            <li><Link className="hover:text-ink" href="/method">How it works</Link></li>
            <li><Link className="hover:text-ink" href="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Account</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li><Link className="hover:text-ink" href="/login">Sign in</Link></li>
            <li><Link className="hover:text-ink" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-ink" href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-line py-5 text-xs text-muted">© {new Date().getFullYear()} Datebyfate</div>
    </footer>
  );
}
