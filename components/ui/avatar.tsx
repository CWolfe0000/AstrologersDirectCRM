import { cn, initials } from "@/lib/utils";

const TONES = [
  "bg-accent-50 text-accent",
  "bg-sage-50 text-sage-dark",
  "bg-[#F3EDE4] text-[#7A6145]",
  "bg-[#ECEEF3] text-[#4D5A70]",
  "bg-[#F2ECF2] text-[#6E4F6E]",
  "bg-[#EEF0E8] text-[#5E6648]",
];

function toneFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = { xs: "size-6 text-[10px]", sm: "size-8 text-[11.5px]", md: "size-9 text-[12.5px]", lg: "size-12 text-[15px]", xl: "size-16 text-xl" }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide", s, toneFor(name), className)} aria-hidden>
      {initials(name)}
    </span>
  );
}
