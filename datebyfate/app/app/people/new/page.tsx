import type { Metadata } from "next";
import Link from "next/link";
import { saveMatch } from "@/app/actions";
import { PersonForm } from "@/components/forms";

export const metadata: Metadata = { title: "Add someone new" };

export default function NewMatch() {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/app/people" className="link text-sm">← Someone new</Link>
      <h1 className="mt-3 text-4xl font-semibold">Add someone new</h1>
      <p className="mb-6 mt-2 text-ink-2">Someone you have met, are seeing, or are with now.</p>
      <div className="card"><PersonForm action={saveMatch} kind="match" submit="Add and read" /></div>
    </div>
  );
}
