"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Your pattern" },
  { href: "/app/exes", label: "Past partners" },
  { href: "/app/people", label: "Someone new" },
  { href: "/app/timing", label: "Calendar" },
  { href: "/app/practice", label: "Practice" },
  { href: "/app/account", label: "Account" },
];

export function AppNav() {
  const path = usePathname();
  const current = (href: string) => (href === "/app" ? path === "/app" || path === "/app/you" : path.startsWith(href));
  return (
    <nav aria-label="Your pages" className="-mx-5 overflow-x-auto px-5">
      <ul className="flex gap-1 whitespace-nowrap">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={current(i.href) ? "page" : undefined}
              className={`block border-b-2 px-3 py-3 text-[15px] font-medium ${current(i.href) ? "border-rose text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
