import { bigint, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Data model.
 *
 * Accounts (practices, users, sessions, tokens) are fully relational.
 *
 * Practice records (people, clients, charts, …) share one shape:
 *   - (practice_id, id) primary key — every row belongs to exactly one practice
 *   - a few relational columns used for scoping and lookups (client_id, status)
 *   - `data`   jsonb: non-sensitive fields
 *   - `sealed` text: AES-256-GCM encrypted JSON of sensitive fields
 *     (birth data, notes, observation bodies, messages — see lib/server/records.ts)
 *
 * Records keep the same shape as the UI types in lib/data/types.ts so the
 * interface works unchanged; individual columns can be promoted out of
 * `data` as reporting or search needs grow.
 */

export const practices = pgTable("practices", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** "standard" (natal + synastry) or "premium" (all chart techniques and the timeline). Set by billing later. */
  plan: text("plan").notNull().default("standard"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    practiceId: text("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    name: text("name").notNull(),
    /** owner = practitioner; client = client-portal user */
    role: text("role", { enum: ["owner", "client"] }).notNull(),
    /** For client-portal users: the client record they may see. */
    clientId: text("client_id"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    /** Encrypted TOTP secret (pending until totp_enabled_at is set). */
    totpSecret: text("totp_secret"),
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    /** JSON array of SHA-256 hashes of unused recovery codes. */
    recoveryCodes: text("recovery_codes"),
    /** Last accepted TOTP time step — a code can't be used twice. */
    totpLastStep: bigint("totp_last_step", { mode: "number" }),
    /** Consecutive failed sign-in attempts (password or code) and the resulting lockout. */
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_practice_idx").on(t.practiceId)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    /** SHA-256 of the emailed token. */
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["verify", "reset", "invite", "mfa"] }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    /** Failed uses (2FA tickets are invalidated after a few wrong codes). */
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

/** Outgoing email log. In development (no RESEND_API_KEY) this is the only delivery. */
export const outbox = pgTable("outbox", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const practiceSettings = pgTable("practice_settings", {
  practiceId: text("practice_id").primaryKey().references(() => practices.id, { onDelete: "cascade" }),
  practitioner: jsonb("practitioner").notNull(),
  defaults: jsonb("defaults").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

function recordTable(name: string) {
  return pgTable(
    name,
    {
      practiceId: text("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
      id: text("id").notNull(),
      clientId: text("client_id"),
      data: jsonb("data").notNull(),
      sealed: text("sealed"),
      /** Increments on every save; writes based on an older version are rejected (edit-conflict protection). */
      version: integer("version").notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.practiceId, t.id] }),
      index(`${name}_client_idx`).on(t.practiceId, t.clientId),
      index(`${name}_updated_idx`).on(t.practiceId, t.updatedAt),
    ],
  );
}

export const people = recordTable("people");
export const clients = recordTable("clients");
export const charts = recordTable("charts");
export const observations = recordTable("observations");
export const consultations = recordTable("consultations");
export const tasks = recordTable("tasks");
export const readings = recordTable("readings");
export const recordings = recordTable("recordings");
export const files = recordTable("files");
export const notifications = recordTable("notifications");
export const activity = recordTable("activity");
export const portalNotifications = recordTable("portal_notifications");
export const clientWork = recordTable("client_work");
export const workResponses = recordTable("work_responses");

/** Deleted records, so other open devices can remove them too. */
export const tombstones = pgTable(
  "tombstones",
  {
    practiceId: text("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
    collection: text("collection").notNull(),
    id: text("id").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.practiceId, t.collection, t.id] }), index("tombstones_deleted_idx").on(t.practiceId, t.deletedAt)],
);

/** Server-kept history of observation text (encrypted). At most one snapshot per 10 minutes of editing. */
export const observationSnapshots = pgTable(
  "observation_snapshots",
  {
    id: text("id").primaryKey(),
    practiceId: text("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
    observationId: text("observation_id").notNull(),
    sealed: text("sealed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("observation_snapshots_obs_idx").on(t.practiceId, t.observationId, t.createdAt)],
);

/** Private calendar subscription link (one per practice; the token is stored hashed). */
export const calendarFeeds = pgTable("calendar_feeds", {
  practiceId: text("practice_id").primaryKey().references(() => practices.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Consultation reminder emails already sent (so each is sent once). */
export const remindersSent = pgTable(
  "reminders_sent",
  {
    practiceId: text("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
    consultationId: text("consultation_id").notNull(),
    /** The consultation start the reminder was for — a rescheduled session gets a new reminder. */
    start: text("start").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.practiceId, t.consultationId, t.start] })],
);

export const RECORD_TABLES = {
  people,
  clients,
  charts,
  observations,
  consultations,
  tasks,
  readings,
  recordings,
  files,
  notifications,
  activity,
  portalNotifications,
  clientWork,
  workResponses,
} as const;

export type Collection = keyof typeof RECORD_TABLES;
