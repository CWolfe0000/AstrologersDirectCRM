"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/misc";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => setOpen(false), [path]);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-colors", scrolled || open ? "border-line bg-canvas/95 backdrop-blur" : "border-transparent bg-canvas")}>
      <div className="container flex h-16 items-center gap-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={cn("text-[14px] transition-colors hover:text-ink", path === l.href ? "text-ink" : "text-muted")}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/auth/login" variant="ghost" size="sm">
            Sign In
          </ButtonLink>
          <ButtonLink href="/auth/signup" size="sm">
            Get Started
          </ButtonLink>
        </div>
        <button className="ml-auto rounded-md p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-canvas md:hidden">
          <nav className="container flex flex-col py-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="py-2.5 text-[15px] text-ink">
                {l.label}
              </Link>
            ))}
            <Link href="/contact" className="py-2.5 text-[15px] text-ink">
              Contact
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2 pb-2">
              <ButtonLink href="/auth/login" variant="secondary">
                Sign In
              </ButtonLink>
              <ButtonLink href="/auth/signup">Get Started</ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
