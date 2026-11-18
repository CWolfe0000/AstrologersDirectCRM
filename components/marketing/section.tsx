import * as React from "react";
import { SIGNUP_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-3 text-accent">{eyebrow}</p>}
      <h2 className="font-serif text-[34px] leading-[1.1] text-ink md:text-[44px]">{title}</h2>
      {body && <p className="mt-4 text-[16px] leading-relaxed text-muted">{body}</p>}
    </div>
  );
}

export function PageIntro({ eyebrow, title, body, children }: { eyebrow: string; title: React.ReactNode; body?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line">
      <div className="container py-16 md:py-24">
        <p className="eyebrow mb-4 text-accent">{eyebrow}</p>
        <h1 className="max-w-3xl font-serif text-[42px] leading-[1.05] text-ink md:text-[60px]">{title}</h1>
        {body && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">{body}</p>}
        {children}
      </div>
    </section>
  );
}

export function FinalCta({
  title = "Build Stronger Client Relationships.",
  body = "The workspace astrologers should have had years ago: one that supports the whole journey with each client. Join the beta and help shape what comes next.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="container py-20 md:py-28">
      <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-14 text-center md:px-16 md:py-20">
        <p className="eyebrow mb-4 text-[#C9B3BA]">Your Practice. Connected.</p>
        <h2 className="mx-auto max-w-2xl font-serif text-[34px] leading-[1.1] text-white md:text-[48px]">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15.5px] text-[#CFCAD0]">{body}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={SIGNUP_URL} size="lg">
            Join the Beta
          </ButtonLink>
          <ButtonLink href="/how-it-works" size="lg" variant="secondary" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25">
            See How It Works
          </ButtonLink>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-[12.5px] text-[#9C969E]">Free during the beta.</p>
      </div>
    </section>
  );
}
