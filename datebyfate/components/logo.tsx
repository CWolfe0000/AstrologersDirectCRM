import Link from "next/link";

/** Two overlapping circles: two charts, one shared part. */
export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="12" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="20" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 8.6a9 9 0 0 1 0 14.8a9 9 0 0 1 0-14.8z" fill="#C2415B" />
    </svg>
  );
}

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 font-display text-[22px] font-semibold tracking-tight ${light ? "text-cream" : "text-ink"}`}>
      <Mark />
      Datebyfate
    </Link>
  );
}
