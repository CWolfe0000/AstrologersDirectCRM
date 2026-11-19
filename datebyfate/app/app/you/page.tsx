import type { Metadata } from "next";
import Link from "next/link";
import { saveSelf } from "@/app/actions";
import { SelfForm } from "@/components/forms";
import { requireUser } from "@/lib/server/auth";
import { loadContext } from "@/lib/server/readings";

export const metadata: Metadata = { title: "Your birth details" };

export default async function You() {
  const user = await requireUser();
  const { self } = await loadContext(user.id);
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/app" className="link text-sm">← Your pattern</Link>
      <h1 className="mb-6 mt-3 text-4xl font-semibold">Your birth details</h1>
      <div className="card"><SelfForm action={saveSelf} initial={self?.birth} submit="Save" /></div>
    </div>
  );
}
