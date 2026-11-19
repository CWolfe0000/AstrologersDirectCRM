import type { Metadata } from "next";
import Link from "next/link";
import { logout, openBillingPortal } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { DeleteAccountForm } from "./delete-form";

export const metadata: Metadata = { title: "Account" };

export default async function Account({ searchParams }: { searchParams: Promise<{ checkout?: string; billing?: string }> }) {
  const [{ checkout, billing }, user] = await Promise.all([searchParams, requireUser()]);
  const until = user.currentPeriodEnd ? formatDate(user.currentPeriodEnd.toISOString().slice(0, 10)) : null;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-4xl font-semibold">Account</h1>
      {checkout === "success" && (
        <p role="status" className="rounded-xl bg-gold-soft px-4 py-3">
          {user.premium ? "Thank you. Your subscription is active." : "Thank you. Your payment went through and your subscription is being confirmed. Refresh this page in a moment."}
        </p>
      )}
      {billing === "error" && <p role="alert" className="rounded-xl bg-rose-soft px-4 py-3 text-rose-hover">We couldn’t open the billing page. Please try again.</p>}

      <section className="card">
        <h2 className="text-xl font-semibold">You</h2>
        <p className="mt-2 text-ink-2">{user.name} · {user.email}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/you" className="btn-ghost">Change birth details</Link>
          <form action={logout}><button type="submit" className="btn-ghost">Sign out</button></form>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Subscription</h2>
        {user.comp ? (
          <p className="mt-2 text-ink-2">You have complimentary access to everything.</p>
        ) : user.premium ? (
          <>
            <p className="mt-2 text-ink-2">
              {user.subscriptionStatus === "past_due"
                ? "Your last payment failed. Update your card to keep your subscription."
                : user.cancelAtPeriodEnd
                  ? `Your subscription is cancelled and ends on ${until}. You have full access until then.`
                  : `Your subscription is active${until ? ` and renews on ${until}` : ""}.`}
            </p>
            <form action={openBillingPortal} className="mt-4"><button type="submit" className="btn-dark">Manage billing</button></form>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink-2">You are on the free plan: your own pattern and your next relationship period.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-primary">See plans</Link>
              {user.hasStripeCustomer && <form action={openBillingPortal}><button type="submit" className="btn-ghost">Billing history</button></form>}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Delete account</h2>
        <p className="mt-2 text-ink-2">This removes your details and everyone you have added, and cancels your subscription. It can’t be undone.</p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
