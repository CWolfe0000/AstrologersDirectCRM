import { index, integer, pgTable, text, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";

/**
 * Data model. Birth data and names of the people a member adds are sensitive
 * (and mostly belong to third parties), so they live in `sealed`:
 * AES-256-GCM encrypted JSON (lib/server/crypto.ts).
 */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    /** Billing state, mirrored from Stripe by the webhook (lib/server/billing.ts). */
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    /** Stripe subscription status: active, trialing, past_due, canceled, … */
    subscriptionStatus: text("subscription_status"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    /** Complimentary access set by `npm run plan` (staff, testers); not touched by Stripe. */
    compPremium: boolean("comp_premium").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_stripe_customer_idx").on(t.stripeCustomerId)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Single-use emailed tokens (password reset). */
export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["reset"] }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/**
 * The member themself ("self", at most one), past partners ("ex") and people
 * they are seeing or considering ("match").
 */
export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["self", "ex", "match"] }).notNull(),
    /** Encrypted PersonData (lib/people.ts). */
    sealed: text("sealed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("people_user_idx").on(t.userId)],
);

/** Emails, kept when no provider is configured (development) and as a delivery log otherwise. */
export const outbox = pgTable("outbox", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Stripe webhook events already handled (deliveries can repeat). */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
