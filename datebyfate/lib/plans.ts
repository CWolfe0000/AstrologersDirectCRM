/**
 * What is free and what the subscription adds. Prices shown on the site; the
 * amounts actually charged are the Stripe prices in STRIPE_PRICE_MONTHLY and
 * STRIPE_PRICE_YEARLY — keep the two in step.
 */
export const PRICES = {
  monthly: { amount: 12, label: "$12", per: "month" },
  yearly: { amount: 96, label: "$96", per: "year", monthlyEquivalent: "$8" },
} as const;

export type Interval = keyof typeof PRICES;

export const FREE_FEATURES = ["Your own relationship pattern, from your birth chart", "How you love, what you need and who you are drawn to", "Your element balance and your recurring dynamics", "Your next relationship period", "Today’s planetary hours where you live, and what each is used for"];

export const PREMIUM_FEATURES = [
  "The pattern across your past partners, checked against chance",
  "Check anyone new against your pattern",
  "Each partner read on their own: what you set off, ease and bring out in each other",
  "Full couple reports: your elements together, strengths, friction and the relationship’s own chart",
  "Your relationship calendar for the next 12 months",
  "All forty-nine planetary hour and day pairings, with the next time each falls",
  "A planetary practice for each of your difficult dynamics, with the next times to do it",
];
