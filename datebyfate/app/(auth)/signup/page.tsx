import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/actions";
import { AuthForm } from "@/components/forms";
import { getUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Create Your Account" };

export default async function Signup() {
  if (await getUser()) redirect("/app");
  return (
    <>
      <h1 className="text-3xl font-semibold">Create Your Account</h1>
      <p className="mb-6 mt-1.5 text-muted">Free. Your own pattern is saved and waiting each time you come back.</p>
      <AuthForm
        action={signup}
        submit="Create account"
        fields={[
          { name: "name", label: "First name", type: "text", autoComplete: "given-name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 10 characters." },
        ]}
      />
      <p className="mt-5 text-sm text-muted">
        By creating an account you agree to the <Link className="link" href="/terms">terms</Link> and <Link className="link" href="/privacy">privacy notice</Link>.
      </p>
      <p className="mt-3 text-sm">Already have an account? <Link className="link" href="/login">Sign in</Link></p>
    </>
  );
}
