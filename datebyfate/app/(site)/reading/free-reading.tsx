"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { freeReading, type FreeReading } from "@/app/actions";
import { BirthFields } from "@/components/birth-fields";
import { stashBirth } from "@/components/forms";
import { ChartWheel } from "@/components/chart/wheel";
import { Locked, PatternBody, PatternHeadline } from "@/components/reading";
import type { Birth } from "@/lib/astro/types";

export function FreeReadingTool({ signedIn }: { signedIn: boolean }) {
  const [birth, setBirth] = useState<Birth | null>(null);
  const [result, setResult] = useState<FreeReading | null>(null);
  const [pending, start] = useTransition();

  if (result && "pattern" in result)
    return (
      <div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]">
          <div className="card"><ChartWheel chart={result.chart} label="Your birth chart" /></div>
          <PatternHeadline pattern={result.pattern} placements={result.placements} />
        </div>
        <PatternBody pattern={result.pattern} elements={result.elements} part="all" />
          <section className="mt-12 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="text-2xl font-semibold">Keep this reading</h2>
              <p className="mt-2 text-ink-2">A free account saves your pattern and shows your next relationship period. Your birth details carry over.</p>
              <Link href={signedIn ? "/app" : "/signup"} className="btn-dark mt-4">{signedIn ? "Go to your pattern" : "Create a free account"}</Link>
            </div>
            <Locked title="Now find out whether it is true" signedIn={signedIn}>
              <p>This is what your chart says. Add your past partners and Datebyfate shows what they actually had in common, measured against chance, and checks anyone new against it.</p>
            </Locked>
          </section>

        <button type="button" className="link mt-8" onClick={() => setResult(null)}>Read a different chart</button>
      </div>
    );

  return (
    <form
      className="card mx-auto max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!birth) return setResult({ error: "Choose your birthplace from the list." });
        stashBirth(birth);
        start(async () => setResult(await freeReading(birth)));
      }}
    >
      <BirthFields who="you" onChange={setBirth} />
      {result && "error" in result && <p role="alert" className="rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose-hover">{result.error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>{pending ? "Reading your chart…" : "Show my pattern"}</button>
      <p className="text-center text-sm text-muted">We use these details to calculate your chart. Nothing is saved unless you create an account.</p>
    </form>
  );
}
