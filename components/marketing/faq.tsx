import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((it) => (
        <details key={it.q} className="group px-5 py-4 md:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
            {it.q}
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
