/** Taking payment at booking: prices, refund policies and how they read to clients. */

export interface RefundPolicy {
  /** Full refund when a client cancels at least this many hours before. */
  fullRefundHours: number;
  /** After that: this share of the price is refunded (0 = none). */
  lateRefundPercent: number;
}
export const DEFAULT_REFUND_POLICY: RefundPolicy = { fullRefundHours: 24, lateRefundPercent: 0 };

/** "$150", "150", "$1,200.50", "USD 90" → cents; "", "Free", "Sliding scale" → null (no online payment). */
export function priceCents(price: string | undefined): number | null {
  const m = (price ?? "").replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const cents = Math.round(Number(m[1]) * 100);
  return cents >= 50 ? cents : null; // Stripe's minimum charge is 50¢
}

export const money = (cents: number, currency = "usd") => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

const hoursText = (h: number) => (h % 24 === 0 && h > 0 ? `${h / 24} day${h === 24 ? "" : "s"}` : `${h} hour${h === 1 ? "" : "s"}`);

/** One plain sentence for the booking page, the confirmation email and Settings. */
export function refundPolicyText(p: RefundPolicy) {
  if (p.fullRefundHours === 0) return "Cancel any time before your session for a full refund.";
  const late = p.lateRefundPercent >= 100 ? "a full refund" : p.lateRefundPercent > 0 ? `a ${p.lateRefundPercent}% refund` : "no refund";
  return `Cancel at least ${hoursText(p.fullRefundHours)} before your session for a full refund; after that, ${late}.`;
}

/** What a cancellation `hoursBefore` the session gets back. */
export function refundFor(amount: number, p: RefundPolicy, hoursBefore: number) {
  if (hoursBefore >= p.fullRefundHours) return amount;
  return Math.floor((amount * Math.min(100, Math.max(0, p.lateRefundPercent))) / 100);
}
