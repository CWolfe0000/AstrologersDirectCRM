import type { Metadata } from "next";
import Link from "next/link";
import { savePartner } from "@/app/actions";
import { PageHeader } from "@/components/app-shell";
import { PersonForm } from "@/components/forms";
import type { Status } from "@/lib/people";

export const metadata: Metadata = { title: "Add A Person" };

const COPY: Record<Status, { title: string; subtitle: string; submit: string }> = {
  past: { title: "Add A Past Partner", subtitle: "A birth date is enough. Add the dates of the relationship if you remember them.", submit: "Add" },
  current: { title: "Add Your Current Partner", subtitle: "A birth date is enough. Add when you met and when it began if you remember.", submit: "Add and read" },
  new: { title: "Add Someone New", subtitle: "Someone you have met or are getting to know.", submit: "Add and read" },
};

export default async function NewPerson({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind;
  const status: Status = kind === "ex" ? "past" : kind === "current" ? "current" : "new";
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/app/people" className="link text-[13px]">← People</Link>
      <div className="mt-3"><PageHeader title={COPY[status].title} subtitle={COPY[status].subtitle} /></div>
      <div className="card"><PersonForm action={savePartner} status={status} submit={COPY[status].submit} /></div>
    </div>
  );
}
