import type { Metadata } from "next";
import Link from "next/link";
import { saveEx } from "@/app/actions";
import { PersonForm } from "@/components/forms";

export const metadata: Metadata = { title: "Add A Past Partner" };

export default function NewEx() {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/app/exes" className="link text-sm">← Past partners</Link>
      <h1 className="mb-6 mt-3 text-4xl font-semibold">Add a past partner</h1>
      <div className="card"><PersonForm action={saveEx} kind="ex" submit="Add" /></div>
    </div>
  );
}
