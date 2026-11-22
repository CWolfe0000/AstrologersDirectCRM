ALTER TABLE "access_requests" ADD COLUMN "email_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_unsubscribed_at" timestamp with time zone;