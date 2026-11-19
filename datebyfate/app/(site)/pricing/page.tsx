import type { Metadata } from "next";
import Link from "next/link";
import { startCheckout } from "@/app/actions";
import { SiteHeader } from "@/components/site-chrome";
import { FREE_FEATURES, PREMIUM_FEATURES, PRICES } from "@/lib/plans";
import { getUser } from "@/lib/server/auth";
import { billingConfigured } from "@/lib/server/billing";

export const metadata: Metadata = { title: "Pricing", description: "Your own relationship pattern is free. The pattern across your exes, checks on new people and your calendar are on subscription." };

const Tick = () => (
  <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-rose" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default async function Pricing({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const [{ billing }, user] = await Promise.all([searchParams, getUser().catch(() => null)]);
  const ready = billingConfigured();
  const problem = billing === "unavailable" || (!ready && billing) ? "Subscriptions aren’t open yet. Your free reading is available now." : billing === "error" ? "We couldn’t open the payment page. Nothing was charged. Please try again." : null;

  const subscribe = (interval: "monthly" | "yearly", className: string) =>
    user?.premium ? (
      <Link href="/app/account" className={className}>You’re subscribed</Link>
    ) : user ? (
      <form action={startCheckout}>
        <input type="hidden" name="interval" value={interval} />
        <button type="submit" className={`${className} w-full`}>Subscribe {interval}</button>
      </form>
    ) : (
      <Link href="/signup" className={className}>Create an account to subscribe</Link>
    );

  return (
    <>
      <SiteHeader />
      <main className="container py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Your pattern is free. The proof is on subscription.</h1>
          <p className="mt-3 text-ink-2">Cancel any time from your account. You keep access until the end of the period you paid for.</p>
        </div>
        {problem && <p role="alert" className="mx-auto mt-6 max-w-xl rounded-xl bg-gold-soft px-4 py-3 text-center text-sm">{problem}</p>}

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-3">
          <section className="card flex flex-col">
            <h2 className="text-2xl font-semibold">Free</h2>
            <p className="mt-3"><span className="font-display text-4xl font-semibold">$0</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-ink-2">
              {FREE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Tick />{f}</li>)}
            </ul>
            <Link href={user ? "/app" : "/reading"} className="btn-ghost mt-6">{user ? "Go to your pattern" : "Get your free pattern"}</Link>
          </section>

          <section className="card flex flex-col">
            <h2 className="text-2xl font-semibold">Monthly</h2>
            <p className="mt-3"><span className="font-display text-4xl font-semibold">{PRICES.monthly.label}</span> <span className="text-muted">a month</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-ink-2">
              <li className="flex gap-2.5"><Tick />Everything in Free</li>
              {PREMIUM_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Tick />{f}</li>)}
            </ul>
            <div className="mt-6">{subscribe("monthly", "btn-dark")}</div>
          </section>

          <section className="card relative flex flex-col !border-rose">
            <p className="absolute -top-3 left-6 rounded-full bg-rose px-3 py-0.5 text-xs font-semibold text-white">4 months free</p>
            <h2 className="text-2xl font-semibold">Yearly</h2>
            <p className="mt-3"><span className="font-display text-4xl font-semibold">{PRICES.yearly.label}</span> <span className="text-muted">a year · {PRICES.yearly.monthlyEquivalent} a month</span></p>
            <ul className="mt-5 flex-1 space-y-2.5 text-ink-2">
              <li className="flex gap-2.5"><Tick />Everything in Monthly</li>
              <li className="flex gap-2.5"><Tick />One payment a year</li>
            </ul>
            <div className="mt-6">{subscribe("yearly", "btn-primary")}</div>
          </section>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted">Payments are handled by Stripe. Datebyfate never sees or stores your card number.</p>
      </main>
    </>
  );
}
