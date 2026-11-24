import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveEx, saveMatch } from "@/app/actions";
import { PersonForm } from "@/components/forms";
import { requireUser } from "@/lib/server/auth";
import { getPerson } from "@/lib/server/people";

export const metadata: Metadata = { title: "Edit Details" };

export default async function EditPerson({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const person = await getPerson(user.id, id);
  if (!person || person.kind === "self") notFound();
  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/app/people/${person.id}`} className="link text-sm">← {person.name}</Link>
      <h1 className="mb-6 mt-3 text-[28px]">Edit {person.name}</h1>
      <div className="card"><PersonForm action={person.kind === "ex" ? saveEx : saveMatch} kind={person.kind} initial={person} submit="Save" /></div>
    </div>
  );
}
