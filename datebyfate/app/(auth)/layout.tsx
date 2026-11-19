import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-12">
      <Logo />
      <div className="card mt-8 w-full max-w-md">{children}</div>
    </main>
  );
}
