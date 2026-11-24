import type { Metadata } from "next";
import Link from "next/link";
import { saveEx, saveMatch } from "@/app/actions";
import { PageHeader } from "@/components/app-shell";
import { PersonForm } from "@/components/forms";

export const metadata: Metadata = { title: "Add A Person" };

export default async function NewPerson({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const ex = (await searchParams).kind === "ex";
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/app/people" className="link text-[13px]">← People</Link>
      <div className="mt-3"><PageHeader title={ex ? "Add a past partner" : "Add someone new"} subtitle={ex ? "A birth date is enough. Add the dates of the relationship if you remember them." : "Someone you have met, are seeing, or are with now."} /></div>
      <div className="card"><PersonForm action={ex ? saveEx : saveMatch} kind={ex ? "ex" : "match"} submit={ex ? "Add" : "Add and read"} /></div>
    </div>
  );
}
