import "server-only";
import { and, desc, eq, lt } from "drizzle-orm";
import { db, schema } from "./db";
import { HttpError } from "./http";
import { link } from "./mail";
import { platformFeePercent, stripe, stripeEnabled } from "./stripe";

type Account = { id: string; charges_enabled?: boolean; details_submitted?: boolean; default_currency?: string; requirements?: { currently_due?: string[]; disabled_reason?: string | null } };

export async function paymentAccount(practiceId: string) {
  const [row] = await db().select().from(schema.paymentAccounts).where(eq(schema.paymentAccounts.practiceId, practiceId));
  return row ?? null;
}

async function store(practiceId: string, a: Account) {
  const values = { stripeAccountId: a.id, chargesEnabled: a.charges_enabled ? 1 : 0, detailsSubmitted: a.details_submitted ? 1 : 0, currency: a.default_currency || "usd", updatedAt: new Date() };
  await db().insert(schema.paymentAccounts).values({ practiceId, ...values }).onConflictDoUpdate({ target: schema.paymentAccounts.practiceId, set: values });
}

/** Stripe told us an account changed (webhook): keep our copy in step. */
export async function accountUpdated(a: Account) {
  const [row] = await db().select().from(schema.paymentAccounts).where(eq(schema.paymentAccounts.stripeAccountId, a.id));
  if (row) await store(row.practiceId, a);
}

/** Where the astrologer stands with Stripe, refreshed from Stripe until they're approved. */
export async function paymentStatus(practiceId: string) {
  if (!stripeEnabled()) return { available: false as const };
  let row = await paymentAccount(practiceId);
  let due: string[] = [];
  if (row && !row.chargesEnabled) {
    const a = await stripe<Account>("GET", `/accounts/${row.stripeAccountId}`).catch(() => null);
    if (a) {
      await store(practiceId, a);
      row = await paymentAccount(practiceId);
      due = a.requirements?.currently_due ?? [];
    }
  }
  const payments = await db().select().from(schema.bookingPayments).where(and(eq(schema.bookingPayments.practiceId, practiceId))).orderBy(desc(schema.bookingPayments.createdAt)).limit(50);
  return {
    available: true as const,
    connected: !!row,
    ready: !!row?.chargesEnabled,
    submitted: !!row?.detailsSubmitted,
    needsInfo: due.length > 0,
    currency: row?.currency ?? "usd",
    feePercent: platformFeePercent(),
    payments: payments
      .filter((p) => p.status !== "pending" && p.status !== "expired")
      .map((p) => ({ id: p.id, status: p.status, amount: p.amount, refunded: p.refunded, currency: p.currency, service: p.serviceName, client: p.clientName, paidAt: p.paidAt?.toISOString() ?? null, consultationId: p.consultationId })),
  };
}

/** Start (or continue) Stripe's onboarding: creates the connected account the first time. */
export async function onboardingLink(practiceId: string, email: string | null, backTo = "/app/settings?section=payments") {
  let row = await paymentAccount(practiceId);
  if (!row) {
    const a = await stripe<Account>(
      "POST",
      "/accounts",
      {
        country: "US",
        ...(email ? { email } : {}),
        // Stripe handles onboarding, verification and fraud losses; the astrologer pays Stripe's fees.
        controller: { losses: { payments: "stripe" }, fees: { payer: "account" }, stripe_dashboard: { type: "express" }, requirement_collection: "stripe" },
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_profile: { mcc: "7299", product_description: "Astrology consultations and readings, booked online." },
        metadata: { practice_id: practiceId },
      },
      { idempotencyKey: `acct-${practiceId}` },
    );
    await store(practiceId, a);
    row = (await paymentAccount(practiceId))!;
  }
  const back = (s: string) => link(`${backTo}${backTo.includes("?") ? "&" : "?"}stripe=${s}`);
  const l = await stripe<{ url: string }>("POST", "/account_links", { account: row.stripeAccountId, type: "account_onboarding", return_url: back("return"), refresh_url: back("refresh") });
  return l.url;
}

/** A one-time sign-in to the astrologer's Stripe Express dashboard (payouts, receipts, disputes). */
export async function dashboardLink(practiceId: string) {
  const row = await paymentAccount(practiceId);
  if (!row?.detailsSubmitted) throw new HttpError(409, "Finish setting up payments first.");
  return (await stripe<{ url: string }>("POST", `/accounts/${row.stripeAccountId}/login_links`)).url;
}

/** Refund what's left of a payment (or `amount` of it). Returns the amount refunded. */
export async function refundPayment(practiceId: string, paymentId: string, amount?: number) {
  const [p] = await db().select().from(schema.bookingPayments).where(and(eq(schema.bookingPayments.practiceId, practiceId), eq(schema.bookingPayments.id, paymentId)));
  if (!p || !p.paymentIntentId || (p.status !== "paid" && p.status !== "partially_refunded")) throw new HttpError(404, "There’s no payment to refund.");
  const left = p.amount - p.refunded;
  const give = Math.min(left, amount ?? left);
  if (give <= 0) return 0;
  await stripe("POST", "/refunds", { payment_intent: p.paymentIntentId, amount: give, ...(process.env.PLATFORM_FEE_PERCENT ? { refund_application_fee: true } : {}), metadata: { booking_payment: p.id } }, { account: p.stripeAccountId, idempotencyKey: `refund-${p.id}-${p.refunded}-${give}` });
  const refunded = p.refunded + give;
  await db().update(schema.bookingPayments).set({ refunded, status: refunded >= p.amount ? "refunded" : "partially_refunded" }).where(eq(schema.bookingPayments.id, p.id));
  return give;
}

/** The paid booking behind a session, if it was paid online. */
export async function paymentForConsultation(practiceId: string, consultationId: string) {
  const [p] = await db().select().from(schema.bookingPayments).where(and(eq(schema.bookingPayments.practiceId, practiceId), eq(schema.bookingPayments.consultationId, consultationId)));
  return p ?? null;
}

/** Checkouts nobody finished: let their held times go (a few minutes after Stripe's own expiry). */
export async function expireAbandoned(now = Date.now()) {
  const gone = await db().update(schema.bookingPayments).set({ status: "expired", sealed: "" }).where(and(eq(schema.bookingPayments.status, "pending"), lt(schema.bookingPayments.expiresAt, new Date(now - 5 * 60_000)))).returning({ id: schema.bookingPayments.id });
  return gone.length;
}
