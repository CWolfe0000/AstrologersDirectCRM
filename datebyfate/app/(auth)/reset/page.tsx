import type { Metadata } from "next";
import Link from "next/link";
import { requestReset, resetPassword } from "@/app/actions";
import { AuthForm } from "@/components/forms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return token ? (
    <>
      <h1 className="mb-6 text-3xl font-semibold">Choose a new password</h1>
      <AuthForm action={resetPassword} submit="Save password" hidden={{ token }} fields={[{ name: "password", label: "New password", type: "password", autoComplete: "new-password", hint: "At least 10 characters." }]} />
    </>
  ) : (
    <>
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mb-6 mt-1.5 text-muted">Enter your email and we’ll send you a link.</p>
      <AuthForm action={requestReset} submit="Send link" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]} />
      <p className="mt-5 text-sm"><Link className="link" href="/login">Back to sign in</Link></p>
    </>
  );
}
