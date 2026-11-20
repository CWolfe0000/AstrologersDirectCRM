import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { AuthForm } from "@/components/forms";
import { getUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Sign In" };

export default async function Login() {
  if (await getUser()) redirect("/app");
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold">Sign in</h1>
      <AuthForm
        action={login}
        submit="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <div className="mt-5 flex justify-between text-sm">
        <Link className="link" href="/reset">Forgot your password?</Link>
        <Link className="link" href="/signup">Create an account</Link>
      </div>
    </>
  );
}
