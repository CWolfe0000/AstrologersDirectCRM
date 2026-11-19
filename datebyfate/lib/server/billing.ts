import "server-only";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import type { Interval } from "@/lib/plans";
import { db, schema } from "./db";
import { env } from "./env";

/**
 * Subscriptions through Stripe Checkout. The app never decides on its own that
 * someone has paid: the webhook mirrors the subscription's state from Stripe
 * into the users table, and access is read from there (lib/server/auth.ts).
 */

let client: Stripe | undefined;
export function stripe() {
  if (!env.stripe.secretKey) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  return (client ??= new Stripe(env.stripe.secretKey));
}

export function billingConfigured() {
  return !!(env.stripe.secretKey && env.stripe.priceMonthly && env.stripe.priceYearly);
}

async function customerFor(userId: string) {
  const [u] = await db().select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) throw new Error("Unknown user");
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const customer = await stripe().customers.create({ email: u.email, name: u.name, metadata: { userId } });
  await db().update(schema.users).set({ stripeCustomerId: customer.id }).where(eq(schema.users.id, userId));
  return customer.id;
}

/** URL of a Stripe Checkout page for the chosen plan. */
export async function checkoutUrl(userId: string, interval: Interval) {
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: await customerFor(userId),
    client_reference_id: userId,
    line_items: [{ price: interval === "yearly" ? env.stripe.priceYearly : env.stripe.priceMonthly, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId } },
    success_url: `${env.appUrl}/app/account?checkout=success`,
    cancel_url: `${env.appUrl}/pricing`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

/** URL of the Stripe customer portal: change card, switch plan, cancel. */
export async function portalUrl(userId: string) {
  const session = await stripe().billingPortal.sessions.create({ customer: await customerFor(userId), return_url: `${env.appUrl}/app/account` });
  return session.url;
}

/** Copies a subscription's current state from Stripe to its user. */
export async function syncSubscription(subscriptionId: string) {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  await applySubscription(sub);
}

export async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // The period end moved from the subscription to its items in newer API versions.
  const periodEnd = (sub.items?.data[0] as { current_period_end?: number } | undefined)?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const values = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end || !!sub.cancel_at,
  };
  const byCustomer = await db().update(schema.users).set(values).where(eq(schema.users.stripeCustomerId, customerId)).returning({ id: schema.users.id });
  if (byCustomer.length === 0 && sub.metadata?.userId) await db().update(schema.users).set(values).where(eq(schema.users.id, sub.metadata.userId));
}

/** Handles one verified webhook event. Safe to receive twice. */
export async function handleStripeEvent(event: Stripe.Event) {
  const fresh = await db().insert(schema.stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning();
  if (fresh.length === 0) return;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.mode === "subscription" && s.subscription) await syncSubscription(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // Events can arrive out of order, so read the current state instead of trusting the payload.
        await syncSubscription(event.data.object.id);
        break;
    }
  } catch (e) {
    // Let Stripe retry.
    await db().delete(schema.stripeEvents).where(eq(schema.stripeEvents.id, event.id));
    throw e;
  }
}

/** Cancels a member's subscription immediately (account deletion). */
export async function cancelSubscriptionNow(subscriptionId: string) {
  await stripe().subscriptions.cancel(subscriptionId);
}
